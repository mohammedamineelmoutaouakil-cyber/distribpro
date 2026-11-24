import Papa from "papaparse";
import { csvRowSchema } from "@/lib/validations";
import { parseMADToCentimes } from "@/lib/money";

export interface ParsedCsvRow {
  line: number;
  name: string;
  sku: string;
  category: string | null;
  description: string | null;
  basePriceCentimes: number | null;
  basePriceRaw: string;
  minOrderQty: number;
  isActive: boolean;
  errors: string[];
}

export interface ParsedCsvResult {
  rows: ParsedCsvRow[];
  fileErrors: string[];
  headers: string[];
}

const HEADER_ALIASES: Record<string, string> = {
  name: "name",
  nom: "name",
  "nom du produit": "name",
  produit: "name",
  sku: "sku",
  reference: "sku",
  référence: "sku",
  ref: "sku",
  category: "category",
  categorie: "category",
  catégorie: "category",
  description: "description",
  base_price: "base_price",
  prix: "base_price",
  "prix mad": "base_price",
  "prix unitaire": "base_price",
  min_order_qty: "min_order_qty",
  "quantite minimum": "min_order_qty",
  "quantité minimum": "min_order_qty",
  moq: "min_order_qty",
  is_active: "is_active",
  actif: "is_active",
  disponible: "is_active",
};

const REQUIRED_HEADERS = ["name", "sku", "base_price"];

function normalizeHeader(header: string) {
  const cleaned = header
    .replace(/^\uFEFF/, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
  return HEADER_ALIASES[cleaned] ?? cleaned.replace(/\s+/g, "_");
}

function parseBoolean(value: string | undefined) {
  if (!value) return true;
  const v = value.trim().toLowerCase();
  return !["false", "0", "non", "no", "inactif", "non disponible"].includes(v);
}

export function parseProductCsv(text: string): ParsedCsvResult {
  const fileErrors: string[] = [];
  const result = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: normalizeHeader,
  });

  if (result.errors.length > 0) {
    for (const error of result.errors.slice(0, 5)) {
      fileErrors.push(`Ligne ${error.row !== undefined ? error.row + 2 : "?"} : ${error.message}`);
    }
  }

  const headers = (result.meta.fields ?? []).filter(Boolean);
  const missing = REQUIRED_HEADERS.filter((h) => !headers.includes(h));
  if (missing.length > 0) {
    fileErrors.push(
      `Colonnes obligatoires manquantes : ${missing.join(", ")}. Téléchargez le modèle CSV.`
    );
  }
  if (fileErrors.length > 0) return { rows: [], fileErrors, headers };

  if (result.data.length === 0) {
    return { rows: [], fileErrors: ["Le fichier ne contient aucune ligne de données."], headers };
  }
  if (result.data.length > 5000) {
    return { rows: [], fileErrors: ["Maximum 5 000 lignes par import."], headers };
  }

  const seen = new Map<string, number>();
  const rows: ParsedCsvRow[] = result.data.map((raw, index) => {
    const line = index + 2;
    const errors: string[] = [];
    const parsed = csvRowSchema.safeParse({
      name: raw.name ?? "",
      sku: raw.sku ?? "",
      category: raw.category ?? undefined,
      description: raw.description ?? undefined,
      base_price: raw.base_price ?? "",
      min_order_qty: raw.min_order_qty ?? undefined,
      is_active: raw.is_active ?? undefined,
    });

    if (!parsed.success) {
      for (const issue of parsed.error.issues) errors.push(issue.message);
    }

    const basePriceCentimes = parseMADToCentimes(raw.base_price ?? "");
    if (basePriceCentimes === null) errors.push("Prix invalide (ex: 1250.00)");

    let minOrderQty = 1;
    if (raw.min_order_qty?.trim()) {
      const n = Number(raw.min_order_qty.replace(",", "."));
      if (!Number.isInteger(n) || n < 1 || n > 100000) {
        errors.push("Quantité minimum invalide");
      } else {
        minOrderQty = n;
      }
    }

    const sku = (raw.sku ?? "").trim();
    if (sku) {
      const key = sku.toLowerCase();
      if (seen.has(key)) {
        errors.push(`Référence dupliquée dans le fichier (déjà ligne ${seen.get(key)})`);
      } else {
        seen.set(key, line);
      }
    }

    return {
      line,
      name: (raw.name ?? "").trim(),
      sku,
      category: raw.category?.trim() || null,
      description: raw.description?.trim() || null,
      basePriceCentimes,
      basePriceRaw: (raw.base_price ?? "").trim(),
      minOrderQty,
      isActive: parseBoolean(raw.is_active),
      errors,
    };
  });

  return { rows, fileErrors, headers };
}

export function buildCsvTemplate() {
  const rows = [
    ["name", "sku", "category", "description", "base_price", "min_order_qty", "is_active"],
    ["Mitigeur lavabo chromé", "MIT-LAV-001", "Robinetterie", "Mitigeur monocommande en laiton chromé", "349.00", "5", "true"],
    ["Câble électrique 2.5mm²", "CAB-25-100", "Électricité", "Rouleau de 100 mètres", "899.50", "1", "true"],
  ];
  return rows
    .map((row) =>
      row
        .map((cell) => (/[",;\n]/.test(cell) ? `"${cell.replace(/"/g, '""')}"` : cell))
        .join(",")
    )
    .join("\r\n");
}
