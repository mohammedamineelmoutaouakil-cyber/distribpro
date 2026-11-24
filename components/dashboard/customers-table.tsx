"use client";

import {
  Check,
  Copy,
  Link2,
  MoreHorizontal,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Trash2,
  UserRound,
  Users,
  Ban,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import { toast } from "sonner";
import {
  deleteCustomer,
  regenerateInvite,
  setCustomerStatus,
} from "@/actions/customers";
import { CustomerDialog, type EditableCustomer } from "@/components/dashboard/customer-dialog";
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
import { CUSTOMER_STATUS_META } from "@/lib/constants";
import { formatMAD } from "@/lib/money";
import { cn } from "@/lib/utils";

export interface CustomerRow {
  id: string;
  companyName: string;
  contactName: string | null;
  email: string;
  phone: string | null;
  city: string | null;
  groupId: string | null;
  groupName: string | null;
  status: string;
  inviteToken: string | null;
  hasUser: boolean;
  orderCount: number;
  totalValue: number;
  createdAt: string;
}

function inviteUrl(token: string) {
  const base = typeof window !== "undefined" ? window.location.origin : "";
  return `${base}/invite/${token}`;
}

export function CustomersTable({
  customers,
  groups,
}: {
  customers: CustomerRow[];
  groups: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [groupFilter, setGroupFilter] = React.useState("all");
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<EditableCustomer | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<CustomerRow | null>(null);
  const [invite, setInvite] = React.useState<string | null>(null);
  const [pendingId, setPendingId] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);

  const filtered = React.useMemo(() => {
    const query = search.trim().toLowerCase();
    return customers.filter((customer) => {
      const matchesSearch =
        !query ||
        customer.companyName.toLowerCase().includes(query) ||
        customer.email.toLowerCase().includes(query) ||
        (customer.contactName ?? "").toLowerCase().includes(query) ||
        (customer.city ?? "").toLowerCase().includes(query);
      const matchesStatus = statusFilter === "all" || customer.status === statusFilter;
      const matchesGroup = groupFilter === "all" || customer.groupId === groupFilter;
      return matchesSearch && matchesStatus && matchesGroup;
    });
  }, [customers, search, statusFilter, groupFilter]);

  async function copyLink(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Lien d'invitation copié");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Impossible de copier automatiquement. Sélectionnez le lien manuellement.");
    }
  }

  async function changeStatus(customer: CustomerRow, status: "active" | "suspended") {
    setPendingId(customer.id);
    const result = await setCustomerStatus({ customerId: customer.id, status });
    setPendingId(null);
    if (result.error) toast.error(result.error);
    else {
      toast.success(result.success);
      router.refresh();
    }
  }

  async function resend(customer: CustomerRow) {
    setPendingId(customer.id);
    const result = await regenerateInvite(customer.id);
    setPendingId(null);
    if (result.error) toast.error(result.error);
    else {
      toast.success(result.success);
      if (result.inviteUrl) setInvite(result.inviteUrl);
      router.refresh();
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setPendingId(deleteTarget.id);
    const result = await deleteCustomer(deleteTarget.id);
    setPendingId(null);
    if (result.error) toast.error(result.error);
    else {
      toast.success(result.success);
      setDeleteTarget(null);
      router.refresh();
    }
  }

  const columns = React.useMemo<ColumnDef<CustomerRow>[]>(
    () => [
      {
        accessorKey: "companyName",
        header: "Client",
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-xs font-semibold text-slate-500">
              {row.original.companyName.slice(0, 2).toUpperCase()}
            </span>
            <div className="min-w-0">
              <Link href={`/dashboard/customers/${row.original.id}`} className="block max-w-[220px] truncate font-medium text-navy hover:text-brand">
                {row.original.companyName}
              </Link>
              <p className="text-[11px] text-slate-400">{row.original.contactName ?? "—"}</p>
            </div>
          </div>
        ),
      },
      {
        accessorKey: "email",
        header: "Contact",
        cell: ({ row }) => (
          <div>
            <p className="max-w-[200px] truncate text-xs text-slate-600">{row.original.email}</p>
            <p className="text-[11px] text-slate-400">{row.original.phone ?? "—"}</p>
          </div>
        ),
      },
      {
        accessorKey: "city",
        header: "Ville",
        cell: ({ row }) => <span className="text-xs text-slate-500">{row.original.city ?? "—"}</span>,
      },
      {
        accessorKey: "groupName",
        header: "Groupe",
        cell: ({ row }) => (
          <Badge variant="outline" className="font-normal">{row.original.groupName ?? "Aucun"}</Badge>
        ),
      },
      {
        accessorKey: "status",
        header: "Statut",
        cell: ({ row }) => {
          const meta = CUSTOMER_STATUS_META[row.original.status] ?? CUSTOMER_STATUS_META.invited;
          return <Badge className={meta.className}>{meta.label}</Badge>;
        },
      },
      {
        accessorKey: "orderCount",
        header: "Commandes",
        cell: ({ row }) => (
          <div>
            <p className="text-sm font-medium text-navy">{row.original.orderCount}</p>
            <p className="text-[11px] text-slate-400">{formatMAD(row.original.totalValue)}</p>
          </div>
        ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => {
          const customer = row.original;
          const busy = pendingId === customer.id;
          return (
            <div className="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href={`/dashboard/customers/${customer.id}`}>
                      <UserRound /> Voir la fiche
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setEditing({
                        id: customer.id,
                        companyName: customer.companyName,
                        contactName: customer.contactName,
                        email: customer.email,
                        phone: customer.phone,
                        city: customer.city,
                        address: null,
                        ice: null,
                        groupId: customer.groupId,
                        notes: null,
                      });
                      setDialogOpen(true);
                    }}
                  >
                    <Pencil /> Modifier
                  </DropdownMenuItem>

                  {customer.inviteToken && (
                    <>
                      <DropdownMenuItem onClick={() => copyLink(inviteUrl(customer.inviteToken!))}>
                        <Copy /> Copier l'invitation
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() =>
                          window.open(
                            `https://wa.me/?text=${encodeURIComponent(
                              `Bonjour, voici votre lien d'accès au portail de commandes : ${inviteUrl(customer.inviteToken!)}`
                            )}`,
                            "_blank",
                            "noopener"
                          )
                        }
                      >
                        <Send /> Partager par WhatsApp
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => resend(customer)} disabled={busy}>
                        <RefreshCw /> Régénérer le lien
                      </DropdownMenuItem>
                    </>
                  )}

                  <DropdownMenuSeparator />
                  {customer.status !== "active" && customer.hasUser && (
                    <DropdownMenuItem onClick={() => changeStatus(customer, "active")} disabled={busy}>
                      <ShieldCheck /> Activer l'accès
                    </DropdownMenuItem>
                  )}
                  {customer.status === "active" && (
                    <DropdownMenuItem onClick={() => changeStatus(customer, "suspended")} disabled={busy}>
                      <Ban /> Suspendre
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    className="text-rose-600 focus:text-rose-600"
                    onClick={() => setDeleteTarget(customer)}
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
    [pendingId, router]
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
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Rechercher un client…"
              className="pl-9"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous statuts</SelectItem>
              <SelectItem value="invited">Invités</SelectItem>
              <SelectItem value="pending">En attente</SelectItem>
              <SelectItem value="active">Actifs</SelectItem>
              <SelectItem value="suspended">Suspendus</SelectItem>
            </SelectContent>
          </Select>
          <Select value={groupFilter} onValueChange={setGroupFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Groupe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous groupes</SelectItem>
              {groups.map((group) => (
                <SelectItem key={group.id} value={group.id}>{group.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          size="sm"
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
        >
          <Plus className="h-4 w-4" /> Nouveau client
        </Button>
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
                  <Users className="mx-auto h-8 w-8 text-slate-300" />
                  <p className="mt-3 text-sm font-medium text-navy">Aucun client trouvé</p>
                  <p className="mt-1 text-xs text-slate-400">
                    {customers.length === 0
                      ? "Créez votre premier compte client professionnel et envoyez-lui une invitation."
                      : "Modifiez vos filtres de recherche."}
                  </p>
                  {customers.length === 0 && (
                    <Button
                      size="sm"
                      className="mt-4"
                      onClick={() => {
                        setEditing(null);
                        setDialogOpen(true);
                      }}
                    >
                      <Plus className="h-4 w-4" /> Inviter un client
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {table.getPageCount() > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
            <p className="text-xs text-slate-400">{filtered.length} client(s)</p>
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

      <CustomerDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        customer={editing}
        groups={groups}
        onSaved={(url) => {
          router.refresh();
          if (url) setInvite(url);
        }}
      />

      <Dialog open={!!invite} onOpenChange={(open) => !open && setInvite(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Lien d'invitation client</DialogTitle>
            <DialogDescription>
              Partagez ce lien avec votre client. Il créera son mot de passe, puis vous devrez activer
              son compte pour qu'il puisse commander.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              <Link2 className="h-4 w-4 shrink-0 text-slate-400" />
              <input
                readOnly
                value={invite ?? ""}
                className="w-full bg-transparent text-xs text-slate-600 outline-none"
                onFocus={(event) => event.currentTarget.select()}
              />
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button className="flex-1" onClick={() => invite && copyLink(invite)}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copié" : "Copier le lien"}
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() =>
                  invite &&
                  window.open(
                    `https://wa.me/?text=${encodeURIComponent(`Voici votre accès au portail de commandes : ${invite}`)}`,
                    "_blank",
                    "noopener"
                  )
                }
              >
                <Send className="h-4 w-4" /> WhatsApp
              </Button>
            </div>
            <p className="text-[11px] text-slate-400">
              L'envoi d'email automatique n'est pas activé dans cette version. Partagez le lien manuellement.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer ce client ?</DialogTitle>
            <DialogDescription>
              <span className="font-medium text-navy">{deleteTarget?.companyName}</span> sera définitivement supprimé.
              Les clients ayant des commandes ne peuvent pas être supprimés.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Annuler</Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={!!pendingId}>Supprimer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
