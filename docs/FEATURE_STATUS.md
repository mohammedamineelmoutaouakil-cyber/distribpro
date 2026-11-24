# DistribPro — Fonctionnalités implémentées / incomplètes

## Implémentées

- Authentification email/mot de passe, reset, onboarding, invitation client.
- Multi-tenant par `company_id` et RLS.
- Dashboard fournisseur : vue d'ensemble, produits, catégories, clients, commandes, tarifs, rapports, paramètres.
- CRUD produits, images, SKU, MOQ, disponibilité, mise en avant.
- Import CSV avec aperçu, validation et détection de doublons.
- Gestion clients, groupes, invitations, statuts.
- Tarification personnalisée par groupe et par client.
- Portail client : accueil, catalogue, fiche produit, panier, commande, historique, compte.
- Commandes atomiques avec prix recalculés côté serveur.
- Statuts de commande et mise à jour fournisseur.
- Partage WhatsApp via `wa.me`.
- Super-admin : entreprises, abonnements, statistiques plateforme.
- Landing page SEO et démo.
- Tests unitaires de base.
- Scripts seed démo et test RLS.

## Incomplètes ou à valider

- Exécution réelle de `npm run seed:demo` sur Supabase.
- Exécution réelle de `npm run test:rls` sur Supabase.
- Parcours complet validé avec une base live.
- Responsivité mobile à valider manuellement.
- Rate limiter mono-instance à remplacer pour la production à grande échelle.
- Abonnements gérés manuellement.
- Pas de paiement en ligne, ERP, logistique ni multi-devises.