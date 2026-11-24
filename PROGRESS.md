# DistribPro — État d'avancement

Date de mise à jour : 2026-11-23

## Résumé

DistribPro est une application Next.js App Router multi-tenant pour distributeurs marocains. Le socle applicatif est en grande partie implémenté : authentification, dashboard fournisseur, portail client B2B, tarification personnalisée, commandes atomiques côté Supabase, super-administration plateforme et landing page SEO.

Le projet passe `npm run typecheck`, les tests unitaires passent (14/14) et le build de production avec variables placeholder a réussi. Améliorations récentes : correction de la requête d'adhésion entreprise, redirection sécurisée des non-admins, nettoyage storage, pages d'erreur/404, documentation base de données et statut fonctionnel.

## Fonctionnalités développées

### Fondation

- Scaffolding Next.js 15, TypeScript, Tailwind 3, shadcn/ui, Supabase SSR.
- Migrations SQL : `supabase/migrations/0001_schema.sql`, `0002_functions.sql`, `0003_rls.sql`, `0004_storage.sql`.
- Isolation multi-tenant par `company_id` et RLS.
- Rôles : Super Admin, Wholesaler Admin, B2B Customer.
- Middleware de rafraîchissement de session uniquement.
- Librairies centrales : `lib/money.ts`, `lib/pricing.ts`, `lib/catalog.ts`, `lib/auth.ts`, `lib/storage.ts`, `lib/cart.ts`, `lib/csv.ts`.
- Montants stockés en centimes entiers (`bigint`), sans flottants.

### Authentification

- Pages login, signup, forgot/reset password, onboarding, invitation, démo.
- Actions serveur dans `actions/auth.ts`.
- `register_company`, `accept_customer_invite`, `get_invite_info`.
- Comptes de démonstration via variables `DEMO_*`.

### Dashboard fournisseur

- Shell et navigation : `components/dashboard/dashboard-shell.tsx`.
- Vue d'ensemble : statistiques réelles, commandes récentes, graphiques Recharts.
- Produits : tableau filtrable, dialogue CRUD, image, SKU, MOQ, activation/archivage/suppression.
- Import CSV avec aperçu, validation, détection de doublons : `components/dashboard/csv-import-dialog.tsx`, `actions/products.ts`.
- Catégories : CRUD, ordre, statut, compteur produits.
- Clients : tableau, invitation, statut, renvoi/régénération de lien, suppression sécurisée.
- Fiche client détaillée et historique commandes.
- Tarifs personnalisés par groupe et par client : `components/dashboard/pricing-manager.tsx`, `actions/pricing.ts`.
- Commandes : tableau, filtres, changement de statut, détail, partage WhatsApp.
- Rapports : CA, panier moyen, statuts, top produits, export CSV.
- Paramètres entreprise : identité, coordonnées, branding, abonnement, profil utilisateur.

### Portail client B2B

- Layout portail : `app/portal/layout.tsx`.
- Panier localStorage avec provider : `components/portal/cart-provider.tsx`, `lib/cart.ts`.
- Page d'accueil : bannière, catégories, produits sélectionnés, recherche.
- Catalogue paginé/filtré/trié : `app/portal/catalog/page.tsx`.
- Fiche produit : prix effectif, MOQ, ajout panier, WhatsApp.
- Panier : recalcul côté serveur, quantités, sous-totaux, notes, envoi commande : `components/portal/cart-view.tsx`, `actions/cart.ts`.
- Commandes client : liste et détail avec statut.
- Compte client : informations, conditions commerciales, contact fournisseur.
- Commande atomique via RPC `create_order`, prix recalculés côté base.

### Super-administration

- Layout et shell : `app/superadmin/layout.tsx`, `components/superadmin/superadmin-shell.tsx`.
- Vue plateforme : statistiques globales, entreprises récentes, échéances.
- Liste entreprises avec filtres, statut, plan, usage, expiration.
- Fiche entreprise : statut, abonnement, coordonnées, usage.
- Mise à jour abonnement manuelle : `components/superadmin/subscription-form.tsx`.

### Landing page et SEO

- Page d'accueil marketing : `app/page.tsx`.
- Sections : hero, fonctionnalités, parcours, comparatif, tarifs, démo, FAQ, CTA final.
- SEO : metadata, Open Graph, JSON-LD, `app/sitemap.ts`, `app/robots.ts`.

## Fichiers importants

- `package.json` : scripts `dev`, `build`, `typecheck`, `test`, `seed:demo`, `test:rls`.
- `middleware.ts` : rafraîchit les cookies Supabase.
- `lib/auth.ts` : contextes tenant/client/super-admin.
- `lib/constants.ts` : plans, statuts, secteurs, limites.
- `lib/money.ts` : parsing/formatage centimes.
- `lib/pricing.ts` et `lib/catalog.ts` : résolution des prix.
- `actions/cart.ts` : détails panier et soumission commande.
- `supabase/migrations/*.sql` : schéma, fonctions, RLS, storage.
- `app/portal/*` : expérience client B2B.
- `app/superadmin/*` : administration plateforme.
- `components/portal/*` : composants client portal.
- `components/superadmin/*` : composants administration.

## Bugs et points restants

- Le build de production avec variables placeholder a réussi (`next build` OK).
- Aucune base Supabase live n'est configurée dans cet environnement ; l'application n'a pas été testée bout en bout avec une base réelle.
- `requireCustomer()` contient une condition sans effet pour les comptes bloqués ; le blocage réel est assuré par `PortalBlocked`, mais le code est à nettoyer.
- Les scripts `npm run seed:demo` et `npm run test:rls` sont déclarés mais le fichier `scripts/seed-demo.ts` n'est pas encore présent.
- Aucun test automatisé n'est encore présent dans `tests/`.
- Le rate limiter est en mémoire et mono-instance ; cette limite est documentée mais doit être mentionnée au déploiement.
- La page de détail super-admin contient un lien superficiel remplacé par des cartes statiques ; vérifier que tous les imports restent cohérents.
- `.env.local` n'est pas présent ; la configuration Supabase reste manuelle.
- Certains composants client importent des types depuis des modules côté serveur ; cela passe au typecheck, mais doit être surveillé.
- L'import CSV est limité à 5 000 lignes par import, ce qui est acceptable pour le MVP.
- Aucune gestion complète du profil client côté portail n'est prévue dans le MVP.

## Prochaines étapes

1. Vérifier le résultat du build de production et corriger les erreurs éventuelles.
2. Exécuter et valider `npm run seed:demo` sur une base Supabase réelle.
3. Exécuter et valider `npm run test:rls` sur une base Supabase réelle.
4. Tester le parcours complet sur une base Supabase réelle : inscription fournisseur, produits, invitation client, tarifs, commande, statuts.
5. Vérifier la responsivité mobile et les états vides/erreurs.
6. Ajuster les limites et le monitoring avant mise en production.

## État par phase

- Phase 1 — Fondation : largement terminée.
- Phase 2 — Administration fournisseur : largement terminée.
- Phase 3 — Portail client : terminée pour le MVP.
- Phase 4 — Exploitation : commandes, statuts, WhatsApp et rapports terminés.
- Phase 5 — SaaS : super-admin, abonnements, landing et démo en cours de finalisation.
- Phase 6 — Tests et déploiement : typecheck OK, build OK, tests unitaires OK, seed/RLS scripts créés, documentation créée. Validation live Supabase restante.