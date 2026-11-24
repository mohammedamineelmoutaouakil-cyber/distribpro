# DistribPro

DistribPro est une plateforme SaaS B2B d'ordering pour distributeurs et grossistes marocains. Elle permet de créer un catalogue professionnel, d'inviter des clients professionnels, d'appliquer des tarifs personnalisés et de recevoir des commandes centralisées.

## Stack technique

- Next.js 15 (App Router, TypeScript)
- Tailwind CSS 3 + shadcn/ui
- Supabase (Auth, PostgreSQL, Storage, RLS)
- Zod + React Hook Form
- TanStack Table
- Recharts
- Vercel

## Prérequis

- Node.js 20+ (projet validé avec Node 26.13.1)
- Un projet Supabase
- npm

Sur Windows avec PowerShell, utilisez `npm.cmd` si la politique d'exécution bloque `npm`.

## Installation locale

```bash
npm install
cp .env.example .env.local
```

Renseignez ensuite `.env.local` :

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## Base de données Supabase

Appliquez les migrations dans cet ordre :

1. `supabase/migrations/0001_schema.sql`
2. `supabase/migrations/0002_functions.sql`
3. `supabase/migrations/0003_rls.sql`
4. `supabase/migrations/0004_storage.sql`

Les buckets privés `product-images` et `company-assets` sont créés par la migration storage.

## Données de démonstration

```bash
npm run seed:demo
```

Le script crée le locataire **Atlas Distribution** avec :

- 5 catégories
- 20 produits
- 5 clients professionnels
- 8 commandes
- 3 comptes de démonstration :
  - administrateur fournisseur
  - client B2B
  - super administrateur

Les identifiants sont ceux définis dans `.env.example` (`DEMO_*`).

## Lancement

```bash
npm run dev
```

Application disponible sur `http://localhost:3000`.

## Commandes de vérification

```bash
npm run typecheck
npm run test
npm run build
```

Résultats actuels :

- `npm run typecheck` : OK
- `npm run test` : 5 fichiers, 14 tests passés
- `npm run build` : OK

## Test RLS

Avec une base Supabase provisionnée et les variables d'environnement renseignées :

```bash
npm run test:rls
```

Le script crée deux locataires éphémères, vérifie qu'un administrateur ne peut pas lire ni insérer dans l'autre entreprise, puis nettoie les données.

## Structure importante

- `app/` : pages App Router, layouts, API routes.
- `actions/` : Server Actions sécurisées.
- `components/` : composants UI, dashboard, portail, super-admin.
- `lib/` : authentification, pricing, CSV, stockage, helpers.
- `supabase/migrations/` : schéma, fonctions, RLS, storage.
- `scripts/` : seed démo et test RLS.
- `tests/` : tests unitaires.

## Parcours produit couvert

1. Un fournisseur crée un compte.
2. Il configure son entreprise.
3. Il ajoute des produits et catégories.
4. Il invite un client professionnel.
5. Il définit ses tarifs personnalisés.
6. Le client parcourt le catalogue et commande.
7. Le fournisseur reçoit et gère la commande.

## Sécurité

- Isolation par `company_id` et RLS.
- Rôles vérifiés côté serveur.
- Prix et totaux recalculés côté serveur/base de données.
- Montants en centimes entiers.
- Buckets Storage privés avec URLs signées.
- Validation Zod sur les formulaires et actions.
- Rate limiting en mémoire pour les actions sensibles.

## Limitations connues du MVP

- Pas de paiement en ligne.
- Pas de logistique ni ERP.
- Pas de multi-devises ni i18n complète.
- Rate limiter mono-instance.
- Les abonnements sont gérés manuellement par le super-admin.
- Les emails transactionnels dépendent de la configuration Supabase Auth.

## Documentation complémentaire

- `DEPLOYMENT.md` : déploiement Vercel + Supabase.
- `docs/DATABASE.md` : schéma de base de données.
- `docs/FEATURE_STATUS.md` : fonctionnalités implémentées et incomplètes.
- `PROGRESS.md` : état détaillé du projet.
- `.env.example` : variables d'environnement.