"use client";

import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ImageIcon,
  MoreHorizontal,
  Package,
  Pencil,
  Plus,
  Search,
  Trash2,
  Upload,
} from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { toast } from "sonner";
import { deleteProduct, setProductActive } from "@/actions/products";
import { CsvImportDialog } from "@/components/dashboard/csv-import-dialog";
import { ProductDialog, type EditableProduct } from "@/components/dashboard/product-dialog";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatMAD } from "@/lib/money";

export interface ProductRow {
  id: string;
  name: string;
  sku: string;
  categoryId: string | null;
  categoryName: string | null;
  description: string | null;
  basePriceCentimes: number;
  minOrderQty: number;
  isActive: boolean;
  isFeatured: boolean;
  imageUrl: string | null;
}

export function ProductsTable({
  products,
  categories,
}: {
  products: ProductRow[];
  categories: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [search, setSearch] = React.useState("");
  const [categoryFilter, setCategoryFilter] = React.useState("all");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [sorting, setSorting] = React.useState<SortingState>([{ id: "createdAt", desc: true }]);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<EditableProduct | null>(null);
  const [importOpen, setImportOpen] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<ProductRow | null>(null);
  const [pendingAction, setPendingAction] = React.useState<string | null>(null);

  const filtered = React.useMemo(() => {
    const query = search.trim().toLowerCase();
    return products.filter((product) => {
      const matchesSearch =
        !query ||
        product.name.toLowerCase().includes(query) ||
        product.sku.toLowerCase().includes(query);
      const matchesCategory = categoryFilter === "all" || product.categoryId === categoryFilter;
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && product.isActive) ||
        (statusFilter === "archived" && !product.isActive);
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [products, search, categoryFilter, statusFilter]);

  const columns = React.useMemo<ColumnDef<ProductRow>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Produit",
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-100 bg-slate-50">
              {row.original.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={row.original.imageUrl} alt={row.original.name} className="h-full w-full object-cover" />
              ) : (
                <ImageIcon className="h-4 w-4 text-slate-300" />
              )}
            </div>
            <div className="min-w-0">
              <p className="max-w-[240px] truncate font-medium text-navy">{row.original.name}</p>
              <p className="font-mono text-[11px] text-slate-400">{row.original.sku}</p>
            </div>
          </div>
        ),
      },
      {
        accessorKey: "categoryName",
        header: "Catégorie",
        cell: ({ row }) => (
          <span className="text-xs text-slate-500">{row.original.categoryName ?? "Sans catégorie"}</span>
        ),
      },
      {
        accessorKey: "basePriceCentimes",
        header: "Prix de base",
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-navy">{formatMAD(row.original.basePriceCentimes)}</p>
            <p className="text-[11px] text-slate-400">Min. {row.original.minOrderQty} unités</p>
          </div>
        ),
      },
      {
        accessorKey: "isActive",
        header: "Statut",
        cell: ({ row }) => (
          <div className="flex flex-col gap-1">
            <Badge variant={row.original.isActive ? "success" : "secondary"} className="w-fit">
              {row.original.isActive ? "Disponible" : "Archivé"}
            </Badge>
            {row.original.isFeatured && (
              <Badge variant="teal" className="w-fit">Mis en avant</Badge>
            )}
          </div>
        ),
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        cell: ({ row }) => {
          const product = row.original;
          return (
            <div className="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">Actions</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => {
                      setEditing({
                        id: product.id,
                        name: product.name,
                        sku: product.sku,
                        categoryId: product.categoryId,
                        description: product.description,
                        basePriceCentimes: product.basePriceCentimes,
                        minOrderQty: product.minOrderQty,
                        isActive: product.isActive,
                        isFeatured: product.isFeatured,
                        imageUrl: product.imageUrl,
                      });
                      setDialogOpen(true);
                    }}
                  >
                    <Pencil /> Modifier
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    disabled={pendingAction === product.id}
                    onClick={async () => {
                      setPendingAction(product.id);
                      const result = await setProductActive(product.id, !product.isActive);
                      setPendingAction(null);
                      if (result.error) toast.error(result.error);
                      else {
                        toast.success(result.success);
                        router.refresh();
                      }
                    }}
                  >
                    <Package /> {product.isActive ? "Archiver" : "Rendre disponible"}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-rose-600 focus:text-rose-600"
                    onClick={() => setDeleteTarget(product)}
                  >
                    <Trash2 /> Supprimer
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      },
    ],
    [pendingAction, router]
  );

  const table = useReactTable({
    data: filtered,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  async function confirmDelete() {
    if (!deleteTarget) return;
    setPendingAction(deleteTarget.id);
    const result = await deleteProduct(deleteTarget.id);
    setPendingAction(null);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success(result.success);
    setDeleteTarget(null);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Rechercher un produit ou SKU…"
              className="pl-9"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="Catégorie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes catégories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-36">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous statuts</SelectItem>
              <SelectItem value="active">Disponibles</SelectItem>
              <SelectItem value="archived">Archivés</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}>
            <Upload className="h-4 w-4" /> Importer CSV
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setEditing(null);
              setDialogOpen(true);
            }}
          >
            <Plus className="h-4 w-4" /> Nouveau produit
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-soft">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="bg-slate-50/60">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : header.column.getCanSort() ? (
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 uppercase tracking-wide hover:text-navy"
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        <ArrowUpDown className="h-3 w-3" />
                      </button>
                    ) : (
                      flexRender(header.column.columnDef.header, header.getContext())
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="py-14 text-center">
                  <Package className="mx-auto h-8 w-8 text-slate-300" />
                  <p className="mt-3 text-sm font-medium text-navy">Aucun produit trouvé</p>
                  <p className="mt-1 text-xs text-slate-400">
                    {products.length === 0
                      ? "Ajoutez votre premier produit ou importez votre catalogue CSV."
                      : "Modifiez vos filtres de recherche."}
                  </p>
                  {products.length === 0 && (
                    <Button
                      size="sm"
                      className="mt-4"
                      onClick={() => {
                        setEditing(null);
                        setDialogOpen(true);
                      }}
                    >
                      <Plus className="h-4 w-4" /> Ajouter un produit
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {table.getPageCount() > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
            <p className="text-xs text-slate-400">
              {table.getState().pagination.pageIndex * 10 + 1}–
              {Math.min((table.getState().pagination.pageIndex + 1) * 10, filtered.length)} sur {filtered.length}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <ChevronLeft className="h-3.5 w-3.5" /> Précédent
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                Suivant <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>

      <ProductDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        product={editing}
        categories={categories}
        onSaved={() => router.refresh()}
      />

      <CsvImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        onImported={() => router.refresh()}
      />

      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer ce produit ?</DialogTitle>
            <DialogDescription>
              <span className="font-medium text-navy">{deleteTarget?.name}</span> sera définitivement supprimé.
              Si le produit apparaît dans des commandes, archivez-le plutôt.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Annuler</Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={!!pendingAction}>
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
