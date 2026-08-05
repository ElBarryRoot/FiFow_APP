import { successResponse } from '../../utils/apiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiError } from '../../utils/apiError.js';
import { slugify } from '../../utils/slug.js';
import { Product } from './product.model.js';
import { Category } from '../categories/category.model.js';
import { Report } from '../reports/report.model.js';
import { ProductLike } from '../interactions/productLike.model.js';
import { Favorite } from '../interactions/favorite.model.js';
import { ProductView } from '../interactions/productView.model.js';
import { createNotification } from '../notifications/notification.service.js';

const FORBIDDEN_WORDS = [
  'arme', 'pistolet', 'fusil', 'drogue', 'cocaine', 'cocaïne', 'chanvre', 'faux document', 'passeport',
  'carte identité', 'medicament interdit', 'médicament interdit'
];

function buildProductSlug(title) {
  return `${slugify(title)}-${Date.now().toString(36)}`;
}

async function assertValidCategories(categoryId, subCategoryId) {
  const [category, subCategory] = await Promise.all([
    Category.findById(categoryId),
    Category.findById(subCategoryId)
  ]);

  if (!category || category.archivedAt || !category.isActive) {
    throw new ApiError(400, 'Catégorie principale invalide ou inactive.', 'INVALID_CATEGORY');
  }
  if (!subCategory || subCategory.archivedAt || !subCategory.isActive) {
    throw new ApiError(400, 'Sous-catégorie invalide ou inactive.', 'INVALID_SUB_CATEGORY');
  }
  if (!subCategory.parentId || subCategory.parentId.toString() !== category._id.toString()) {
    throw new ApiError(400, 'La sous-catégorie ne correspond pas à la catégorie principale.', 'SUB_CATEGORY_MISMATCH');
  }

  return { category, subCategory };
}

function hasForbiddenContent(payload) {
  const content = `${payload.title || ''} ${payload.description || ''}`.toLowerCase();
  return FORBIDDEN_WORDS.some((word) => content.includes(word));
}

export const listProducts = asyncHandler(async (req, res) => {
  const query = req.validated?.query || {};
  const page = query.page;
  const limit = query.limit;
  const skip = (page - 1) * limit;

  const filter = { status: 'AVAILABLE', moderationStatus: 'APPROVED', archivedAt: null, deletedAt: null };
  if (query.categoryId) filter.categoryId = query.categoryId;
  if (query.subCategoryId) filter.subCategoryId = query.subCategoryId;
  if (query.commune) filter.commune = new RegExp(query.commune, 'i');
  if (query.quartier) filter.quartier = new RegExp(query.quartier, 'i');
  if (query.condition) filter.condition = query.condition;
  if (query.minPrice || query.maxPrice) {
    filter.price = {};
    if (query.minPrice) filter.price.$gte = query.minPrice;
    if (query.maxPrice) filter.price.$lte = query.maxPrice;
  }
  if (query.search) filter.$text = { $search: query.search };

  const sortMap = {
    recent: { isBoosted: -1, createdAt: -1 },
    price_asc: { price: 1, createdAt: -1 },
    price_desc: { price: -1, createdAt: -1 },
    popular: { isBoosted: -1, viewsCount: -1, likesCount: -1, createdAt: -1 }
  };

  const [products, total] = await Promise.all([
    Product.find(filter)
      .populate('sellerId', 'fullName commune quartier avatarUrl isVerifiedSeller averageRating totalReviews')
      .populate('images')
      .sort(sortMap[query.sort])
      .skip(skip)
      .limit(limit),
    Product.countDocuments(filter)
  ]);

  return successResponse(res, {
    message: 'Feed produits.',
    data: products,
    meta: { page, limit, total, pages: Math.ceil(total / limit) }
  });
});

export const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ _id: req.params.id, archivedAt: null, deletedAt: null })
    .populate('sellerId', 'fullName commune quartier avatarUrl isVerifiedSeller averageRating totalReviews')
    .populate('categoryId', 'name slug')
    .populate('subCategoryId', 'name slug')
    .populate('images');

  if (!product) throw new ApiError(404, 'Produit introuvable.', 'PRODUCT_NOT_FOUND');

  const isOwner = req.user && product.sellerId?._id?.toString() === req.user._id.toString();
  const isAdmin = req.user && ['ADMIN', 'SUPER_ADMIN', 'MODERATOR'].includes(req.user.role);
  if (!isOwner && !isAdmin && (product.status !== 'AVAILABLE' || product.moderationStatus !== 'APPROVED')) {
    throw new ApiError(404, 'Produit introuvable.', 'PRODUCT_NOT_FOUND');
  }

  return successResponse(res, { message: 'Détail produit.', data: product });
});

