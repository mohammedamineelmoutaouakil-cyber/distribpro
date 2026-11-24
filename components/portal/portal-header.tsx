"use client";

import { LogOut, Menu, MessageCircle, Package, ShoppingCart, UserRound, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";
import { logoutAction } from "@/actions/auth";
import { useCart } from "@/components/portal/cart-provider";
import { Badge } from "@/components/ui/badge";
import { cn, initials } from "@/lib/utils";

const NAV = [
  { href: "/portal", label: "Accueil" },
  { href: "/portal/catalog", label: "Catalogue" },
  { href: "/portal/orders", label: "Mes commandes" },
  { href: "/portal/account", label: "Mon compte" },
];

export function PortalHeader({
  companyName,
  logoUrl,
  customerName,
  email,
  whatsappUrl,
}: {
  companyName: string;
  logoUrl: string | null;
  customerName: string;
  email: string;
  whatsappUrl: string | null;
}) {
  const pathname = usePathname();
  const { count, ready } = useCart();
  const [menuOpen, setMenuOpen] = React.useState(false);

  const isActive = (href: string) =>
    href === "/portal" ? pathname === "/portal" : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-6">
          <Link href="/portal" className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-navy text-white">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} alt={companyName} className="h-full w-full object-cover" />
              ) : (
                <Package className="h-4 w-4" />
              )}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-navy">{companyName}</p>
              <p className="text-[10px] uppercase tracking-wider text-slate-400">Portail B2B</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-medium transition",
                  isActive(item.href)
                    ? "bg-slate-100 text-navy"
                    : "text-slate-500 hover:bg-slate-50 hover:text-navy"
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {whatsappUrl && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 sm:inline-flex"
            >
              <MessageCircle className="h-3.5 w-3.5 text-emerald-600" /> Contacter
            </a>
          )}

          <Link
            href="/portal/cart"
            className="relative flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-navy"
            aria-label="Panier"
          >
            <ShoppingCart className="h-5 w-5" />
            {ready && count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-semibold text-white">
                {count > 99 ? "99+" : count}
              </span>
            )}
          </Link>

          <div className="hidden items-center gap-2 border-l border-slate-200 pl-3 sm:flex">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-light text-[11px] font-semibold text-brand-dark">
              {initials(customerName || email)}
            </span>
            <div className="hidden leading-tight md:block">
              <p className="max-w-[120px] truncate text-xs font-medium text-navy">{customerName}</p>
              <p className="max-w-[120px] truncate text-[10px] text-slate-400">{email}</p>
            </div>
            <form action={logoutAction}>
              <button
                type="submit"
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-navy"
                title="Se déconnecter"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </form>
          </div>

          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
            aria-label="Menu"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <div className="flex gap-1 overflow-x-auto border-t border-slate-100 px-3 py-2 lg:hidden no-scrollbar">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium",
              isActive(item.href) ? "bg-slate-100 text-navy" : "text-slate-500"
            )}
          >
            {item.label}
          </Link>
        ))}
      </div>

      {menuOpen && (
        <div className="border-t border-slate-100 bg-white p-4 lg:hidden">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-light text-xs font-semibold text-brand-dark">
                {initials(customerName || email)}
              </span>
              <div>
                <p className="text-sm font-medium text-navy">{customerName}</p>
                <p className="text-[11px] text-slate-400">{email}</p>
              </div>
            </div>
            <form action={logoutAction}>
              <button type="submit" className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-600">
                <LogOut className="h-3.5 w-3.5" /> Déconnexion
              </button>
            </form>
          </div>
          {whatsappUrl && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 flex items-center justify-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700"
            >
              <MessageCircle className="h-3.5 w-3.5" /> Contacter {companyName} sur WhatsApp
            </a>
          )}
        </div>
      )}
    </header>
  );
}
