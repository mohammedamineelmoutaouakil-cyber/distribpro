import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Boxes,
  Building2,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  FileSpreadsheet,
  Globe2,
  Layers3,
  MessageCircle,
  Package,
  Percent,
  PlayCircle,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Store,
  Truck,
  Users,
  Wallet,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BRAND, PLANS } from "@/lib/constants";
import { absoluteUrl } from "@/lib/utils";

export const metadata: Metadata = {
  title: "DistribPro — Le portail de commandes B2B des distributeurs marocains",
  description:
    "Transformez votre catalogue en portail de commandes B2B. Produits, clients professionnels, tarifs personnalisés et commandes centralisées, en français et en MAD.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "DistribPro — Votre catalogue devient un portail de commandes B2B",
    description:
      "La plateforme tout-en-un pour les grossistes et distributeurs au Maroc : catalogue, tarifs professionnels, commandes et rapports.",
    url: "/",
  },
};

const FEATURES = [
  {
    icon: Store,
    title: "Portail client à votre image",
    text: "Un espace de commande professionnel avec votre logo, vos couleurs et vos coordonnées. Vos clients commandent sans appeler.",
  },
  {
    icon: Percent,
    title: "Tarifs par client et par groupe",
    text: "Prix de base, tarif Standard, Professionnel ou VIP, et prix négociés individuellement. La priorité est appliquée automatiquement.",
  },
  {
    icon: ShoppingCart,
    title: "Commandes centralisées",
    text: "Les commandes arrivent dans un tableau de bord unique, avec quantités minimum, notes client et montants figés.",
  },
  {
    icon: FileSpreadsheet,
    title: "Import CSV du catalogue",
    text: "Importez vos produits, détectez les doublons et créez les catégories manquantes. Aucune saisie répétitive.",
  },
  {
    icon: MessageCircle,
    title: "Partage WhatsApp",
    text: "Partagez le catalogue, les invitations et les commandes via un simple lien wa.me. Sans automatisation ni faux promesses.",
  },
  {
    icon: BarChart3,
    title: "Rapports utiles",
    text: "Chiffre d'affaires, panier moyen, top produits et statuts. Export CSV pour votre comptabilité ou votre équipe.",
  },
];

const STEPS = [
  {
    number: "01",
    title: "Créez votre espace",
    text: "Inscrivez votre entreprise, choisissez votre secteur et démarrez votre essai de 14 jours. Aucune carte bancaire.",
    icon: Building2,
  },
  {
    number: "02",
    title: "Importez votre catalogue",
    text: "Ajoutez vos produits, catégories, photos, prix de base et quantités minimum. L'import CSV accélère la mise en route.",
    icon: Layers3,
  },
  {
    number: "03",
    title: "Invitez vos clients",
    text: "Créez leurs comptes, attribuez un groupe tarifaire et partagez le lien d'invitation. Vous validez chaque accès.",
    icon: Users,
  },
  {
    number: "04",
    title: "Recevez vos commandes",
    text: "Vos clients commandent en ligne. Vous confirmez, préparez et suivez chaque commande jusqu'à la livraison.",
    icon: Truck,
  },
];

const FAQ = [
  {
    question: "DistribPro est-il adapté aux petits distributeurs ?",
    answer:
      "Oui. Le plan Starter est conçu pour les distributeurs qui démarrent avec un catalogue raisonnable et jusqu'à 20 comptes clients. Vous pouvez évoluer vers le plan Pro sans changer d'outil.",
  },
  {
    question: "Mes clients doivent-ils installer une application ?",
    answer:
      "Non. Vos clients accèdent à leur portail depuis un navigateur, sur ordinateur ou mobile. Ils se connectent avec leur email et leur mot de passe, puis commandent en quelques clics.",
  },
  {
    question: "Comment fonctionnent les tarifs personnalisés ?",
    answer:
      "Chaque produit possède un prix de base. Vous pouvez définir un prix par groupe de clients et un prix spécifique pour un client. Le tarif individuel est prioritaire, puis le groupe, puis le prix de base. Les prix sont recalculés côté serveur au moment de la commande.",
  },
  {
    question: "Les commandes sont-elles envoyées automatiquement sur WhatsApp ?",
    answer:
      "Non. DistribPro fournit des liens wa.me que vous ou vos clients pouvez utiliser pour partager une commande ou un catalogue. Aucun message n'est envoyé automatiquement.",
  },
  {
    question: "Puis-je importer mon catalogue existant ?",
    answer:
      "Oui. Un modèle CSV est disponible dans votre espace fournisseur. L'import affiche un aperçu, détecte les erreurs, les doublons de références et crée les catégories manquantes.",
  },
  {
    question: "Y a-t-il un paiement en ligne intégré ?",
    answer:
      "Non. DistribPro centralise la prise de commande B2B. Les paiements, la livraison et la facturation restent gérés selon vos accords commerciaux habituels.",
  },
];

