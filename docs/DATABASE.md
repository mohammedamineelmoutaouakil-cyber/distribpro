# DistribPro — Schéma de base de données

## Principes

- Multi-tenant par `company_id`.
- Isolation par Row Level Security (RLS).
- Montants en centimes entiers (`bigint`).
- Aucune écriture directe des commandes par le navigateur : création via `public.create_order()`.

## Entités principales

### Identité et tenant

- `profiles` : profil 1:1 avec `auth.users`.
- `companies` : locataire / distributeur.
- `company_memberships` : lien utilisateur ↔ entreprise avec rôle `admin` ou `staff`.
- `subscriptions` : plan, statut et expiration par entreprise.
- `platform_admins` : super-administrateurs, hors métadonnées utilisateur.

### Clients B2B

- `customer_groups` : groupes tarifaires (`Standard`, `Professionnel`, `VIP`).
- `customer_accounts` : client professionnel, statut, token d'invitation, groupe.

### Catalogue

- `categories` : catégories par entreprise.
- `products` : produits, SKU, prix de base, MOQ, disponibilité, image.
- `product_images` : images additionnelles optionnelles.

### Tarification

- `customer_group_prices` : prix par produit et groupe.
- `customer_specific_prices` : prix par produit et client.

Priorité : client spécifique → groupe → prix de base.

### Commandes

- `orders` : référence unique, client, statut, total, nombre d'articles, notes.
- `order_items` : snapshot des articles, quantités, prix unitaires et totaux.

## Relations

- `company_memberships.company_id` → `companies.id`
- `customer_accounts.company_id` → `companies.id`
- `customer_accounts.group_id` → `customer_groups.id`
- `products.company_id` → `companies.id`
- `products.category_id` → `categories.id`
- `customer_group_prices.product_id` → `products.id`
- `customer_group_prices.group_id` → `customer_groups.id`
- `customer_specific_prices.product_id` → `products.id`
- `customer_specific_prices.customer_id` → `customer_accounts.id`
- `orders.company_id` → `companies.id`
- `orders.customer_id` → `customer_accounts.id`
- `order_items.order_id` → `orders.id`
- `order_items.company_id` → `companies.id`
- `subscriptions.company_id` → `companies.id`

## Fonctions importantes

- `register_company()` : crée entreprise, abonnement trial, groupes et catégorie par défaut.
- `get_invite_info()` : lecture sécurisée d'une invitation.
- `accept_customer_invite()` : associe un utilisateur à un compte client.
- `create_order()` : création atomique avec prix autoritaires côté serveur.
- `is_platform_admin()`, `is_company_member()`, `is_company_admin()` : helpers RLS.

## Stockage

- Bucket `product-images` : images produits, privé.
- Bucket `company-assets` : logo et bannière, privé.
- Chemins préfixés par `company_id`.

## Index et contraintes

- SKU unique par entreprise.
- Email client unique par entreprise.
- Quantité minimum entre 1 et 100000.
- Prix en centimes supérieurs ou égaux à 0.
- Statuts de commande et client via enums PostgreSQL.