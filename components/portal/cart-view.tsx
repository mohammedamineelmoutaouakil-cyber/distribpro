"use client";

import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  BadgeCheck,
  ImageIcon,
  Loader2,
  MessageCircle,
  ShoppingBag,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";
import { getCartDetails, submitOrder, type CartDetailLine } from "@/actions/cart";
import { QuantityStepper } from "@/components/portal/add-to-cart";
import { useCart } from "@/components/portal/cart-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatMAD } from "@/lib/money";

function sourceLabel(source: CartDetailLine["priceSource"]) {
  if (source === "customer") return "Tarif client";
  if (source === "group") return "Tarif groupe";
  return "Prix de base";
}

export function CartView({ whatsappUrl }: { whatsappUrl: string | null }) {
  const router = useRouter();
  const { items, ready, setQuantity, remove, clear } = useCart();
  const [lines, setLines] = React.useState<CartDetailLine[]>([]);
  const [subtotal, setSubtotal] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [notes, setNotes] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  const signature = items.map((item) => `${item.productId}:${item.quantity}`).join("|");

  React.useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    getCartDetails(items)
      .then((result) => {
        if (cancelled) return;
        if (result.error) {
          setError(result.error);
          setLines([]);
          setSubtotal(0);
          return;
        }
        setLines(result.lines ?? []);
        setSubtotal(result.subtotalCentimes ?? 0);
      })
      .catch(() => {
        if (!cancelled) setError("Impossible de charger le panier. Réessayez.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, signature]);

  const hasQuantityError = lines.some((line) => line.quantity < line.minOrderQty);
  const unavailableCount = Math.max(0, items.length - lines.length);
  const canSubmit = lines.length > 0 && !hasQuantityError && !submitting && !loading;

  async function checkout() {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    const result = await submitOrder({
      items: lines.map((line) => ({ productId: line.productId, quantity: line.quantity })),
      notes: notes.trim() || undefined,
    });
    setSubmitting(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    clear();
    toast.success(`Commande ${result.reference} envoyée à votre fournisseur`);
    router.push(`/portal/orders/${result.orderId}?created=1`);
  }

  if (!ready || (loading && items.length > 0 && lines.length === 0)) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white py-20">
        <Loader2 className="h-7 w-7 animate-spin text-brand" />
        <p className="mt-3 text-sm text-slate-500">Chargement de votre panier…</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-50">
          <ShoppingBag className="h-6 w-6 text-slate-300" />
        </span>
        <p className="mt-4 text-base font-medium text-navy">Votre panier est vide</p>
        <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
          Parcourez le catalogue et ajoutez les produits dont vous avez besoin.
        </p>
        <Button asChild className="mt-5">
          <Link href="/portal/catalog">
            Voir le catalogue <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        {error && (
          <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {unavailableCount > 0 && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {unavailableCount} produit(s) de votre panier ne sont plus disponibles et ont été ignorés.
          </div>
        )}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft">
          {lines.map((line) => (
            <div
              key={line.productId}
              className="flex flex-col gap-4 border-b border-slate-100 p-4 last:border-b-0 sm:flex-row sm:items-center"
            >
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-50">
                  {line.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={line.imageUrl} alt={line.name} className="h-full w-full object-cover" />
                  ) : (
                    <ImageIcon className="h-5 w-5 text-slate-300" />
                  )}
                </div>
                <div className="min-w-0">
                  <Link
                    href={`/portal/product/${line.productId}`}
                    className="line-clamp-2 text-sm font-medium text-navy hover:text-brand"
                  >
                    {line.name}
                  </Link>
                  <p className="mt-0.5 font-mono text-[11px] text-slate-400">{line.sku}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="text-[10px]">{sourceLabel(line.priceSource)}</Badge>
                    <span className="text-[11px] text-slate-400">
                      Min. {line.minOrderQty} · {formatMAD(line.unitPriceCentimes)} / unité
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-4 sm:justify-end">
                <QuantityStepper
                  value={line.quantity}
                  onChange={(value) => setQuantity(line.productId, value)}
                  min={Math.max(1, line.minOrderQty)}
                  compact
                />
                <div className="w-24 text-right">
                  <p className="text-sm font-semibold text-navy">{formatMAD(line.lineTotalCentimes)}</p>
                  {line.quantity < line.minOrderQty && (
                    <p className="text-[10px] text-rose-600">Min. {line.minOrderQty}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => remove(line.productId)}
                  className="rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                  aria-label={`Retirer ${line.name}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href="/portal/catalog">Continuer mes achats</Link>
          </Button>
          <Button type="button" variant="ghost" size="sm" className="text-rose-600" onClick={clear}>
            <Trash2 className="h-3.5 w-3.5" /> Vider le panier
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
          <h2 className="text-base font-semibold text-navy">Récapitulatif</h2>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex items-center justify-between text-slate-500">
              <span>Articles</span>
              <span>{lines.reduce((sum, line) => sum + line.quantity, 0)} unités</span>
            </div>
            <div className="flex items-center justify-between text-slate-500">
              <span>Sous-total HT</span>
              <span className="font-medium text-navy">{formatMAD(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between border-t border-slate-100 pt-3">
              <span className="font-medium text-navy">Total estimé</span>
              <span className="text-lg font-semibold text-navy">{formatMAD(subtotal)}</span>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <label htmlFor="order-notes" className="text-xs font-medium text-slate-500">
              Note pour le fournisseur (facultatif)
            </label>
            <Textarea
              id="order-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value.slice(0, 1000))}
              placeholder="Délai souhaité, précisions sur la livraison…"
              className="min-h-[90px] text-sm"
            />
            <p className="text-right text-[10px] text-slate-400">{notes.length}/1000</p>
          </div>

          <Button className="mt-4 w-full" size="lg" onClick={checkout} disabled={!canSubmit}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <BadgeCheck className="h-4 w-4" />}
            {submitting ? "Envoi en cours…" : "Envoyer la commande"}
          </Button>

          <p className="mt-2 text-center text-[11px] leading-relaxed text-slate-400">
            Le fournisseur reçoit votre commande et la confirme. Aucun paiement n'est effectué en ligne.
          </p>

          {hasQuantityError && (
            <p className="mt-2 text-center text-[11px] text-rose-600">
              Respectez la quantité minimum de chaque produit.
            </p>
          )}
        </div>

        {whatsappUrl && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-sm font-medium text-emerald-800">Une question ?</p>
            <p className="mt-1 text-xs text-emerald-700">
              Contactez directement votre fournisseur sur WhatsApp.
            </p>
            <Button asChild size="sm" className="mt-3 w-full bg-emerald-600 hover:bg-emerald-700">
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="h-4 w-4" /> Contacter le fournisseur
              </a>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