export const createProduct = asyncHandler(async (req, res) => {
  if (['SUSPENDED', 'BANNED', 'DELETED'].includes(req.user.status)) {
    throw new ApiError(403, 'Votre compte ne peut pas publier de produit.', 'USER_CANNOT_PUBLISH');
  }

  const payload = req.validated.body;
  const { category, subCategory } = await assertValidCategories(payload.categoryId, payload.subCategoryId);
  const needsManualReview = category.requiresAdminValidation || subCategory.requiresAdminValidation || hasForbiddenContent(payload);

  const product = await Product.create({
    ...payload,
    sellerId: req.user._id,
    slug: buildProductSlug(payload.title),
    moderationStatus: needsManualReview ? 'PENDING' : 'APPROVED'
  });

  await req.user.updateOne({ $inc: { totalProducts: 1 } });

  return successResponse(res, {
    statusCode: 201,
    message: needsManualReview ? 'Produit créé et en attente de validation.' : 'Produit créé avec succès.',
    data: product
  });
});

export const updateProduct = asyncHandler(async (req, res) => {
  const product = req.product;
  if (['ARCHIVED', 'DELETED', 'SOLD'].includes(product.status)) {
    throw new ApiError(400, 'Ce produit ne peut plus être modifié.', 'PRODUCT_NOT_EDITABLE');
  }

  const payload = req.validated.body;
  if (payload.categoryId || payload.subCategoryId) {
    await assertValidCategories(payload.categoryId || product.categoryId, payload.subCategoryId || product.subCategoryId);
  }

  Object.assign(product, payload);
  if (payload.title) product.slug = buildProductSlug(payload.title);
  if (hasForbiddenContent(product)) product.moderationStatus = 'PENDING';

  await product.save();
  return successResponse(res, { message: 'Produit mis à jour.', data: product });
});

export const archiveProduct = asyncHandler(async (req, res) => {
  const product = req.product;
  product.status = 'ARCHIVED';
  product.archivedAt = new Date();
  product.isBoosted = false;
  product.activeBoostId = null;
  await product.save();

  return successResponse(res, { message: 'Produit archivé. Il n’est plus visible publiquement.', data: product });
});

export const markReserved = asyncHandler(async (req, res) => {
  const product = req.product;
  if (product.status !== 'AVAILABLE') throw new ApiError(400, 'Seul un produit disponible peut être réservé.', 'PRODUCT_NOT_AVAILABLE');
  product.status = 'RESERVED';
  product.reservedAt = new Date();
  await product.save();
  return successResponse(res, { message: 'Produit marqué comme réservé.', data: product });
});

export const markSold = asyncHandler(async (req, res) => {
  const product = req.product;
  if (!['AVAILABLE', 'RESERVED'].includes(product.status)) {
    throw new ApiError(400, 'Ce produit ne peut pas être marqué comme vendu.', 'PRODUCT_NOT_SELLABLE');
  }
  product.status = 'SOLD';
  product.soldAt = new Date();
  product.isBoosted = false;
  product.activeBoostId = null;
  await product.save();
  await req.user.updateOne({ $inc: { totalSales: 1 } });
  return successResponse(res, { message: 'Produit marqué comme vendu.', data: product });
});

export const reportProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new ApiError(404, 'Produit introuvable.', 'PRODUCT_NOT_FOUND');
  if (product.sellerId.toString() === req.user._id.toString()) {
    throw new ApiError(400, 'Vous ne pouvez pas signaler votre propre produit.', 'CANNOT_REPORT_OWN_PRODUCT');
  }

  const report = await Report.create({
    reporterId: req.user._id,
    targetType: 'PRODUCT',
    targetId: product._id,
    reason: req.validated.body.reason,
    description: req.validated.body.description,
    priority: req.validated.body.reason === 'SCAM' || req.validated.body.reason === 'FORBIDDEN_PRODUCT' ? 'HIGH' : 'MEDIUM'
  });

  product.reportsCount += 1;
  if (product.reportsCount >= 5) product.moderationStatus = 'HIDDEN';
  await product.save();

  return successResponse(res, { statusCode: 201, message: 'Produit signalé.', data: report });
});

