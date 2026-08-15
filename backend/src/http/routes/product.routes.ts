import { Router } from 'express';
import { authenticate, requireVerifiedEmail } from '../../modules/auth/auth.middleware.js';
import { productController } from '../../modules/products/product.controller.js';
import {
  createProductSchema,
  listProductsSchema,
  productIdSchema,
  productImageIdSchema,
  reorderProductImagesSchema,
  similarProductsSchema,
  productSlugSchema,
  updateProductStockSchema,
  updateProductSchema
} from '../../modules/products/product.schemas.js';
import { asyncHandler } from '../../shared/http/async-handler.js';
import { singleImage } from '../middlewares/image-upload.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';

export const productRoutes = Router();

productRoutes.get('/', validate(listProductsSchema), asyncHandler(productController.list));
productRoutes.get('/mine', authenticate, asyncHandler(productController.mine));
productRoutes.get(
  '/:productId/similar',
  validate(similarProductsSchema),
  asyncHandler(productController.similar)
);
productRoutes.get('/:slug', validate(productSlugSchema), asyncHandler(productController.detail));
productRoutes.post(
  '/',
  authenticate,
  requireVerifiedEmail,
  validate(createProductSchema),
  asyncHandler(productController.create)
);
productRoutes.patch(
  '/:productId',
  authenticate,
  requireVerifiedEmail,
  validate(updateProductSchema),
  asyncHandler(productController.update)
);
productRoutes.patch(
  '/:productId/stock',
  authenticate,
  requireVerifiedEmail,
  validate(updateProductStockSchema),
  asyncHandler(productController.updateStock)
);
productRoutes.post(
  '/:productId/images',
  authenticate,
  requireVerifiedEmail,
  singleImage,
  validate(productIdSchema),
  asyncHandler(productController.addImage)
);
productRoutes.delete(
  '/:productId/images/:imageId',
  authenticate,
  requireVerifiedEmail,
  validate(productImageIdSchema),
  asyncHandler(productController.deleteImage)
);
productRoutes.patch(
  '/:productId/images/:imageId/main',
  authenticate,
  requireVerifiedEmail,
  validate(productImageIdSchema),
  asyncHandler(productController.setMainImage)
);
productRoutes.patch(
  '/:productId/images/reorder',
  authenticate,
  requireVerifiedEmail,
  validate(reorderProductImagesSchema),
  asyncHandler(productController.reorderImages)
);
productRoutes.post(
  '/:productId/archive',
  authenticate,
  validate(productIdSchema),
  asyncHandler(productController.archive)
);
productRoutes.get(
  '/:productId/stats',
  authenticate,
  validate(productIdSchema),
  asyncHandler(productController.stats)
);
productRoutes.post(
  '/:productId/publish',
  authenticate,
  requireVerifiedEmail,
  validate(productIdSchema),
  asyncHandler(productController.publish)
);
