"use client";

import {
  BarChart3,
  Boxes,
  Building2,
  FolderTree,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Settings,
  ShoppingCart,
  Store,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";
import { logoutAction } from "@/actions/auth";
import { Badge } from "@/components/ui/badge";
import { cn, initials } from "@/lib/utils";
import { planUsageLabel } from "@/lib/plan";

const NAV = [
  { href: "/dashboard", label: "Vue d'ensemble", icon: LayoutDashboard },
  { href: "/dashboard/products", label: "Produits", icon: Package },
  { href: "/dashboard/categories", label: "Catégories", icon: FolderTree },
  { href: "/dashboard/customers", label: "Clients", icon: Users },
  { href: "/dashboard/orders", label: "Commandes", icon: ShoppingCart },
  { href: "/dashboard/pricing", label: "Tarifs", icon: BarChart3 },
  { href: "/dashboard/reports", label: "Rapports", icon: BarChart3 },
  { href: "/dashboard/settings", label: "Paramètres", icon: Settings },
];

export interface DashboardShellProps {
  children: React.ReactNode;
  companyName: string;
  companySlug: string;
  logoUrl: string | null;
  userName: string;
  userEmail: string;
  planName: string;
  productCount: number;
  customerCount: number;
  maxProducts: number;
  maxCustomers: number;
  isDemo: boolean;
  accessIssue: string | null;
}

function UsageBar({ label, used, max }: { label: string; used: number; max: number }) {
  const pct = Math.min(100, Math.round((used / max) * 100));
  return (
    <div>
      <div className="flex items-center justify-between text-[11px] text-slate-400">
        <span>{label}</span>
        <span>{planUsageLabel(used, max)}</span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10">
        <div
          className={cn("h-full rounded-full", pct >= 90 ? "bg-amber-400" : "bg-teal")}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function SidebarContent({
  companyName,
  logoUrl,
  planName,
  productCount,
  customerCount,
  maxProducts,
  maxCustomers,
  onNavigate,
}: Pick<
  DashboardShellProps,
  "companyName" | "logoUrl" | "planName" | "productCount" | "customerCount" | "maxProducts" | "maxCustomers"
> & { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <>
      <div className="flex h-16 items-center gap-3 border-b border-white/10 px-5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white text-navy">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt={companyName} className="h-full w-full object-cover" />
          ) : (
            <Boxes className="h-5 w-5" />
          )}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-white">{companyName}</p>
          <p className="text-[11px] uppercase tracking-wider text-slate-400">Espace fournisseur</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4 scrollbar-thin">
        {NAV.map((item) => {
          const active =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-white/10 text-white"
                  : "text-slate-400 hover:bg-white/5 hover:text-white"
              )}
            >
              <item.icon className={cn("h-4 w-4", active && "text-teal")} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-3 border-t border-white/10 px-5 py-4">
        <div className="flex items-center justify-between">
          <span className="text-[11px] uppercase tracking-wider text-slate-400">Plan</span>
          <Badge className="border-white/15 bg-white/10 text-white hover:bg-white/10">{planName}</Badge>
        </div>
        <UsageBar label="Produits actifs" used={productCount} max={maxProducts} />
        <UsageBar label="Comptes clients" used={customerCount} max={maxCustomers} />
      </div>
    </>
  );
}

export function DashboardShell(props: DashboardShellProps) {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const pathname = usePathname();

  React.useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-navy lg:flex">
        <SidebarContent {...props} />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Fermer le menu"
            className="absolute inset-0 bg-navy/50 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative flex h-full w-72 max-w-[85vw] flex-col bg-navy shadow-2xl">
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-4 rounded-md p-1.5 text-slate-400 hover:bg-white/10 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
            <SidebarContent {...props} onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
          <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
                aria-label="Ouvrir le menu"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div className="hidden items-center gap-2 text-sm text-slate-500 sm:flex">
                <Building2 className="h-4 w-4" />
                <span className="font-medium text-navy">{props.companyName}</span>
                {props.isDemo && (
                  <Badge variant="warning" className="ml-1">Démo</Badge>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <Link
                href="/portal"
                className="hidden items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50 sm:inline-flex"
              >
                <Store className="h-3.5 w-3.5" /> Voir la boutique
              </Link>

              <div className="flex items-center gap-2 rounded-lg border border-slate-200 py-1.5 pl-1.5 pr-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-md bg-brand-light text-[11px] font-semibold text-brand-dark">
                  {initials(props.userName || props.userEmail)}
                </span>
                <div className="hidden leading-tight sm:block">
                  <p className="max-w-[140px] truncate text-xs font-medium text-navy">{props.userName || "Administrateur"}</p>
                  <p className="max-w-[140px] truncate text-[11px] text-slate-400">{props.userEmail}</p>
                </div>
              </div>

              <form action={logoutAction}>
                <button
                  type="submit"
                  className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-navy"
                  title="Se déconnecter"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </form>
            </div>
          </div>

          {props.accessIssue && (
            <div className="border-t border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-800 sm:px-6">
              {props.accessIssue} Les modifications sont désactivées jusqu'à régularisation.
            </div>
          )}
        </header>

        <main className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8">{props.children}</main>
      </div>
    </div>
  );
}
