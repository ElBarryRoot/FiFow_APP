# FI FOW - Documentation API synthétique

Toutes les routes commencent par `/api`. Les réponses respectent le format `{ success, message, data, meta }`.

## Groupes principaux

- Auth : `/api/auth/*`
- Users : `/api/users/*`
- Produits : `/api/products/*`
- Conversations : `/api/conversations/*`
- Orders : `/api/orders/*`
- Reviews : `/api/reviews/*`
- Reports : `/api/reports/*`
- Payments : `/api/payments/*`
- Boosts : `/api/boost-plans`, `/api/products/:id/boosts`, `/api/me/boosts`
- Notifications : `/api/notifications/*`
- Admin : `/api/admin/*`

## Règles critiques

- Le frontend ne valide jamais un paiement.
- Un produit n’est jamais supprimé physiquement : il est archivé/masqué.
- Les routes admin exigent `authenticate + requireAdminRole`.
- Les conversations sont lisibles seulement par leurs participants ou l’admin en cas de signalement.
