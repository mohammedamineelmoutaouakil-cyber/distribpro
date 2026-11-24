"use client";

import { Eye, Search, ShoppingCart } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import { OrderStatusSelect } from "@/components/dashboard/order-status-select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ORDER_STATUSES, ORDER_STATUS_META, type OrderStatus } from "@/lib/constants";
import { formatMAD } from "@/lib/money";
import { formatDate } from "@/lib/utils";

export interface OrderRow {
  id: string;
  reference: string;
  status: OrderStatus;
  customerName: string;
  contactName: string | null;
  totalCentimes: number;
  itemCount: number;
  createdAt: string;
  notes: string | null;
}

export function OrdersTable({ orders }: { orders: OrderRow[] }) {
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");

  const filtered = React.useMemo(() => {
    const query = search.trim().toLowerCase();
    return orders.filter((order) => {
      const matchesSearch =
        !query ||
        order.reference.toLowerCase().includes(query) ||
        order.customerName.toLowerCase().includes(query) ||
        (order.contactName ?? "").toLowerCase().includes(query);
      const matchesStatus = statusFilter === "all" || order.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [orders, search, statusFilter]);

  const columns = React.useMemo<ColumnDef<OrderRow>[]>(
    () => [
      {
        accessorKey: "reference",
        header: "Référence",
        cell: ({ row }) => (
          <div>
            <Link href={`/dashboard/orders/${row.original.id}`} className="font-medium text-navy hover:text-brand">
              {row.original.reference}
            </Link>
            <p className="text-[11px] text-slate-400">{formatDate(row.original.createdAt, true)}</p>
          </div>
        ),
      },
      {
        accessorKey: "customerName",
        header: "Client",
        cell: ({ row }) => (
          <div>
            <p className="max-w-[220px] truncate font-medium text-navy">{row.original.customerName}</p>
            <p className="text-[11px] text-slate-400">{row.original.contactName ?? "—"}</p>
          </div>
        ),
      },
      {
        accessorKey: "itemCount",
        header: "Articles",
        cell: ({ row }) => <span className="text-xs text-slate-500">{row.original.itemCount}</span>,
      },
      {
        accessorKey: "totalCentimes",
        header: "Montant",
        cell: ({ row }) => <span className="font-medium text-navy">{formatMAD(row.original.totalCentimes)}</span>,
      },
      {
        accessorKey: "status",
        header: "Statut",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Badge className={ORDER_STATUS_META[row.original.status].className}>
              {ORDER_STATUS_META[row.original.status].label}
            </Badge>
            <OrderStatusSelect orderId={row.original.id} status={row.original.status} />
          </div>
        ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <Button asChild variant="ghost" size="sm">
            <Link href={`/dashboard/orders/${row.original.id}`}>
              <Eye className="h-4 w-4" /> Détail
            </Link>
          </Button>
        ),
      },
    ],
    []
  );

  const table = useReactTable({
    data: filtered,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Rechercher une commande…"
            className="pl-9"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous statuts</SelectItem>
            {ORDER_STATUSES.map((status) => (
              <SelectItem key={status} value={status}>{ORDER_STATUS_META[status].label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-soft">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="bg-slate-50/60">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
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
                  <ShoppingCart className="mx-auto h-8 w-8 text-slate-300" />
                  <p className="mt-3 text-sm font-medium text-navy">Aucune commande</p>
                  <p className="mt-1 text-xs text-slate-400">
                    {orders.length === 0
                      ? "Les commandes de vos clients apparaîtront ici."
                      : "Modifiez vos filtres de recherche."}
                  </p>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {table.getPageCount() > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
            <p className="text-xs text-slate-400">{filtered.length} commande(s)</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
                Précédent
              </Button>
              <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
                Suivant
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