const SECTOR_LABELS = [
  "Sanitaire & plomberie",
  "Électricité",
  "Éclairage",
  "Énergie solaire",
  "Matériaux",
  "Industrie",
];

export default function LandingPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "DistribPro",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    description:
      "Portail de commandes B2B pour les distributeurs marocains : catalogue, tarifs personnalisés et gestion des commandes.",
    offers: [
      {
        "@type": "Offer",
        name: "Starter",
        price: "299",
        priceCurrency: "MAD",
        description: "Jusqu'à 300 produits actifs et 20 comptes clients.",
      },
      {
        "@type": "Offer",
        name: "Pro",
        price: "599",
        priceCurrency: "MAD",
        description: "Jusqu'à 2 000 produits actifs et 100 comptes clients.",
      },
    ],
    url: absoluteUrl("/"),
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-navy text-white">
              <Boxes className="h-5 w-5" />
            </span>
            <div className="leading-tight">
              <p className="text-sm font-semibold text-navy">DistribPro</p>
              <p className="text-[10px] uppercase tracking-wider text-slate-400">B2B Maroc</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-6 text-sm text-slate-500 lg:flex">
            <a href="#fonctionnalites" className="hover:text-navy">Fonctionnalités</a>
            <a href="#comment-ca-marche" className="hover:text-navy">Comment ça marche</a>
            <a href="#tarifs" className="hover:text-navy">Tarifs</a>
            <a href="#faq" className="hover:text-navy">FAQ</a>
          </nav>

          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
              <Link href="/login">Connexion</Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex">
              <Link href="/demo">Voir la démo</Link>
            </Button>
            <Button asChild size="sm" className="bg-brand hover:bg-brand-dark">
              <Link href="/signup">
                Créer mon espace <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden border-b border-slate-200 bg-white">
          <div className="absolute inset-0 surface-grid opacity-60" />
          <div className="absolute -right-32 top-0 h-[420px] w-[420px] rounded-full bg-brand/10 blur-3xl" />
          <div className="absolute -left-24 bottom-0 h-72 w-72 rounded-full bg-teal/10 blur-3xl" />

          <div className="relative mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-24">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="border-teal/20 bg-teal-light text-teal-700">
                  <Sparkles className="h-3 w-3" /> Conçu pour les distributeurs marocains
                </Badge>
                <span className="text-xs text-slate-400">Essai gratuit 14 jours · sans carte bancaire</span>
              </div>

              <h1 className="mt-5 text-balance text-4xl font-semibold leading-[1.08] tracking-tight text-navy sm:text-5xl lg:text-[3.4rem]">
                Votre catalogue devient un{" "}
                <span className="text-brand">portail de commandes B2B</span>.
              </h1>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-500 sm:text-lg">
                {BRAND.tagline} Vos clients consultent leurs prix, composent leur panier et envoient
                leur commande. Vous centralisez tout dans un seul espace, en MAD.
              </p>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="bg-brand hover:bg-brand-dark">
                  <Link href="/signup">
                    Démarrer mon essai <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="/demo">
                    <PlayCircle className="h-4 w-4" /> Explorer la démo Atlas
                  </Link>
                </Button>
              </div>

              <div className="mt-8 grid max-w-lg grid-cols-3 gap-4 border-t border-slate-200 pt-6">
                {[
                  { value: "300", label: "produits inclus" },
                  { value: "20", label: "clients B2B" },
                  { value: "0", label: "commission" },
                ].map((stat) => (
                  <div key={stat.label}>
                    <p className="text-2xl font-semibold text-navy">{stat.value}</p>
                    <p className="text-xs text-slate-400">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-lg">
              <div className="absolute -inset-3 rounded-3xl bg-gradient-to-br from-brand/15 via-transparent to-teal/15 blur-xl" />
              <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
                <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-md bg-navy text-white">
                      <Boxes className="h-3.5 w-3.5" />
                    </span>
                    <div>
                      <p className="text-xs font-semibold text-navy">Atlas Distribution</p>
                      <p className="text-[9px] uppercase tracking-wider text-slate-400">Portail B2B</p>
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-rose-300" />
                    <span className="h-2 w-2 rounded-full bg-amber-300" />
                    <span className="h-2 w-2 rounded-full bg-emerald-300" />
                  </div>
                </div>

                <div className="space-y-4 p-4">
                  <div className="rounded-xl bg-gradient-to-r from-navy to-[#1e3a8a] p-4 text-white">
                    <p className="text-[10px] uppercase tracking-wider text-slate-300">Bonjour Sanitaire Plus</p>
                    <p className="mt-1 text-sm font-semibold">Votre sélection du jour</p>
                    <div className="mt-3 flex items-center gap-2 text-[10px] text-slate-300">
                      <BadgeCheck className="h-3 w-3 text-teal" /> Tarifs professionnels appliqués
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { name: "Mitigeur lavabo chromé", sku: "MIT-LAV-001", price: "349,00", min: "6" },
                      { name: "Câble électrique 2,5 mm²", sku: "CAB-25-100", price: "189,00", min: "10" },
                    ].map((product) => (
                      <div key={product.sku} className="rounded-xl border border-slate-100 p-3">
                        <div className="flex h-16 items-center justify-center rounded-lg bg-slate-50">
                          <Package className="h-6 w-6 text-slate-300" />
                        </div>
                        <p className="mt-2 line-clamp-2 min-h-[2rem] text-[11px] font-medium text-navy">
                          {product.name}
                        </p>
                        <p className="font-mono text-[9px] text-slate-400">{product.sku}</p>
                        <div className="mt-2 flex items-center justify-between">
                          <p className="text-xs font-semibold text-navy">{product.price} MAD</p>
                          <span className="rounded-md bg-brand-light px-1.5 py-0.5 text-[9px] font-medium text-brand-dark">
                            Min. {product.min}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-xl border border-slate-100 p-3">
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] font-medium text-navy">Panier</p>
                      <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[9px] font-medium text-amber-700">
                        2 articles
                      </span>
                    </div>
                    <div className="mt-2 space-y-1.5 text-[10px] text-slate-500">
                      <div className="flex justify-between"><span>Mitigeur × 12</span><span>4 188,00 MAD</span></div>
                      <div className="flex justify-between"><span>Câble × 20</span><span>3 780,00 MAD</span></div>
                    </div>
                    <div className="mt-2 flex justify-between border-t border-slate-100 pt-2 text-xs font-semibold text-navy">
                      <span>Total estimé</span><span>7 968,00 MAD</span>
                    </div>
                    <div className="mt-2 rounded-lg bg-navy px-3 py-2 text-center text-[10px] font-medium text-white">
                      Envoyer la commande
                    </div>
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-4 -left-4 hidden items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-card sm:flex">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-50">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                </span>
                <div>
                  <p className="text-[10px] font-medium text-navy">Commande confirmée</p>
                  <p className="text-[9px] text-slate-400">DP-260101-ABC123</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-slate-200 bg-white/60 py-6">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-8 gap-y-3 px-4 text-xs text-slate-400 sm:px-6">
            <span className="font-medium text-slate-500">Pensé pour :</span>
            {SECTOR_LABELS.map((sector) => (
              <span key={sector} className="flex items-center gap-1.5">
                <span className="h-1 w-1 rounded-full bg-teal" /> {sector}
              </span>
            ))}
          </div>
        </section>

        <section id="fonctionnalites" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-20">
          <div className="mx-auto max-w-2xl text-center">
            <Badge className="border-brand/15 bg-brand-light text-brand-dark">Tout-en-un</Badge>
            <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight text-navy sm:text-4xl">
              Arrêtez de gérer vos commandes B2B sur WhatsApp et Excel.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-500 sm:text-base">
              DistribPro réunit votre catalogue, vos tarifs professionnels, vos clients et vos
              commandes dans un espace simple. Vos équipes gagnent du temps, vos clients commandent
              plus facilement.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-soft transition hover:-translate-y-0.5 hover:shadow-card"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-light text-brand-dark">
                  <feature.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 text-base font-semibold text-navy">{feature.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{feature.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="comment-ca-marche" className="border-y border-slate-200 bg-white py-16 lg:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
              <div>
                <Badge className="border-teal/20 bg-teal-light text-teal-700">Mise en route rapide</Badge>
                <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight text-navy sm:text-4xl">
                  Opérationnel en quelques jours, pas en quelques mois.
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-slate-500">
                  Pas d'intégration ERP, pas de projet informatique. Vous importez votre catalogue,
                  vous invitez vos clients et vous recevez vos premières commandes.
                </p>
                <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="flex items-center gap-2 text-sm font-medium text-navy">
                    <ShieldCheck className="h-4 w-4 text-teal" /> Vos données restent isolées
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-500">
                    Chaque entreprise dispose de son propre espace. Les règles de sécurité au niveau
                    des lignes empêchent tout accès aux données d'un autre distributeur.
                  </p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {STEPS.map((step) => (
                  <div key={step.number} className="rounded-xl border border-slate-200 bg-white p-5">
                    <div className="flex items-center justify-between">
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-navy text-white">
                        <step.icon className="h-4 w-4" />
                      </span>
                      <span className="text-xs font-semibold text-slate-300">{step.number}</span>
                    </div>
                    <h3 className="mt-3 text-sm font-semibold text-navy">{step.title}</h3>
                    <p className="mt-1 text-xs leading-relaxed text-slate-500">{step.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-20">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft sm:p-8">
              <Badge className="border-rose-200 bg-rose-50 text-rose-700">Sans DistribPro</Badge>
              <h3 className="mt-3 text-xl font-semibold text-navy">Le quotidien des commandes dispersées</h3>
              <ul className="mt-4 space-y-3 text-sm text-slate-500">
                {[
                  "Appels, messages WhatsApp et photos de catalogues",
                  "Prix différents à retrouver dans des fichiers Excel",
                  "Risque d'erreur sur les quantités et les références",
                  "Commandes perdues et suivi difficile",
                  "Aucune vision consolidée des ventes",
                ].map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-400" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-teal/20 bg-gradient-to-br from-teal-light to-white p-6 shadow-soft sm:p-8">
              <Badge className="border-teal/20 bg-white text-teal-700">Avec DistribPro</Badge>
              <h3 className="mt-3 text-xl font-semibold text-navy">Un canal de commande clair et maîtrisé</h3>
              <ul className="mt-4 space-y-3 text-sm text-slate-600">
                {[
                  "Un portail client accessible 24h/24, sur mobile",
                  "Des prix justes, appliqués automatiquement",
                  "Des quantités minimum contrôlées à la commande",
                  "Un suivi de statut partagé avec le client",
                  "Des rapports prêts à exploiter",
                ].map((item) => (
                  <li key={item} className="flex gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section id="tarifs" className="border-y border-slate-200 bg-white py-16 lg:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="mx-auto max-w-2xl text-center">
              <Badge className="border-brand/15 bg-brand-light text-brand-dark">Tarifs simples</Badge>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-navy sm:text-4xl">
                Choisissez le plan adapté à votre activité.
              </h2>
              <p className="mt-3 text-sm text-slate-500">
                Prix en dirhams marocains, sans commission sur vos commandes. Essai gratuit de 14
                jours sur le plan Starter.
              </p>
            </div>

            <div className="mx-auto mt-10 grid max-w-4xl gap-5 md:grid-cols-2">
              {Object.values(PLANS).map((plan) => {
                const featured = plan.id === "pro";
                return (
                  <div
                    key={plan.id}
                    className={
                      featured
                        ? "relative rounded-2xl border-2 border-navy bg-navy p-6 text-white shadow-card sm:p-7"
                        : "rounded-2xl border border-slate-200 bg-white p-6 shadow-soft sm:p-7"
                    }
                  >
                    {featured && (
                      <span className="absolute -top-3 left-6 rounded-full bg-teal px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">
                        Recommandé
                      </span>
                    )}
                    <div className="flex items-end justify-between gap-3">
                      <div>
                        <h3 className={featured ? "text-lg font-semibold text-white" : "text-lg font-semibold text-navy"}>
                          {plan.name}
                        </h3>
                        <p className={featured ? "text-xs text-slate-300" : "text-xs text-slate-400"}>
                          {plan.id === "starter" ? "Pour démarrer sereinement" : "Pour accélérer vos ventes B2B"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={featured ? "text-3xl font-semibold text-white" : "text-3xl font-semibold text-navy"}>
                          {plan.priceMAD}
                        </p>
                        <p className={featured ? "text-[11px] text-slate-300" : "text-[11px] text-slate-400"}>
                          MAD / mois
                        </p>
                      </div>
                    </div>

                    <div className={featured ? "mt-5 border-t border-white/10 pt-5" : "mt-5 border-t border-slate-100 pt-5"}>
                      <ul className="space-y-2.5 text-sm">
                        {plan.features.map((feature) => (
                          <li key={feature} className="flex gap-2">
                            <Check className={featured ? "mt-0.5 h-4 w-4 shrink-0 text-teal" : "mt-0.5 h-4 w-4 shrink-0 text-teal-600"} />
                            <span className={featured ? "text-slate-200" : "text-slate-600"}>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <Button
                      asChild
                      className={
                        featured
                          ? "mt-6 w-full bg-white text-navy hover:bg-slate-100"
                          : "mt-6 w-full bg-brand hover:bg-brand-dark"
                      }
                    >
                      <Link href="/signup">
                        Commencer avec {plan.name} <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                    <p className={featured ? "mt-2 text-center text-[10px] text-slate-400" : "mt-2 text-center text-[10px] text-slate-400"}>
                      {plan.maxProducts} produits · {plan.maxCustomers} clients inclus
                    </p>
                  </div>
                );
              })}
            </div>

            <p className="mt-6 text-center text-xs text-slate-400">
              Besoin d'un volume supérieur ?{" "}
              <a href={`mailto:${BRAND.email}`} className="font-medium text-brand hover:underline">
                Contactez-nous
              </a>
              . Les abonnements sont activés et renouvelés par l'équipe DistribPro.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-20">
          <div className="grid gap-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-soft lg:grid-cols-[1fr_1.2fr] lg:p-8">
            <div>
              <Badge className="border-teal/20 bg-teal-light text-teal-700">
                <Sparkles className="h-3 w-3" /> Démo prête à explorer
              </Badge>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-navy sm:text-3xl">
                Essayez Atlas Distribution, sans inscription.
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-500">
                Un espace de démonstration isolé avec 5 catégories, 20 produits, 5 clients et 8
                commandes. Connectez-vous en tant que fournisseur ou client B2B pour voir les deux
                côtés de la plateforme.
              </p>
              <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                <Button asChild className="bg-brand hover:bg-brand-dark">
                  <Link href="/demo">
                    Ouvrir la démo <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/signup">Créer mon propre espace</Link>
                </Button>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { icon: Package, label: "20 produits", text: "Catalogue prêt à parcourir" },
                { icon: Users, label: "5 clients", text: "Groupes et tarifs différents" },
                { icon: ShoppingCart, label: "8 commandes", text: "Statuts et historiques" },
                { icon: Wallet, label: "Prix en MAD", text: "Montants en centimes" },
              ].map((item) => (
                <div key={item.label} className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
                  <item.icon className="h-5 w-5 text-brand" />
                  <p className="mt-2 text-sm font-semibold text-navy">{item.label}</p>
                  <p className="text-xs text-slate-400">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="faq" className="border-y border-slate-200 bg-white py-16 lg:py-20">
          <div className="mx-auto max-w-4xl px-4 sm:px-6">
            <div className="text-center">
              <Badge className="border-slate-200 bg-slate-100 text-slate-600">
                <CircleHelp className="h-3 w-3" /> Questions fréquentes
              </Badge>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-navy sm:text-4xl">
                Tout ce que vous devez savoir avant de démarrer.
              </h2>
            </div>

            <div className="mt-8 divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
              {FAQ.map((item) => (
                <details key={item.question} className="group px-5 py-4">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-medium text-navy">
                    {item.question}
                    <ChevronRight className="h-4 w-4 shrink-0 text-slate-400 transition group-open:rotate-90" />
                  </summary>
                  <p className="mt-2 text-sm leading-relaxed text-slate-500">{item.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-20">
          <div className="relative overflow-hidden rounded-2xl bg-navy p-8 text-white shadow-card sm:p-10">
            <div className="absolute inset-0 surface-grid opacity-10" />
            <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-brand/30 blur-3xl" />
            <div className="relative flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-center">
              <div className="max-w-2xl">
                <p className="text-xs font-medium uppercase tracking-wider text-teal">
                  Prêt à moderniser vos commandes B2B ?
                </p>
                <h2 className="mt-2 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
                  Votre catalogue mérite mieux qu'un PDF envoyé sur WhatsApp.
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-slate-300">
                  Créez votre espace en quelques minutes et invitez vos premiers clients
                  professionnels. Essai gratuit de 14 jours, sans engagement.
                </p>
              </div>
              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                <Button asChild size="lg" className="bg-white text-navy hover:bg-slate-100">
                  <Link href="/signup">
                    Créer mon espace <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-white/25 bg-transparent text-white hover:bg-white/10 hover:text-white">
                  <Link href="/demo">Voir la démo</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
          <div className="grid gap-8 md:grid-cols-4">
            <div className="md:col-span-2">
              <Link href="/" className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-navy text-white">
                  <Boxes className="h-5 w-5" />
                </span>
                <span className="text-sm font-semibold text-navy">DistribPro</span>
              </Link>
              <p className="mt-3 max-w-sm text-xs leading-relaxed text-slate-400">
                {BRAND.subtitle} Une solution pensée pour les grossistes et distributeurs au Maroc.
              </p>
              <div className="mt-4 flex flex-wrap gap-2 text-[11px] text-slate-400">
                <span className="rounded-full border border-slate-200 px-2.5 py-1">MAD</span>
                <span className="rounded-full border border-slate-200 px-2.5 py-1">Français</span>
                <span className="rounded-full border border-slate-200 px-2.5 py-1">Mobile</span>
                <span className="rounded-full border border-slate-200 px-2.5 py-1">B2B</span>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Produit</p>
              <div className="mt-3 space-y-2 text-xs text-slate-500">
                <a href="#fonctionnalites" className="block hover:text-brand">Fonctionnalités</a>
                <a href="#tarifs" className="block hover:text-brand">Tarifs</a>
                <Link href="/demo" className="block hover:text-brand">Démo</Link>
                <Link href="/signup" className="block hover:text-brand">Créer un espace</Link>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Compte</p>
              <div className="mt-3 space-y-2 text-xs text-slate-500">
                <Link href="/login" className="block hover:text-brand">Connexion</Link>
                <Link href="/forgot-password" className="block hover:text-brand">Mot de passe oublié</Link>
                <a href={`mailto:${BRAND.email}`} className="block hover:text-brand">Contact</a>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col items-center justify-between gap-2 border-t border-slate-100 pt-5 text-[11px] text-slate-400 sm:flex-row">
            <p>© {new Date().getFullYear()} DistribPro. Tous droits réservés.</p>
            <p className="flex items-center gap-2">
              <Globe2 className="h-3 w-3" /> Maroc · Prix en dirhams (MAD)
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
