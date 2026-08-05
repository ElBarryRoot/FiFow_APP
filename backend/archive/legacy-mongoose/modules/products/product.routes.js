import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { optionalAuth } from '../../middlewares/optionalAuth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { validateObjectId } from '../../middlewares/validateObjectId.middleware.js';
import { ownerProduct, ownerProductOrAdmin } from '../../middlewares/ownerProduct.middleware.js';
import { productListSchema, productCreateSchema, productUpdateSchema, reportProductSchema } from './product.validator.js';
import {
  archiveProduct,
  createProduct,
  favoriteProduct,
  getProductById,
  getProductStats,
  likeProduct,
  listProducts,
  markReserved,
  markSold,
  reportProduct,
  unfavoriteProduct,
  unlikeProduct,
  updateProduct,
  viewProduct
} from './product.controller.js';
import { addProductImage, archiveProductImage, reorderProductImages, setMainProductImage } from '../productImages/productImage.controller.js';
import { uploadImage } from '../../middlewares/upload.middleware.js';
import { reorderImagesSchema } from '../productImages/productImage.validator.js';

const router = Router();

router.get('/', optionalAuth, validate(productListSchema), listProducts);
router.get('/:id', optionalAuth, validateObjectId('id'), getProductById);
router.post('/', authenticate, validate(productCreateSchema), createProduct);
router.patch('/:id', authenticate, validateObjectId('id'), ownerProduct, validate(productUpdateSchema), updateProduct);
router.post('/:id/archive', authenticate, validateObjectId('id'), ownerProduct, archiveProduct);
router.post('/:id/mark-reserved', authenticate, validateObjectId('id'), ownerProduct, markReserved);
router.post('/:id/mark-sold', authenticate, validateObjectId('id'), ownerProduct, markSold);
router.post('/:id/report', authenticate, validateObjectId('id'), validate(reportProductSchema), reportProduct);
router.post('/:id/like', authenticate, validateObjectId('id'), likeProduct);
router.delete('/:id/like', authenticate, validateObjectId('id'), unlikeProduct);
router.post('/:id/favorite', authenticate, validateObjectId('id'), favoriteProduct);
router.delete('/:id/favorite', authenticate, validateObjectId('id'), unfavoriteProduct);
router.post('/:id/view', optionalAuth, validateObjectId('id'), viewProduct);
router.get('/:id/stats', authenticate, validateObjectId('id'), ownerProductOrAdmin, getProductStats);

router.post('/:id/images', authenticate, validateObjectId('id'), ownerProduct, uploadImage.single('image'), addProductImage);
router.patch('/:id/images/:imageId/main', authenticate, validateObjectId('id'), validateObjectId('imageId'), ownerProduct, setMainProductImage);
router.patch('/:id/images/reorder', authenticate, validateObjectId('id'), ownerProduct, validate(reorderImagesSchema), reorderProductImages);
router.post('/:id/images/:imageId/archive', authenticate, validateObjectId('id'), validateObjectId('imageId'), ownerProduct, archiveProductImage);

export default router;
