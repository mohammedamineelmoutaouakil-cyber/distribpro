# Déploiement DistribPro

## 1. Projet Supabase

1. Créez un projet Supabase.
2. Copiez l'URL du projet et la clé anon.
3. Récupérez la clé service role pour les scripts d'administration.
4. Appliquez les migrations dans l'ordre :
   - `0001_schema.sql`
   - `0002_functions.sql`
   - `0003_rls.sql`
   - `0004_storage.sql`

## 2. Authentification Supabase

- Activez l'authentification email/mot de passe.
- Configurez les URLs de redirection :
  - `http://localhost:3000/auth/callback`
  - `https://VOTRE_DOMAINE/auth/callback`
- Désactivez ou configurez la confirmation email selon votre stratégie.
- Pour la démo, laissez la création de compte avec session immédiate ou exécutez le seed après confirmation.

## 3. Storage

Les buckets suivants doivent exister :

- `product-images`
- `company-assets`

Ils sont créés comme buckets privés par `0004_storage.sql`. Les images sont servies via URLs signées générées côté serveur.

## 4. Variables d'environnement Vercel

Ajoutez dans Vercel :

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_SITE_URL=https://VOTRE_DOMAINE
NEXT_PUBLIC_SHOW_DEMO=true

DEMO_ADMIN_EMAIL=admin@atlas-demo.ma
DEMO_ADMIN_PASSWORD=Demo1234!
DEMO_CUSTOMER_EMAIL=client@atlas-demo.ma
DEMO_CUSTOMER_PASSWORD=Demo1234!
DEMO_SUPERADMIN_EMAIL=superadmin@distribpro.ma
DEMO_SUPERADMIN_PASSWORD=Demo1234!
```

Ne jamais exposer `SUPABASE_SERVICE_ROLE_KEY` dans le navigateur. Elle est utilisée uniquement par `scripts/seed-demo.ts` et `scripts/test-rls.ts`.

## 5. Déploiement Vercel

```bash
npm run build
```

Puis déployez le dépôt sur Vercel. Le projet est compatible avec le runtime Node standard et n'utilise pas de service payant.

## 6. Données de démonstration

Après déploiement et configuration des variables, exécutez localement ou dans un environnement sécurisé :

```bash
npm run seed:demo
```

Cela crée le locataire Atlas Distribution et les comptes de démonstration.

## 7. Vérification post-déploiement

- Ouvrir `/` et vérifier la landing page.
- Créer un compte fournisseur.
- Vérifier l'onboarding et le dashboard.
- Importer un CSV de produits.
- Inviter un client et accepter l'invitation.
- Définir un tarif personnalisé.
- Passer une commande côté client.
- Mettre à jour le statut côté fournisseur.
- Vérifier `/superadmin` avec un compte plateforme.
- Tester le partage WhatsApp via les liens `wa.me`.

## 8. Observations

- Le rate limiter est en mémoire et mono-instance. Sur Vercel avec plusieurs instances, il devient best-effort. Pour une production à plus grande échelle, remplacer par Redis ou Upstash.
- Les abonnements sont gérés manuellement par le super-admin.
- Les images sont privées et servies via URLs signées à durée limitée.