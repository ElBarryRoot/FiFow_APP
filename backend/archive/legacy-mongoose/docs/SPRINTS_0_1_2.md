# Rapport de livraison — Sprints 0, 1 et 2

## Sprint 0 — Initialisation

### Réalisé
- Projet Node.js + Express en ES Modules.
- Architecture modulaire.
- Connexion MongoDB/Mongoose.
- Fichier `.env.example` complet.
- Health check `/api/health`.
- Swagger préparé sur `/api/docs`.
- README initial.

### Validation
- Le serveur démarre avec `npm run dev`.
- La base MongoDB se connecte via `MONGO_URI`.
- `/api/health` retourne un statut `UP`.

## Sprint 1 — Sécurité backend de base

### Réalisé
- Helmet.
- CORS contrôlé.
- Rate limiting global.
- Rate limiting auth.
- Sanitization Mongo.
- Protection HPP.
- Compression.
- Request ID.
- Morgan + Winston.
- Gestion d’erreur centralisée.
- Réponse API standardisée.
- `notFoundHandler`.
- `ApiError`, `ApiResponse`, `asyncHandler`.

### Validation
- Route inconnue = erreur propre.
- Erreur technique non exposée en production.
- Toutes les réponses respectent `success`, `message`, `data` ou `errorCode`.

## Sprint 2 — Auth OTP + JWT

### Réalisé
- Modèle `User`.
- Modèle `OtpCode`.
- Normalisation téléphone Guinée.
- Génération OTP.
- Hash OTP avec bcrypt.
- Expiration OTP.
- Limitation tentatives OTP.
- Création utilisateur après OTP valide.
- Access token JWT.
- Refresh token JWT hashé en base.
- Logout.
- Logout all.
- Route profil connecté.
- Middleware `authenticate`.

### Routes
```txt
POST /api/auth/send-otp
POST /api/auth/verify-otp
POST /api/auth/refresh-token
POST /api/auth/logout
POST /api/auth/logout-all
GET  /api/auth/me
GET  /api/users/me
PATCH /api/users/me
POST /api/users/me/archive
GET  /api/users/:id/public
```

### Règles importantes
- En développement, `send-otp` retourne `devOtp` pour tester.
- En production, `devOtp` n’est pas retourné.
- Aucun OTP n’est stocké en clair.
- Le téléphone est l’identifiant principal.
- Un compte banni ou archivé ne peut pas se connecter.
- L’archivage ne supprime pas les données en base.

## Commandes

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

## Test manuel rapide

```bash
curl http://localhost:5000/api/health

curl -X POST http://localhost:5000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone":"622000000"}'

curl -X POST http://localhost:5000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phone":"622000000", "otp":"CODE_RECU", "fullName":"Test User", "commune":"Ratoma", "quartier":"Hamdallaye"}'
```

## Sprint suivant recommandé

Sprint 3 — Users, profils complets, statuts, blocage utilisateur, signalement utilisateur et préparation vérification vendeur.
