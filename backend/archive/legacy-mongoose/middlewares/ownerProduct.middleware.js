import { ApiError } from '../utils/apiError.js';
import { Product } from '../modules/products/product.model.js';

export async function ownerProduct(req, _res, next) {
  try {
    const productId = req.params.id || req.params.productId;
    const product = await Product.findById(productId);

    if (!product) return next(new ApiError(404, 'Produit introuvable.', 'PRODUCT_NOT_FOUND'));
    if (product.sellerId.toString() !== req.user._id.toString() && !['ADMIN', 'SUPER_ADMIN', 'MODERATOR'].includes(req.user.role)) {
      return next(new ApiError(403, 'Vous ne pouvez gérer que vos propres produits.', 'PRODUCT_OWNER_REQUIRED'));
    }

    req.product = product;
    return next();
  } catch (error) {
    return next(error);
  }
}

export async function ownerProductOrAdmin(req, _res, next) {
  try {
    const productId = req.params.id || req.params.productId;
    const product = await Product.findById(productId);

    if (!product) return next(new ApiError(404, 'Produit introuvable.', 'PRODUCT_NOT_FOUND'));
    const isOwner = product.sellerId.toString() === req.user._id.toString();
    const isAdmin = ['ADMIN', 'SUPER_ADMIN', 'MODERATOR'].includes(req.user.role);
    if (!isOwner && !isAdmin) return next(new ApiError(403, 'Accès refusé.', 'PRODUCT_ACCESS_FORBIDDEN'));

    req.product = product;
    return next();
  } catch (error) {
    return next(error);
  }
}
