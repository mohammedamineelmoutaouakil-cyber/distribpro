import { CartView } from "@/components/portal/cart-view";
import { requireCustomer } from "@/lib/auth";
import { whatsappLink } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function CartPage() {
  const ctx = await requireCustomer();
  const whatsappUrl = ctx.company.whatsapp
    ? whatsappLink(
        ctx.company.whatsapp,
        `Bonjour ${ctx.company.name}, j'ai une question concernant ma commande en cours.`
      )
    : null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-1">
        <p className="text-xs font-medium uppercase tracking-wider text-brand">Commande</p>
        <h1 className="text-2xl font-semibold tracking-tight text-navy">Mon panier</h1>
        <p className="text-sm text-slate-500">
          Vérifiez les quantités et vos tarifs, puis envoyez la commande à votre fournisseur.
        </p>
      </div>

      <div className="mt-6">
        <CartView whatsappUrl={whatsappUrl} />
      </div>
    </div>
  );
}
