import Link from "next/link";
import { Boxes, Mail, MapPin, Phone } from "lucide-react";
import { CartProvider } from "@/components/portal/cart-provider";
import { PortalHeader } from "@/components/portal/portal-header";
import { PortalBlocked } from "@/components/portal/portal-blocked";
import { Badge } from "@/components/ui/badge";
import { requireCustomer } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getSignedUrl, BRAND_BUCKET } from "@/lib/storage";
import { DEMO_COMPANY_SLUG } from "@/lib/constants";
import { whatsappLink } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const ctx = await requireCustomer({ allowPending: true });
  const supabase = await createClient();

  const [logoUrl, bannerUrl] = await Promise.all([
    getSignedUrl(supabase, BRAND_BUCKET, ctx.company.logo_path),
    getSignedUrl(supabase, BRAND_BUCKET, ctx.company.banner_path),
  ]);

  const customerName = ctx.customer.contact_name || ctx.customer.company_name;
  const whatsappUrl = ctx.company.whatsapp
    ? whatsappLink(ctx.company.whatsapp, `Bonjour ${ctx.company.name}, je vous contacte depuis votre portail de commandes.`)
    : null;

  if (!ctx.canOrder) {
    return (
      <PortalBlocked
        companyName={ctx.company.name}
        logoUrl={logoUrl}
        customerName={ctx.customer.company_name}
        customerStatus={ctx.customer.status}
        reason={ctx.accessIssue ?? "Votre compte n'est pas encore activé."}
        whatsapp={ctx.company.whatsapp}
      />
    );
  }

  return (
    <CartProvider companyId={ctx.company.id} customerId={ctx.customer.id}>
      <div className="flex min-h-screen flex-col bg-[#F8FAFC]">
        {ctx.company.slug === DEMO_COMPANY_SLUG && (
          <div className="bg-amber-500 px-4 py-1.5 text-center text-[11px] font-medium text-white">
            Environnement de démonstration — Atlas Distribution · données fictives
          </div>
        )}
        <PortalHeader
          companyName={ctx.company.name}
          logoUrl={logoUrl}
          customerName={customerName}
          email={ctx.user.email ?? ""}
          whatsappUrl={whatsappUrl}
        />

        <div className="flex-1">{children}</div>

        <footer className="mt-12 border-t border-slate-200 bg-white">
          <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 md:flex-row md:items-start md:justify-between">
            <div className="max-w-sm">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy text-white">
                  <Boxes className="h-4 w-4" />
                </span>
                <span className="font-semibold text-navy">{ctx.company.name}</span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-slate-400">
                {ctx.company.description ??
                  "Portail de commandes professionnel propulsé par DistribPro."}
              </p>
              <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-400">
                <Badge variant="outline">Client {ctx.group?.name ?? "Standard"}</Badge>
                <span>·</span>
                <span>Prix en MAD</span>
              </div>
            </div>
            <div className="space-y-2 text-xs text-slate-500">
              <p className="font-medium text-navy">Contact</p>
              {ctx.company.phone && (
                <p className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" /> {ctx.company.phone}</p>
              )}
              {ctx.company.email && (
                <p className="flex items-center gap-2"><Mail className="h-3.5 w-3.5" /> {ctx.company.email}</p>
              )}
              {ctx.company.city && (
                <p className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5" /> {ctx.company.city}</p>
              )}
            </div>
            <div className="space-y-2 text-xs text-slate-500">
              <p className="font-medium text-navy">Navigation</p>
              <Link href="/portal/catalog" className="block hover:text-brand">Catalogue</Link>
              <Link href="/portal/orders" className="block hover:text-brand">Mes commandes</Link>
              <Link href="/portal/account" className="block hover:text-brand">Mon compte</Link>
            </div>
          </div>
          <div className="border-t border-slate-100 px-4 py-4 text-center text-[11px] text-slate-400">
            © {new Date().getFullYear()} {ctx.company.name} · Portail propulsé par{" "}
            <Link href="/" className="font-medium text-slate-500 hover:text-brand">DistribPro</Link>
          </div>
        </footer>
      </div>
    </CartProvider>
  );
}
