# FI FOW Backend — Sprints 0 à 5

Ce livrable ajoute les sprints 3, 4 et 5 sur la base des sprints 0, 1 et 2 déjà réalisés.

## Sprint 0 — Initialisation backend
- Node.js + Express
- MongoDB + Mongoose
- Architecture modulaire
- Health check
- Swagger préparé
- README et `.env.example`

## Sprint 1 — Sécurité de base
- Helmet
- CORS
- Rate limit
- Mongo sanitize
- HPP
- Compression
- Error handler global
- Réponses API standardisées
- Logs Winston/Morgan

## Sprint 2 — Auth OTP/JWT
- User
- OtpCode
- OTP hashé
- Expiration OTP
- Limitation tentatives
- JWT access token
- Refresh token hashé
- Logout / logout-all

## Sprint 3 — Users, profil, archivage, blocage et signalement
Routes :
- `GET /api/users/me`
- `PATCH /api/users/me`
- `POST /api/users/me/archive`
- `GET /api/users/:id/public`
- `POST /api/users/:id/report`
- `POST /api/users/:id/block`
- `DELETE /api/users/:id/block`

Règles :
- Le téléphone n’est jamais exposé dans le profil public.
- Un compte archivé garde ses données en base pour audit.
- Un utilisateur ne peut pas se signaler ou se bloquer lui-même.
- Les signalements créent une entrée Report.

## Sprint 4 — Vérification vendeur
Routes utilisateur :
- `POST /api/seller-verification/request`
- `GET /api/seller-verification/me`

Routes admin :
- `PATCH /api/admin/seller-verifications/:id/approve`
- `PATCH /api/admin/seller-verifications/:id/reject`
- `PATCH /api/admin/users/:id/remove-verified-badge`

Règles :
- Téléphone vérifié obligatoire.
- Photo de profil obligatoire.
- Commune/quartier obligatoires.
- Une seule demande PENDING par utilisateur.
- Toute validation ou rejet crée un AdminLog.

## Sprint 5 — Catégories et sous-catégories
Routes publiques :
- `GET /api/categories`
- `GET /api/categories/:slug`

Routes admin :
- `POST /api/admin/categories`
- `PATCH /api/admin/categories/:id`
- `PATCH /api/admin/categories/:id/archive`

Règles :
- Slug unique.
- `parentId` permet les sous-catégories.
- Une catégorie archivée est désactivée, pas supprimée.
- Les sous-catégories d’une catégorie archivée sont désactivées aussi.
- Les catégories sensibles peuvent imposer une validation admin.

## Modèles ajoutés
- `UserBlock`
- `Report`
- `AdminLog`
- `SellerVerificationRequest`
- `Category`

## Sécurité respectée
- Routes privées avec `authenticate`.
- Routes admin avec `authenticate + requireAdminRole`.
- Validation Zod sur body/query/params.
- Validation ObjectId.
- Pas de suppression définitive.
- Actions sensibles traçables.