export const likeProduct = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ _id: req.params.id, status: 'AVAILABLE', moderationStatus: 'APPROVED' });
  if (!product) throw new ApiError(404, 'Produit introuvable ou indisponible.', 'PRODUCT_NOT_AVAILABLE');

  try {
    await ProductLike.create({ userId: req.user._id, productId: product._id });
    await Product.updateOne({ _id: product._id }, { $inc: { likesCount: 1 } });
    if (product.sellerId.toString() !== req.user._id.toString()) {
      await createNotification({
        userId: product.sellerId,
        type: 'PRODUCT_LIKED',
        title: 'Votre produit a reçu un like',
        body: product.title,
        data: { productId: product._id, userId: req.user._id }
      });
    }
    return successResponse(res, { statusCode: 201, message: 'Produit liké.', data: { liked: true } });
  } catch (error) {
    if (error.code === 11000) return successResponse(res, { message: 'Produit déjà liké.', data: { liked: true } });
    throw error;
  }
});

export const unlikeProduct = asyncHandler(async (req, res) => {
  const deleted = await ProductLike.findOneAndDelete({ userId: req.user._id, productId: req.params.id });
  if (deleted) await Product.updateOne({ _id: req.params.id, likesCount: { $gt: 0 } }, { $inc: { likesCount: -1 } });
  return successResponse(res, { message: 'Like retiré.', data: { liked: false } });
});

export const favoriteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ _id: req.params.id, status: 'AVAILABLE', moderationStatus: 'APPROVED' });
  if (!product) throw new ApiError(404, 'Produit introuvable ou indisponible.', 'PRODUCT_NOT_AVAILABLE');

  try {
    await Favorite.create({ userId: req.user._id, productId: product._id });
    await Product.updateOne({ _id: product._id }, { $inc: { favoritesCount: 1 } });
    if (product.sellerId.toString() !== req.user._id.toString()) {
      await createNotification({
        userId: product.sellerId,
        type: 'PRODUCT_FAVORITED',
        title: 'Votre produit a été ajouté aux favoris',
        body: product.title,
        data: { productId: product._id, userId: req.user._id }
      });
    }
    return successResponse(res, { statusCode: 201, message: 'Produit ajouté aux favoris.', data: { favorited: true } });
  } catch (error) {
    if (error.code === 11000) return successResponse(res, { message: 'Produit déjà dans les favoris.', data: { favorited: true } });
    throw error;
  }
});

export const unfavoriteProduct = asyncHandler(async (req, res) => {
  const deleted = await Favorite.findOneAndDelete({ userId: req.user._id, productId: req.params.id });
  if (deleted) await Product.updateOne({ _id: req.params.id, favoritesCount: { $gt: 0 } }, { $inc: { favoritesCount: -1 } });
  return successResponse(res, { message: 'Produit retiré des favoris.', data: { favorited: false } });
});

export const viewProduct = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ _id: req.params.id, status: 'AVAILABLE', moderationStatus: 'APPROVED' });
  if (!product) throw new ApiError(404, 'Produit introuvable ou indisponible.', 'PRODUCT_NOT_AVAILABLE');

  const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
  const filter = {
    productId: product._id,
    viewedAt: { $gte: fifteenMinutesAgo },
    ...(req.user ? { userId: req.user._id } : { ipAddress: req.ip })
  };

  const exists = await ProductView.exists(filter);
  if (!exists) {
    await ProductView.create({ productId: product._id, userId: req.user?._id || null, ipAddress: req.ip, userAgent: req.get('user-agent') });
    await Product.updateOne({ _id: product._id }, { $inc: { viewsCount: 1 } });
  }

  return successResponse(res, { statusCode: 201, message: 'Vue enregistrée.', data: { counted: !exists } });
});

export const getProductStats = asyncHandler(async (req, res) => {
  const product = req.product;
  return successResponse(res, {
    message: 'Statistiques produit.',
    data: {
      viewsCount: product.viewsCount,
      likesCount: product.likesCount,
      favoritesCount: product.favoritesCount,
      conversationsCount: product.conversationsCount,
      reportsCount: product.reportsCount,
      isBoosted: product.isBoosted,
      boostedUntil: product.boostedUntil
    }
  });
});
