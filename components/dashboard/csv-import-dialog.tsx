"use client";

import { AlertCircle, CheckCircle2, Download, FileSpreadsheet, Loader2, Upload } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import { importProducts, previewCsv, type ImportResult } from "@/actions/products";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { ParsedCsvRow } from "@/lib/csv";
import { formatMAD } from "@/lib/money";

export function CsvImportDialog({
  open,
  onOpenChange,
  onImported,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImported: () => void;
}) {
  const [pending, setPending] = React.useState(false);
  const [rows, setRows] = React.useState<ParsedCsvRow[] | null>(null);
  const [fileErrors, setFileErrors] = React.useState<string[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<ImportResult | null>(null);
  const [fileName, setFileName] = React.useState<string>("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  const reset = () => {
    setRows(null);
    setFileErrors([]);
    setError(null);
    setResult(null);
    setFileName("");
    setPending(false);
    if (inputRef.current) inputRef.current.value = "";
  };

  React.useEffect(() => {
    if (!open) reset();
  }, [open]);

  async function analyze() {
    const file = inputRef.current?.files?.[0];
    if (!file) {
      setError("Sélectionnez un fichier CSV.");
      return;
    }
    setPending(true);
    setError(null);
    setFileErrors([]);
    setRows(null);
    const formData = new FormData();
    formData.set("file", file);
    setFileName(file.name);
    const preview = await previewCsv(formData);
    setPending(false);
    if (preview.error) {
      setError(preview.error);
      return;
    }
    if (preview.fileErrors?.length) {
      setFileErrors(preview.fileErrors);
      return;
    }
    setRows(preview.rows ?? []);
  }

  async function runImport() {
    if (!rows) return;
    const validRows = rows.filter((row) => row.errors.length === 0);
    if (validRows.length === 0) {
      setError("Aucune ligne valide à importer.");
      return;
    }
    setPending(true);
    setError(null);
    const importResult = await importProducts(validRows);
    setPending(false);
    if (importResult.error) {
      setError(importResult.error);
      return;
    }
    setResult(importResult);
    toast.success(`${importResult.imported ?? 0} produit(s) importé(s)`);
    onImported();
  }

  const validCount = rows?.filter((row) => row.errors.length === 0).length ?? 0;
  const invalidCount = (rows?.length ?? 0) - validCount;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Importer des produits (CSV)</DialogTitle>
          <DialogDescription>
            Analysez le fichier avant import. Les références (SKU) existantes et les doublons sont détectés.
          </DialogDescription>
        </DialogHeader>

        {result ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
              <div className="flex items-center gap-2 text-emerald-700">
                <CheckCircle2 className="h-5 w-5" />
                <p className="font-medium">Import terminé</p>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-3 text-center">
                <div className="rounded-lg bg-white/70 p-3">
                  <p className="text-xl font-semibold text-navy">{result.imported ?? 0}</p>
                  <p className="text-[11px] text-slate-500">Importés</p>
                </div>
                <div className="rounded-lg bg-white/70 p-3">
                  <p className="text-xl font-semibold text-navy">{result.skipped ?? 0}</p>
                  <p className="text-[11px] text-slate-500">Ignorés (doublons)</p>
                </div>
                <div className="rounded-lg bg-white/70 p-3">
                  <p className="text-xl font-semibold text-navy">{result.categoriesCreated ?? 0}</p>
                  <p className="text-[11px] text-slate-500">Catégories créées</p>
                </div>
              </div>
            </div>

            {result.errors && result.errors.length > 0 && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm font-medium text-amber-800">Lignes non importées</p>
                <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto text-xs text-amber-700">
                  {result.errors.map((message, index) => (
                    <li key={index}>• {message}</li>
                  ))}
                </ul>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={reset}>Importer un autre fichier</Button>
              <Button onClick={() => onOpenChange(false)}>Terminer</Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <FileSpreadsheet className="mt-0.5 h-5 w-5 text-slate-400" />
                <div>
                  <p className="text-sm font-medium text-navy">Fichier CSV</p>
                  <p className="text-xs text-slate-500">
                    Colonnes : name, sku, category, description, base_price, min_order_qty, is_active
                  </p>
                </div>
              </div>
              <Button asChild variant="outline" size="sm">
                <a href="/api/products/csv-template" download>
                  <Download className="h-4 w-4" /> Modèle CSV
                </a>
              </Button>
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                <AlertCircle className="mt-0.5 h-4 w-4" /> {error}
              </div>
            )}

            {fileErrors.length > 0 && (
              <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                <p className="font-medium">Le fichier ne peut pas être importé :</p>
                <ul className="mt-2 space-y-1 text-xs">
                  {fileErrors.map((message, index) => <li key={index}>• {message}</li>)}
                </ul>
              </div>
            )}

            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                ref={inputRef}
                type="file"
                accept=".csv,text/csv"
                className="block w-full flex-1 cursor-pointer rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-500 file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-navy"
              />
              <Button type="button" onClick={analyze} disabled={pending} variant="outline">
                {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                Analyser
              </Button>
            </div>

            {rows && (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">{rows.length} ligne(s)</Badge>
                  <Badge variant="success">{validCount} valide(s)</Badge>
                  {invalidCount > 0 && <Badge variant="danger">{invalidCount} en erreur</Badge>}
                  {fileName && <span className="text-xs text-slate-400">{fileName}</span>}
                </div>

                <div className="max-h-72 overflow-auto rounded-lg border border-slate-200">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Ligne</TableHead>
                        <TableHead>Produit</TableHead>
                        <TableHead>SKU</TableHead>
                        <TableHead>Catégorie</TableHead>
                        <TableHead className="text-right">Prix</TableHead>
                        <TableHead>Validation</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows.map((row) => (
                        <TableRow key={row.line} className={row.errors.length > 0 ? "bg-rose-50/50" : undefined}>
                          <TableCell className="text-xs text-slate-400">{row.line}</TableCell>
                          <TableCell className="max-w-[180px] truncate text-xs">{row.name || "—"}</TableCell>
                          <TableCell className="font-mono text-xs">{row.sku || "—"}</TableCell>
                          <TableCell className="text-xs">{row.category || "—"}</TableCell>
                          <TableCell className="text-right text-xs">
                            {row.basePriceCentimes !== null ? formatMAD(row.basePriceCentimes) : row.basePriceRaw || "—"}
                          </TableCell>
                          <TableCell>
                            {row.errors.length === 0 ? (
                              <Badge variant="success">Valide</Badge>
                            ) : (
                              <span className="text-[11px] text-rose-600">{row.errors.join(" · ")}</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={reset}>Annuler</Button>
                  <Button type="button" onClick={runImport} disabled={pending || validCount === 0}>
                    {pending && <Loader2 className="h-4 w-4 animate-spin" />}
                    Importer {validCount} produit(s)
                  </Button>
                </DialogFooter>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
