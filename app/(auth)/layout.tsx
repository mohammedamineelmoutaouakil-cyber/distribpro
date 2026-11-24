import Link from "next/link";
import { Boxes, CheckCircle2, ShieldCheck, ShoppingCart } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative hidden overflow-hidden bg-navy px-12 py-10 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0 surface-grid opacity-[0.18]" />
        <div className="absolute -right-32 top-1/3 h-96 w-96 rounded-full bg-brand/20 blur-3xl" />
        <div className="absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-teal/15 blur-3xl" />

        <Link href="/" className="relative flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-navy">
            <Boxes className="h-5 w-5" />
          </span>
          <span className="text-lg font-semibold tracking-tight">DistribPro</span>
        </Link>

        <div className="relative max-w-md">
          <h2 className="text-balance text-3xl font-semibold leading-tight">
            Le portail de commandes de votre entreprise, enfin centralisé.
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-slate-300">
            Vos produits, vos tarifs professionnels et les commandes de vos clients réunis
            dans une interface conçue pour les distributeurs marocains.
          </p>

          <ul className="mt-8 space-y-3 text-sm text-slate-200">
            {[
              "Catalogue professionnel en ligne",
              "Tarifs personnalisés par client et par groupe",
              "Commandes centralisées et suivi de statut",
              "Partage de commande par WhatsApp",
            ].map((item) => (
              <li key={item} className="flex items-center gap-3">
                <CheckCircle2 className="h-4 w-4 text-teal" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative flex items-center gap-6 text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4" /> Isolation multi-entreprises
          </span>
          <span className="flex items-center gap-1.5">
            <ShoppingCart className="h-4 w-4" /> Commandes sécurisées
          </span>
        </div>
      </aside>

      <main className="flex min-h-screen flex-col">
        <div className="flex items-center justify-between px-6 py-5 lg:hidden">
          <Link href="/" className="flex items-center gap-2 font-semibold text-navy">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy text-white">
              <Boxes className="h-4 w-4" />
            </span>
            DistribPro
          </Link>
          <Link href="/" className="text-sm text-slate-500 hover:text-navy">
            Retour au site
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center px-5 py-10 sm:px-10">
          <div className="w-full max-w-md">{children}</div>
        </div>
      </main>
    </div>
  );
}
