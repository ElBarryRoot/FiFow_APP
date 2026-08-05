# FI FOW — Sprints 13, 14 et 15

## Sprint 13 — Paiement intégré

Modules ajoutés :

- `payments/payment.model.js`
- `payments/payment.controller.js`
- `payments/payment.service.js`
- `payments/paymentProvider.service.js`
- `payments/payment.validator.js`
- `payments/payment.routes.js`
- `payments/payment.admin.routes.js`

Routes ajoutées :

```txt
POST /api/payments/initiate
GET  /api/payments/me
GET  /api/payments/:id
POST /api/payments/webhook/:provider
GET  /api/admin/payments
```

Règles respectées :

- Le frontend ne valide jamais un paiement.
- Le statut `SUCCESS` vient uniquement du webhook/callback serveur.
- Chaque paiement possède une `internalReference` unique.
- Le webhook est protégé par `x-fi-fow-signature` si `PAYMENT_WEBHOOK_SECRET` est défini.
- Les paiements ne sont jamais supprimés physiquement.

## Sprint 14 — Boosts payants

Modules ajoutés :

- `boosts/boost.model.js`
- `boosts/boostPlan.model.js`
- `boosts/boost.controller.js`
- `boosts/boost.validator.js`
- `boosts/boost.routes.js`
- `boosts/boost.admin.routes.js`

Routes ajoutées :

```txt
GET   /api/boost-plans
POST  /api/products/:id/boosts
GET   /api/me/boosts
GET   /api/admin/boosts
PATCH /api/admin/boosts/:id/cancel
POST  /api/admin/boost-plans
PATCH /api/admin/boost-plans/:id
PATCH /api/admin/boost-plans/:id/archive
```

Règles respectées :

- Un produit doit être `AVAILABLE` et `APPROVED` pour être boosté.
- Un produit archivé, vendu, rejeté, masqué ou trop signalé ne peut pas être boosté.
- Un vendeur suspendu ou banni ne peut pas booster.
- Un boost devient actif uniquement après paiement confirmé côté serveur.
- Un produit ne peut pas avoir plusieurs boosts actifs ou en attente en même temps.
- Annulation admin avec `AdminLog`.

## Sprint 15 — Notifications internes

Modules ajoutés :

- `notifications/notification.model.js`
- `notifications/notification.controller.js`
- `notifications/notification.service.js`
- `notifications/notification.validator.js`
- `notifications/notification.routes.js`

Routes ajoutées :

```txt
GET   /api/notifications
PATCH /api/notifications/:id/read
PATCH /api/notifications/read-all
```

Notifications intégrées :

- nouveau message ;
- paiement confirmé ;
- paiement échoué ;
- boost activé ;
- produit liké ;
- produit ajouté en favori ;
- intention d'achat ;
- vente confirmée.

## Variables d'environnement ajoutées

```env
PAYMENT_ENABLED=true
PAYMENT_PROVIDER_KEY=replace_with_provider_key
PAYMENT_WEBHOOK_SECRET=replace_with_a_long_random_webhook_secret
```

## Point de sécurité important

Le provider de paiement réel devra remplacer le provider mock dans `paymentProvider.service.js`. Le code est déjà structuré pour empêcher la validation du paiement depuis le frontend.
