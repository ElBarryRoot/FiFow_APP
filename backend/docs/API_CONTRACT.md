# Contrat API Fi Fow

## Convention

- Base locale: `http://localhost:5000/api/v1`
- Authentification: `Authorization: Bearer <accessToken>`
- Refresh token: cookie `HttpOnly`
- Écriture sensible depuis le navigateur: origine présente dans `CORS_ORIGINS`
- Pagination: `limit` et `cursor`; la réponse retourne `meta.nextCursor`
- Montants: chaînes d'entiers GNF dans les réponses JSON
- Erreurs: statut HTTP, message et code applicatif stable
- Uploads: `multipart/form-data`
- Idempotence paiement: en-tête `Idempotency-Key`
- Signature webhook: en-tête `X-FiFow-Signature: sha256=<hmac>`

## Santé

| Méthode | Route | Usage |
| --- | --- | --- |
| GET | `/health/live` | Processus vivant |
| GET | `/health/ready` | PostgreSQL et dépendances prêtes |

## Authentification

| Méthode | Route | Accès |
| --- | --- | --- |
| POST | `/auth/register` | Public |
| POST | `/auth/login` | Public |
| POST | `/auth/refresh` | Cookie refresh |
| POST | `/auth/logout` | Authentifié |
| POST | `/auth/logout-all` | Authentifié |
| GET | `/auth/me` | Authentifié |
| POST | `/auth/verify-email` | Public avec jeton |
| POST | `/auth/resend-verification` | Authentifié |
| POST | `/auth/forgot-password` | Public |
| POST | `/auth/reset-password` | Public avec jeton |

## Utilisateurs

| Méthode | Route | Usage |
| --- | --- | --- |
| PATCH | `/users/me` | Modifier le profil |
| PUT | `/users/me/avatar` | Remplacer l'avatar, champ `image` |
| DELETE | `/users/me/avatar` | Supprimer l'avatar |
| POST | `/users/me/archive` | Archiver le compte et révoquer les sessions |
| GET | `/users/:userId/public` | Profil public |
| POST | `/users/:userId/block` | Bloquer un utilisateur |
| DELETE | `/users/:userId/block` | Débloquer un utilisateur |

## Catalogue

| Méthode | Route | Usage |
| --- | --- | --- |
| GET | `/categories` | Arbre public des catégories |
| GET | `/categories/:slug` | Détail d'une catégorie |
| GET | `/products` | Recherche et filtres publics |
| GET | `/products/mine` | Annonces du vendeur connecté |
| GET | `/products/:slug` | Fiche publique |
| POST | `/products` | Créer un brouillon |
| PATCH | `/products/:productId` | Modifier un brouillon |
| POST | `/products/:productId/images` | Ajouter le champ `image` |
| DELETE | `/products/:productId/images/:imageId` | Supprimer une image |
| PATCH | `/products/:productId/images/:imageId/main` | Définir l'image principale |
| PATCH | `/products/:productId/images/reorder` | Réordonner les images |
| POST | `/products/:productId/publish` | Publier ou soumettre en modération |
| POST | `/products/:productId/archive` | Archiver |
| GET | `/products/:productId/stats` | Statistiques propriétaire |

## Interactions

| Méthode | Route | Usage |
| --- | --- | --- |
| GET | `/favorites` | Favoris de l'utilisateur |
| POST | `/products/:productId/favorite` | Ajouter aux favoris |
| DELETE | `/products/:productId/favorite` | Retirer des favoris |
| POST | `/products/:productId/like` | Aimer |
| DELETE | `/products/:productId/like` | Retirer le like |
| POST | `/products/:productId/view` | Enregistrer une vue dédupliquée |

## Conversations et offres

| Méthode | Route | Usage |
| --- | --- | --- |
| GET | `/conversations` | Liste des conversations |
| POST | `/conversations` | Créer ou retrouver la conversation d'une annonce |
| GET | `/conversations/:conversationId` | Conversation et messages |
| GET | `/conversations/:conversationId/messages?cursor=&limit=` | Historique pagine (1-100 messages) |
| POST | `/conversations/:conversationId/messages` | Envoyer un texte |
| POST | `/conversations/:conversationId/messages/images` | Envoyer le champ `image` |
| PATCH | `/conversations/:conversationId/read` | Marquer comme lue |
| POST | `/conversations/:conversationId/archive` | Archiver pour l'utilisateur |
| POST | `/conversations/:conversationId/offers` | Proposer un prix |
| PATCH | `/offers/:offerId` | Accepter, refuser ou contre-proposer |

Le champ `clientId` UUID rend l'envoi d'un message idempotent.

## Commandes

