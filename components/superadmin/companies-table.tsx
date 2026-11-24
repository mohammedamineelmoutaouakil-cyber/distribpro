"use client";

import Link from "next/link";
import { Building2, Search } from "lucide-react";
import * as React from "react";
import { CompanyStatusToggle } from "@/components/superadmin/company-status-toggle";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PLAN_IDS, PLANS, SUBSCRIPTION_STATUS_META } from "@/lib/constants";
import type { CompanyAdminRow } from "@/lib/superadmin";
import { formatDate } from "@/lib/utils";

export function CompaniesTable({ companies }: { companies: CompanyAdminRow[] }) {
  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState("all");
  const [plan, setPlan] = React.useState("all");

  const filtered = React.useMemo(() => {
    const query = search.trim().toLowerCase();
    return companies.filter((company) => {
      const matchesQuery =
        !query ||
        company.name.toLowerCase().includes(query) ||
        company.slug.toLowerCase().includes(query) ||
        (company.sector ?? "").toLowerCase().includes(query);
      const matchesStatus = status === "all" || company.status === status;
      const matchesPlan = plan === "all" || company.plan === plan;
      return matchesQuery && matchesStatus && matchesPlan;
    });
  }, [companies, search, status, plan]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Rechercher une entreprise…"
            className="pl-9"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous statuts</SelectItem>
            <SelectItem value="active">Actives</SelectItem>
            <SelectItem value="suspended">Suspendues</SelectItem>
          </SelectContent>
        </Select>
        <Select value={plan} onValueChange={setPlan}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Plan" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous plans</SelectItem>
            {PLAN_IDS.map((planId) => (
              <SelectItem key={planId} value={planId}>{PLANS[planId].name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-soft">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/60">
              <TableHead>Entreprise</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Usage</TableHead>
              <TableHead>Expiration</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length > 0 ? (
              filtered.map((company) => {
                const subMeta = SUBSCRIPTION_STATUS_META[company.subscriptionStatus] ?? {
                  label: company.subscriptionStatus,
                  className: "bg-slate-100 text-slate-500 border-slate-200",
                };
                return (
                  <TableRow key={company.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                          <Building2 className="h-4 w-4" />
                        </span>
                        <div>
                          <Link
                            href={`/superadmin/companies/${company.id}`}
                            className="font-medium text-navy hover:text-brand"
                          >
                            {company.name}
                          </Link>
                          <p className="text-[11px] text-slate-400">
                            {company.slug} · {company.sector ?? "Secteur non renseigné"}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="brand">{PLANS[company.plan].name}</Badge>
                      <p className="mt-1 text-[11px] text-slate-400">
                        {PLANS[company.plan].priceMAD} MAD / mois
                      </p>
                    </TableCell>
                    <TableCell>
                      <p className="text-xs text-slate-500">
                        {company.productCount} produits · {company.customerCount} clients
                      </p>
                      <p className="text-[11px] text-slate-400">{company.orderCount} commandes</p>
                    </TableCell>
                    <TableCell>
                      <p className="text-xs text-navy">{formatDate(company.expiresAt)}</p>
                      <Badge className={`mt-1 ${subMeta.className}`}>{subMeta.label}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={company.status === "active" ? "success" : "danger"}>
                        {company.status === "active" ? "Active" : "Suspendue"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        <CompanyStatusToggle companyId={company.id} status={company.status} />
                        <Link
                          href={`/superadmin/companies/${company.id}`}
                          className="text-xs font-medium text-brand hover:underline"
                        >
                          Détail
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="py-14 text-center">
                  <Building2 className="mx-auto h-8 w-8 text-slate-300" />
                  <p className="mt-3 text-sm font-medium text-navy">Aucune entreprise trouvée</p>
                  <p className="mt-1 text-xs text-slate-400">Modifiez vos filtres de recherche.</p>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <p className="text-xs text-slate-400">{filtered.length} entreprise(s) affichée(s).</p>
    </div>
  );
}
