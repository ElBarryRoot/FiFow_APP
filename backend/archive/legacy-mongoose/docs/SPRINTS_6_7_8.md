# FI FOW — Sprints 6, 7 et 8

## Sprint 6 — Produits et annonces

### Modules ajoutés
- `products/product.model.js`
- `products/product.controller.js`
- `products/product.routes.js`
- `products/product.validator.js`

### Fonctionnalités
- Feed public des produits approuvés et disponibles.
- Détail produit avec visibilité contrôlée.
- Création produit par utilisateur connecté.
- Modification uniquement par propriétaire ou admin.
- Archivage sans suppression physique.
- Marquage réservé/vendu.
- Signalement produit.
- Filtre par catégorie, sous-catégorie, commune, quartier, état, prix et recherche texte.

### Règles métier
- Aucun produit n’est supprimé définitivement.
- Un produit archivé devient invisible publiquement, mais reste conservé en base.
- Un produit `HIDDEN`, `REJECTED`, `ARCHIVED`, `SOLD` ou `DELETED` ne doit pas être boosté dans les sprints futurs.
- Un compte suspendu, banni ou supprimé ne peut pas publier.
- Les catégories et sous-catégories doivent être actives.

## Sprint 7 — Images produits / Cloudinary

### Modules ajoutés
- `productImages/productImage.model.js`
- `productImages/productImage.controller.js`
- `productImages/productImage.validator.js`
- `middlewares/upload.middleware.js`
- `config/cloudinary.js`

### Fonctionnalités
- Upload image produit via Cloudinary.
- Formats autorisés : JPG, PNG, WebP.
- Taille maximale : 5 Mo.
- Maximum recommandé : 6 images par produit.
- Image principale.
- Réordonnancement des images.
- Archivage image sans suppression définitive.

### Variables d’environnement ajoutées
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

## Sprint 8 — Likes, favoris et vues

### Modules ajoutés
- `interactions/favorite.model.js`
- `interactions/productLike.model.js`
- `interactions/productView.model.js`
- `interactions/interaction.routes.js`

### Fonctionnalités
- Liker / retirer like.
- Ajouter / retirer favori.
- Liste des favoris de l’utilisateur connecté.
- Enregistrer les vues produit avec anti-spam simple.
- Statistiques produit réservées au propriétaire ou à l’admin.

### Contraintes
- Index unique `userId + productId` sur likes.
- Index unique `userId + productId` sur favoris.
- Une vue répétée dans une fenêtre de 15 minutes n’est pas recomptée.

## Routes ajoutées

```txt
GET    /api/products
GET    /api/products/:id
POST   /api/products
PATCH  /api/products/:id
POST   /api/products/:id/archive
POST   /api/products/:id/mark-reserved
POST   /api/products/:id/mark-sold
POST   /api/products/:id/report
POST   /api/products/:id/images
PATCH  /api/products/:id/images/:imageId/main
PATCH  /api/products/:id/images/reorder
POST   /api/products/:id/images/:imageId/archive
POST   /api/products/:id/like
DELETE /api/products/:id/like
POST   /api/products/:id/favorite
DELETE /api/products/:id/favorite
POST   /api/products/:id/view
GET    /api/products/:id/stats
GET    /api/me/favorites
```

## Tests manuels recommandés

1. Créer une catégorie et une sous-catégorie côté admin.
2. Créer un produit avec un utilisateur connecté.
3. Vérifier qu’un autre utilisateur ne peut pas modifier le produit.
4. Ajouter une image avec `multipart/form-data`, champ `image`.
5. Définir une image principale.
6. Liker et retirer le like.
7. Ajouter et retirer un favori.
8. Enregistrer une vue produit.
9. Archiver un produit et vérifier qu’il ne sort plus dans le feed public.
