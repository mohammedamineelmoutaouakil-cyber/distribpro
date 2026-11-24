export const BRAND = {
  name: "DistribPro",
  tagline: "Transformez votre catalogue en portail de commandes B2B.",
  subtitle:
    "Centralisez vos produits, vos tarifs professionnels et les commandes de vos clients sur une seule plateforme.",
  email: "contact@distribpro.ma",
  phone: "+212 6 00 00 00 00",
};

export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "preparing",
  "ready",
  "completed",
  "cancelled",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_META: Record<
  OrderStatus,
  { label: string; description: string; className: string; dot: string }
> = {
  pending: {
    label: "En attente",
    description: "Commande reçue, en attente de confirmation.",
    className: "bg-amber-50 text-amber-700 border-amber-200",
    dot: "bg-amber-500",
  },
  confirmed: {
    label: "Confirmée",
    description: "Commande confirmée par le fournisseur.",
    className: "bg-blue-50 text-blue-700 border-blue-200",
    dot: "bg-blue-500",
  },
  preparing: {
    label: "En préparation",
    description: "La commande est en cours de préparation.",
    className: "bg-indigo-50 text-indigo-700 border-indigo-200",
    dot: "bg-indigo-500",
  },
  ready: {
    label: "Prête",
    description: "Commande prête à être retirée ou livrée.",
    className: "bg-teal-50 text-teal-700 border-teal-200",
    dot: "bg-teal-500",
  },
  completed: {
    label: "Terminée",
    description: "Commande livrée et clôturée.",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-500",
  },
  cancelled: {
    label: "Annulée",
    description: "Commande annulée.",
    className: "bg-rose-50 text-rose-700 border-rose-200",
    dot: "bg-rose-500",
  },
};

export const CUSTOMER_STATUS_META: Record<
  string,
  { label: string; className: string }
> = {
  invited: { label: "Invité", className: "bg-slate-100 text-slate-600 border-slate-200" },
  pending: { label: "En attente", className: "bg-amber-50 text-amber-700 border-amber-200" },
  active: { label: "Actif", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  suspended: { label: "Suspendu", className: "bg-rose-50 text-rose-700 border-rose-200" },
};

export const PLANS = {
  starter: {
    id: "starter",
    name: "Starter",
    priceMAD: 299,
    maxProducts: 300,
    maxCustomers: 20,
    features: [
      "Catalogue produits et catégories",
      "Jusqu'à 300 produits actifs",
      "20 comptes clients professionnels",
      "Gestion des commandes",
      "Partage WhatsApp",
    ],
  },
  pro: {
    id: "pro",
    name: "Pro",
    priceMAD: 599,
    maxProducts: 2000,
    maxCustomers: 100,
    features: [
      "Tout le plan Starter",
      "Jusqu'à 2 000 produits actifs",
      "100 comptes clients professionnels",
      "Tarifs personnalisés par client et groupe",
      "Rapports et analyses",
      "Support prioritaire",
    ],
  },
} as const;

export type PlanId = keyof typeof PLANS;

export const PLAN_IDS = ["starter", "pro"] as const;
export const SUBSCRIPTION_STATUSES = ["trial", "active", "expired", "suspended"] as const;
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];

export const SUBSCRIPTION_STATUS_META: Record<string, { label: string; className: string }> = {
  trial: { label: "Essai", className: "bg-sky-50 text-sky-700 border-sky-200" },
  active: { label: "Actif", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  expired: { label: "Expiré", className: "bg-amber-50 text-amber-700 border-amber-200" },
  suspended: { label: "Suspendu", className: "bg-rose-50 text-rose-700 border-rose-200" },
};

export const CUSTOMER_GROUPS = [
  { name: "Standard", slug: "standard", description: "Client professionnel standard" },
  { name: "Professionnel", slug: "professionnel", description: "Client professionnel régulier" },
  { name: "VIP", slug: "vip", description: "Grand compte, tarifs privilégiés" },
];

export const SECTORS = [
  "Sanitaire et plomberie",
  "Électricité",
  "Éclairage",
  "Énergie solaire",
  "Matériaux de construction",
  "Fournitures industrielles",
  "Autre",
];

export const PRODUCT_IMAGE_MAX_BYTES = 2 * 1024 * 1024;
export const PRODUCT_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const CSV_MAX_BYTES = 2 * 1024 * 1024;
export const DEMO_COMPANY_SLUG = "atlas-distribution";

export const PUBLIC_ROUTES = ["/", "/login", "/signup", "/forgot-password", "/reset-password", "/invite", "/demo"];
