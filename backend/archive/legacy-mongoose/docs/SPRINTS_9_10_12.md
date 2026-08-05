# FI FOW — Sprints 9, 10 et 12

Ce document décrit les ajouts intégrés au backend après les sprints 0 à 8.

## Sprint 9 — Chat Socket.IO

### Objectif
Mettre en place une messagerie acheteur/vendeur sécurisée, liée aux produits, avec contrôle strict des participants.

### Modèles ajoutés
- `Conversation`
- `Message`

### Routes ajoutées
- `GET /api/conversations`
- `POST /api/conversations`
- `GET /api/conversations/:id`
- `POST /api/conversations/:id/messages`
- `PATCH /api/conversations/:id/read`
- `POST /api/conversations/:id/archive`
- `POST /api/conversations/:id/report`
- `POST /api/messages/:id/report`

### Socket.IO
- Authentification par JWT à la connexion socket.
- Room utilisateur : `user:{userId}`.
- Room conversation : `conversation:{conversationId}`.
- Événements : `conversation:join`, `conversation:typing`, `message:new`, `message:read`.

### Sécurité
- Un utilisateur ne peut lire que ses propres conversations.
- Un admin ne peut accéder qu’aux conversations signalées.
- Les messages ne sont jamais supprimés physiquement.
- Les signalements de messages/conversations basculent la conversation en `DISPUTED`.

## Sprint 10 — Orders, réservation et vente

### Objectif
Structurer les transactions simples : intention d’achat, réservation, confirmation vendeur/acheteur, annulation et litige.

### Modèle ajouté
- `Order`

### Routes ajoutées
- `POST /api/orders`
- `GET /api/orders/me`
- `GET /api/orders/:id`
- `PATCH /api/orders/:id/reserve`
- `PATCH /api/orders/:id/complete`
- `PATCH /api/orders/:id/cancel`
- `PATCH /api/orders/:id/dispute`

### Sécurité et règles métier
- L’acheteur ne peut pas commander son propre produit.
- Le vendeur seul peut réserver un produit pour une commande.
- La finalisation exige une confirmation acheteur et vendeur.
- Un produit vendu ne redevient pas visible.
- Une commande annulée conserve l’historique.

## Sprint 12 — Signalements et modération

### Objectif
Protéger la marketplace avec signalements, traitement admin, actions de modération et logs.

### Modèles ajoutés
- `ModerationAction`
- Extension de `Report`
- Extension de `AdminLog`

### Routes ajoutées
- `POST /api/reports`
- `GET /api/admin/reports`
- `GET /api/admin/reports/:id`
- `PATCH /api/admin/reports/:id/assign`
- `PATCH /api/admin/reports/:id/resolve`
- `POST /api/admin/moderation/actions`

### Actions de modération disponibles
- `WARNING`
- `HIDE_PRODUCT`
- `ARCHIVE_PRODUCT`
- `SUSPEND_USER`
- `BAN_USER`
- `REMOVE_VERIFIED_BADGE`
- `RESTORE_PRODUCT`
- `REJECT_REPORT`
- `BLOCK_CONVERSATION`

### Sécurité
- Les routes admin exigent `authenticate + requireAdminRole`.
- Chaque action sensible crée un `AdminLog`.
- Aucun signalement n’est supprimé physiquement.
- Les produits masqués ou archivés ne sont plus visibles publiquement.
