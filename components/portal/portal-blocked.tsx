import Link from "next/link";
import { AlertTriangle, LogOut, MessageCircle, Package } from "lucide-react";
import { logoutAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CUSTOMER_STATUS_META } from "@/lib/constants";
import { whatsappLink } from "@/lib/utils";

export function PortalBlocked({
  companyName,
  logoUrl,
  customerName,
  customerStatus,
  reason,
  whatsapp,
}: {
  companyName: string;
  logoUrl: string | null;
  customerName: string;
  customerStatus: string;
  reason: string;
  whatsapp: string | null;
}) {
  const statusMeta = CUSTOMER_STATUS_META[customerStatus] ?? CUSTOMER_STATUS_META.pending;

  return (
    <div className="flex min-h-screen flex-col bg-[#F8FAFC]">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link href="/portal" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg bg-navy text-white">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} alt={companyName} className="h-full w-full object-cover" />
              ) : (
                <Package className="h-4 w-4" />
              )}
            </span>
            <span className="text-sm font-semibold text-navy">{companyName}</span>
          </Link>
          <form action={logoutAction}>
            <button type="submit" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-navy">
              <LogOut className="h-4 w-4" /> Déconnexion
            </button>
          </form>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-card">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-50">
            <AlertTriangle className="h-6 w-6 text-amber-500" />
          </span>
          <h1 className="mt-4 text-xl font-semibold tracking-tight text-navy">Accès en attente</h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-500">{reason}</p>

          <div className="mt-5 flex items-center justify-center gap-2">
            <Badge className={statusMeta.className}>{statusMeta.label}</Badge>
            <span className="text-xs text-slate-400">{customerName}</span>
          </div>

          <div className="mt-6 rounded-lg bg-slate-50 p-4 text-left text-xs text-slate-500">
            <p className="font-medium text-navy">Que se passe-t-il ensuite ?</p>
            <ul className="mt-2 list-inside list-disc space-y-1">
              <li>Votre fournisseur doit valider votre compte professionnel.</li>
              <li>Vous recevrez l'accès au catalogue et à vos tarifs personnalisés.</li>
              <li>Contactez votre fournisseur si cette situation persiste.</li>
            </ul>
          </div>

          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            {whatsapp && (
              <Button asChild className="flex-1 bg-emerald-600 hover:bg-emerald-700">
                <a
                  href={whatsappLink(
                    whatsapp,
                    `Bonjour ${companyName}, je souhaite activer mon compte client (${customerName}).`
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle className="h-4 w-4" /> Contacter le fournisseur
                </a>
              </Button>
            )}
            <Button asChild variant="outline" className="flex-1">
              <Link href="/portal/account">Mon compte</Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