| Méthode | Route | Usage |
| --- | --- | --- |
| POST | `/orders/quotes` | Calcul serveur du total et des frais de protection |
| POST | `/orders` | Consommer le devis et créer la commande |
| GET | `/orders` | Commandes acheteur et vendeur |
| GET | `/orders/:orderId` | Détail participant |
| PATCH | `/orders/:orderId/seller-confirm` | Confirmation du vendeur |
| PATCH | `/orders/:orderId/cancel` | Annulation autorisée |
| PATCH | `/orders/:orderId/prepare` | Préparation vendeur |
| PATCH | `/orders/:orderId/ready` | Prête pour remise |
| PATCH | `/orders/:orderId/ship` | Expédition |
| PATCH | `/orders/:orderId/receive` | Réception acheteur |
| PATCH | `/orders/:orderId/dispute` | Ouvrir un litige |

## Paiements et reversements

| Méthode | Route | Usage |
| --- | --- | --- |
| POST | `/payments/initiate` | Initier le paiement d'une commande |
| GET | `/payments` | Paiements de l'utilisateur |
| GET | `/payments/:paymentId` | Détail et événements |
| POST | `/payments/webhook/:provider` | Confirmation fournisseur |
| POST | `/payments/webhook/:provider/refunds` | Résultat remboursement |
| POST | `/payments/webhook/:provider/payouts` | Résultat reversement |

Les webhooks publics n'acceptent un changement d'état que si le HMAC du corps
brut est valide. Les valeurs de `provider` sont `mock`, `orange-money`,
`mtn-momo` et `other`.

## Avis, signalements et vérification

| Méthode | Route | Usage |
| --- | --- | --- |
| POST | `/reviews` | Avis après commande terminée |
| GET | `/reviews/users/:userId` | Avis publics d'un utilisateur |
| PATCH | `/reviews/:reviewId/reply` | Réponse du sujet évalué |
| POST | `/reports` | Signalement générique |
| POST | `/seller-verification/request` | Documents dans `documents`, maximum 3 |
| GET | `/seller-verification/me` | État de la demande |

## Boosts

| Méthode | Route | Usage |
| --- | --- | --- |
| GET | `/boosts/plans` | Plans disponibles |
| POST | `/boosts/products/:productId` | Créer un boost à payer |
| GET | `/boosts/mine` | Boosts du vendeur |

## Notifications et réglages publics

| Méthode | Route | Usage |
| --- | --- | --- |
| GET | `/notifications` | Liste et état non lu |
| PATCH | `/notifications/read-all` | Tout marquer comme lu |
| PATCH | `/notifications/:notificationId/read` | Marquer une notification |
| GET | `/settings` | Réglages explicitement publics |

## Administration

Toutes les routes suivantes nécessitent au minimum `MODERATOR`. Les mutations
financières, catégories, réglages et plans de boost exigent `ADMIN` ou
`SUPER_ADMIN`.

| Méthode | Route | Usage |
| --- | --- | --- |
| GET | `/admin/dashboard` | Indicateurs opérationnels |
| GET | `/admin/users` | Utilisateurs |
| GET | `/admin/products` | Annonces |
| GET | `/admin/categories` | Catégories actives et archivées |
| POST | `/admin/categories` | Créer |
| PATCH | `/admin/categories/:id` | Modifier |
| PATCH | `/admin/categories/:id/archive` | Archiver |
| GET | `/admin/reports` | File des signalements |
| GET | `/admin/reports/:id` | Détail et cible hydratée |
| PATCH | `/admin/reports/:id/assign` | S'assigner |
| PATCH | `/admin/reports/:id/resolve` | Résoudre ou rejeter |
| POST | `/admin/moderation/actions` | Action de modération auditée |
| GET | `/admin/conversations/reported` | Conversations signalées |
| GET | `/admin/seller-verifications` | Demandes vendeur |
| PATCH | `/admin/seller-verifications/:id/approve` | Approuver |
| PATCH | `/admin/seller-verifications/:id/reject` | Refuser |
| GET | `/admin/payments` | Paiements |
| POST | `/admin/payments/:id/refunds` | Demander un remboursement |
| GET | `/admin/payouts` | Reversements |
| POST | `/admin/payouts/:id/process` | Transmettre un reversement disponible |
| GET | `/admin/reviews` | Avis |
| GET | `/admin/boosts` | Boosts |
| PATCH | `/admin/boosts/:id/cancel` | Annuler et rembourser si nécessaire |
| POST | `/admin/boost-plans` | Créer un plan |
| PATCH | `/admin/boost-plans/:id` | Modifier |
| PATCH | `/admin/boost-plans/:id/archive` | Archiver |
| GET | `/admin/settings` | Réglages complets |
| PATCH | `/admin/settings/:key` | Modifier avec contrôle de type |
| GET | `/admin/logs` | Journal d'audit |

## Temps réel

Socket.IO utilise le même access token que l'API. Les salles sont privées:

- `user:<userId>` pour les notifications;
- `conversation:<conversationId>` après vérification de la participation.

Événements principaux: `message:new`, `message:read`, `notification:new` et
indicateurs de saisie.
