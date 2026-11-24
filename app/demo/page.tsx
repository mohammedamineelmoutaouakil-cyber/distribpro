import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Boxes, Building2, ShieldCheck, ShoppingBag, Sparkles, Users } from "lucide-react";
import { DemoButtons } from "@/components/auth/demo-buttons";
import { getAuthUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Démonstration" };
export const dynamic = "force-dynamic";

export default async function DemoPage() {
  const user = await getAuthUser();
  const configured = Boolean(
    process.env.DEMO_ADMIN_EMAIL &&
      process.env.DEMO_ADMIN_PASSWORD &&
      process.env.DEMO_CUSTOMER_EMAIL &&
      process.env.DEMO_CUSTOMER_PASSWORD
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <header className="border-b border-slate-200 bg-white">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-semibold text-navy">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy text-white">
              <Boxes className="h-4 w-4" />
            </span>
            DistribPro
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <Link href="/login" className="text-slate-500 hover:text-navy">Connexion</Link>
            <Link href="/signup" className="font-medium text-brand hover:underline">Créer un espace</Link>
          </div>
        </div>
      </header>

      <main className="container max-w-4xl py-12">
        <div className="text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-teal/20 bg-teal-light px-3 py-1 text-xs font-medium text-teal-700">
            <Sparkles className="h-3.5 w-3.5" /> Environnement de démonstration
          </span>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-navy sm:text-4xl">
            Découvrez DistribPro avec Atlas Distribution
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-slate-500">
            Un locataire de démonstration isolé, avec 5 catégories, 20 produits, 5 clients
            professionnels et 8 commandes. Aucune donnée réelle n'est accessible depuis ces comptes.
          </p>
        </div>

        {user && (
          <div className="mx-auto mt-6 max-w-2xl rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
            Vous êtes déjà connecté. Vous pouvez continuer vers votre espace ou vous déconnecter avant
            de tester un compte de démonstration.
          </div>
        )}

        <div className="mt-8 grid gap-5 md:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-soft">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-navy text-white">
              <Building2 className="h-5 w-5" />
            </span>
            <h2 className="mt-4 text-lg font-semibold text-navy">Espace fournisseur</h2>
            <p className="mt-1 text-sm text-slate-500">
              Tableau de bord, catalogue, clients, tarifs personnalisés et traitement des commandes.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-slate-600">
              <li className="flex items-center gap-2"><ShoppingBag className="h-4 w-4 text-teal" /> 20 produits, 8 commandes</li>
              <li className="flex items-center gap-2"><Users className="h-4 w-4 text-teal" /> 5 clients B2B</li>
              <li className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-teal" /> Rôles et RLS vérifiés</li>
            </ul>
            {process.env.DEMO_ADMIN_EMAIL && (
              <p className="mt-4 rounded-lg bg-slate-50 px-3 py-2 font-mono text-xs text-slate-500">
                {process.env.DEMO_ADMIN_EMAIL}
              </p>
            )}
            <div className="mt-5">
              <DemoButtons kind="admin" disabled={!configured || Boolean(user)} />
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-soft">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand text-white">
              <ShoppingBag className="h-5 w-5" />
            </span>
            <h2 className="mt-4 text-lg font-semibold text-navy">Portail client B2B</h2>
            <p className="mt-1 text-sm text-slate-500">
              Catalogue personnalisé, prix négociés, panier et historique des commandes.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-slate-600">
              <li className="flex items-center gap-2"><ShoppingBag className="h-4 w-4 text-teal" /> Prix client personnalisé</li>
              <li className="flex items-center gap-2"><Users className="h-4 w-4 text-teal" /> Commande en attente / historique</li>
              <li className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-teal" /> Isolation par entreprise</li>
            </ul>
            {process.env.DEMO_CUSTOMER_EMAIL && (
              <p className="mt-4 rounded-lg bg-slate-50 px-3 py-2 font-mono text-xs text-slate-500">
                {process.env.DEMO_CUSTOMER_EMAIL}
              </p>
            )}
            <div className="mt-5">
              <DemoButtons kind="customer" disabled={!configured || Boolean(user)} />
            </div>
          </div>
        </div>

        {!configured && (
          <div className="mx-auto mt-6 max-w-2xl rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            Les comptes de démonstration ne sont pas encore configurés. Exécutez{" "}
            <code className="rounded bg-white px-1 py-0.5 font-mono text-xs">npm run seed:demo</code>{" "}
            après avoir renseigné vos variables Supabase, puis rechargez cette page.
          </div>
        )}

        <div className="mt-10 flex flex-col items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-6 sm:flex-row">
          <div>
            <p className="font-medium text-navy">Vous souhaitez votre propre espace ?</p>
            <p className="text-sm text-slate-500">Créez un compte fournisseur et démarrez un essai de 14 jours.</p>
          </div>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-dark"
          >
            Créer mon espace <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </main>
    </div>
  );
}
