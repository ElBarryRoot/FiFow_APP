# Fi Fow Backend

API marketplace Fi Fow construite avec Node.js, Express 5, TypeScript,
PostgreSQL, Prisma et Redis.

## Architecture active

Le backend possède un seul dossier source officiel:

```text
src/
  config/
  http/
    middlewares/
    routes/
  modules/
    admin/
    auth/
    boosts/
    categories/
    conversations/
    interactions/
    notifications/
    offers/
    orders/
    payments/
    products/
    reports/
    reviews/
    seller-verification/
    settings/
    users/
  shared/
    email/
    errors/
    http/
    security/
    storage/
  types/
  app.ts
  server.ts
```

L’ancien code Mongoose est conservé hors du code actif dans
`archive/legacy-mongoose`. Il n’est ni chargé ni compilé par l’application.
La migration fonctionnelle est couverte dans
[docs/MIGRATION_COVERAGE.md](docs/MIGRATION_COVERAGE.md) et le contrat de
raccordement dans [docs/API_CONTRACT.md](docs/API_CONTRACT.md).

## Démarrage local

Prérequis: Node.js 22+, Docker et Docker Compose.

```bash
cp .env.example .env
docker compose up -d postgres redis
npm install
npm run prisma:migrate:dev
npm run seed
npm run dev
```

L’API écoute par défaut sur `http://localhost:5000`.

## Commandes

```bash
npm run dev
npm run typecheck
npm run lint
npm test
npm run build
npm start
```

Commandes Prisma:

```bash
npm run prisma:validate
npm run prisma:generate
npm run prisma:migrate:dev
npm run prisma:migrate:deploy
npm run prisma:studio
npm run seed
```

## API active

Toutes les routes applicatives utilisent le préfixe `/api/v1`. Le contrat
complet est documenté dans [docs/API_CONTRACT.md](docs/API_CONTRACT.md).

## Sécurité

- Les refresh tokens sont stockés dans un cookie `HttpOnly`.
- Chaque renouvellement effectue une rotation du refresh token.
- La réutilisation d’un ancien token révoque sa famille de sessions.
- Les mots de passe sont hachés avec bcrypt.
- Les entrées sont validées avec Zod.
- Les images sont inspectées et converties en WebP avec Sharp.
- Les secrets de développement contenant `CHANGE_ME` sont refusés en production.
- Le paiement réel est désactivé tant qu’un fournisseur vérifié n’est pas configuré.

L’administrateur initial est créé uniquement par le seed avec
`BOOTSTRAP_ADMIN_EMAIL` et `BOOTSTRAP_ADMIN_PASSWORD`. Aucun identifiant
administrateur n’est codé en dur.
