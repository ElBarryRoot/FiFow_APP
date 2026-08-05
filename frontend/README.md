# Fi Fow Frontend — Client Premium

Projet frontend React professionnel pour Fi Fow, structuré comme une vraie base maintenable, évolutive et orientée marketplace locale.

## Stack

- React + Vite
- Tailwind CSS
- React Router DOM
- Lucide React
- Framer Motion prêt à utiliser
- Architecture modulaire par composants
- Données mockées séparées
- Design mobile-first, responsive tablette et desktop

## Pages incluses

### Lot 1 — Marketplace

- `/` — Accueil invité
- `/connected` — Accueil connecté
- `/products` — Catalogue / recherche
- `/products/:id` — Détail produit
- `/login` — Connexion téléphone ou email + mot de passe
- `/register` — Inscription avec email facultatif

### Lot 2 — Publication d’annonce

- `/products/new` — Wizard publication d’annonce

Le wizard contient :

1. Informations générales
2. Photos
3. Prix, localisation et mode de remise
4. Aperçu
5. Succès après publication

Pour visualiser directement une étape de démo :

```txt
/products/new?step=1
/products/new?step=2
/products/new?step=3
/products/new?step=4
/products/new?success=1
```

### Lot 4 — Paiement, Boost, Performances et Avis

- `/checkout/:orderId` — Paiement d’une commande
- `/checkout/:orderId/processing` — Paiement en vérification
- `/checkout/:orderId/success` — Paiement confirmé avec reçu
- `/boost/plans` — Plans de boost
- `/products/:id/boost/checkout` — Achat et activation d’un boost
- `/profile/boosts` — Suivi des boosts et performances
- `/orders/:id/review` — Laisser un avis

### Lot Client — Profil, messages, commandes et support

- `/profile` — Profil utilisateur
- `/seller/:id` — Profil vendeur public
- `/profile/listings` — Mes annonces
- `/products/:id/edit` — Modifier annonce
- `/favorites` — Favoris
- `/messages` — Liste des messages
- `/messages/:id` — Conversation
- `/notifications` — Notifications
- `/orders` — Mes commandes
- `/orders/:id` — Détail commande
- `/settings` — Paramètres compte
- `/profile/edit` — Modifier profil
- `/forgot-password` — Mot de passe oublié
- `/account-recovery` — Récupération manuelle de compte
- `/support` — Support / aide
- `/report/:id` — Signalement annonce

## Architecture

```txt
src/
├── app/
│   └── App.jsx
├── components/
│   ├── auth/
│   ├── boost/
│   ├── layout/
│   ├── marketplace/
│   ├── payment/
│   ├── product-publish/
│   ├── review/
│   └── ui/
├── data/
│   ├── boostPlans.js
│   ├── boosts.js
│   ├── categories.js
│   ├── payments.js
│   ├── products.js
│   ├── publishOptions.js
│   ├── reviews.js
│   ├── clientPortal.js
│   └── user.js
├── lib/
│   ├── constants.js
│   ├── formatters.js
│   └── utils.js
├── pages/
│   ├── auth/
│   ├── boost/
│   ├── messages/
│   ├── orders/
│   ├── payment/
│   ├── public/
│   ├── review/
│   ├── support/
│   └── user/
├── styles/
│   └── globals.css
└── main.jsx
```

## Commandes

```bash
npm install
npm run dev
npm run build
npm run preview
```

## Authentification MVP validée

- Pas d’OTP au MVP.
- Connexion avec téléphone ou email + mot de passe.
- Inscription avec téléphone obligatoire et email facultatif.
- OTP prévu plus tard quand le budget SMS/WhatsApp sera disponible.

## Règles UX respectées

- Marketplace-first : pas de dashboard client lourd.
- Profil comme espace personnel.
- Dashboard réservé à l’admin dans les lots suivants.
- Publication d’annonce multi-étapes.
- Paiement et boost en parcours sécurisés.
- Avis vendeur simple, rapide et utile.
- Profil, annonces, favoris, messages, commandes et support côté client.
- Pages client humanisées : signaux de confiance, quartiers, délais de réponse, conseils de sécurité.
- Layouts desktop plus riches : colonnes utiles, panneaux sticky, sections éditoriales.
- Cards moins mécaniques : variations de métriques, badges contextuels, micro-copy plus naturelle.
- Bottom navigation mobile.
- Design responsive.
- Composants réutilisables.
- Aucun code monolithique.
- Aucune page vide.

## Vérification

```bash
npm install
npm run build
npm audit --audit-level=high
```

Vérification effectuée dans l’environnement de travail :

```txt
npm run build : OK
npm audit --audit-level=high : OK, 0 vulnérabilité
```

Note : aucune capture Playwright n’a été générée ici, car aucun navigateur headless n’est disponible dans l’environnement. Les routes sont prêtes pour une validation visuelle locale avec `npm run dev`.

## Compatibilité locale

Le `package.json` est figé sur des versions compatibles Node.js 18.16+ pour éviter les erreurs liées à `latest`.

Versions principales :

```txt
React 18.3.1
React Router DOM 6.30.4
Vite 6.4.3
@vitejs/plugin-react 4.7.0
Tailwind CSS 3.4.17
```

## Références maquettes

Les maquettes validées sont dans :

```txt
public/references/
public/references/lot2-publish/
```
