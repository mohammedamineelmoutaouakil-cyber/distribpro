import { describe, expect, it } from "vitest";
import { parseProductCsv, buildCsvTemplate } from "@/lib/csv";

describe("csv", () => {
  it("parses a valid CSV", () => {
    const csv = [
      "name,sku,category,base_price,min_order_qty,is_active",
      "Mitigeur lavabo chromé,MIT-LAV-001,Robinetterie,349.00,5,true",
    ].join("\n");
    const result = parseProductCsv(csv);
    expect(result.fileErrors).toHaveLength(0);
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].errors).toHaveLength(0);
    expect(result.rows[0].basePriceCentimes).toBe(34900);
    expect(result.rows[0].minOrderQty).toBe(5);
  });

  it("detects duplicates and missing headers", () => {
    const csv = ["name,sku,base_price", "A,SKU1,10", "B,SKU1,20"].join("\n");
    const result = parseProductCsv(csv);
    expect(result.rows[1].errors.join(" ")).toContain("dupliquée");
  });

  it("reports missing required headers", () => {
    const result = parseProductCsv("name,category\nProduit,Catégorie");
    expect(result.fileErrors.join(" ")).toContain("Colonnes obligatoires manquantes");
  });

  it("builds a template", () => {
    const template = buildCsvTemplate();
    expect(template).toContain("name,sku,category");
    expect(template.split("\r\n")).toHaveLength(3);
  });
});
