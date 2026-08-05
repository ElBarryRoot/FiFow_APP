import { successResponse } from '../../utils/apiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiError } from '../../utils/apiError.js';
import { Category } from './category.model.js';
import { createAdminLog } from '../auditLogs/adminLog.service.js';

export const listCategories = asyncHandler(async (req, res) => {
  const query = req.validated?.query || {};
  const filter = {};

  if (query.includeInactive !== 'true') filter.isActive = true;
  if (query.rootOnly === 'true') filter.parentId = null;
  if (query.parentId !== undefined) filter.parentId = query.parentId || null;

  const categories = await Category.find(filter).sort({ sortOrder: 1, name: 1 });
  return successResponse(res, { message: 'Liste des catégories.', data: categories });
});

export const getCategoryBySlug = asyncHandler(async (req, res) => {
  const category = await Category.findOne({ slug: req.params.slug, isActive: true });
  if (!category) throw new ApiError(404, 'Catégorie introuvable.', 'CATEGORY_NOT_FOUND');

  const children = await Category.find({ parentId: category._id, isActive: true }).sort({ sortOrder: 1, name: 1 });
  return successResponse(res, { message: 'Détail catégorie.', data: { category, children } });
});

export const createCategory = asyncHandler(async (req, res) => {
  const payload = req.validated.body;

  if (payload.parentId) {
    const parent = await Category.findById(payload.parentId);
    if (!parent || parent.archivedAt) throw new ApiError(400, 'Catégorie parente invalide.', 'INVALID_PARENT_CATEGORY');
  }

  const existing = await Category.findOne({ slug: payload.slug });
  if (existing) throw new ApiError(409, 'Ce slug de catégorie existe déjà.', 'CATEGORY_SLUG_EXISTS');

  const category = await Category.create(payload);
  await createAdminLog({
    req,
    adminId: req.user._id,
    action: 'CATEGORY_CREATED',
    targetType: 'CATEGORY',
    targetId: category._id,
    after: category.toObject()
  });

  return successResponse(res, { statusCode: 201, message: 'Catégorie créée.', data: category });
});

export const updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) throw new ApiError(404, 'Catégorie introuvable.', 'CATEGORY_NOT_FOUND');

  const payload = req.validated.body;
  if (payload.parentId && payload.parentId === category._id.toString()) {
    throw new ApiError(400, 'Une catégorie ne peut pas être sa propre parente.', 'INVALID_PARENT_CATEGORY');
  }

  if (payload.parentId) {
    const parent = await Category.findById(payload.parentId);
    if (!parent || parent.archivedAt) throw new ApiError(400, 'Catégorie parente invalide.', 'INVALID_PARENT_CATEGORY');
  }

  const before = category.toObject();
  Object.assign(category, payload);
  await category.save();

  await createAdminLog({
    req,
    adminId: req.user._id,
    action: 'CATEGORY_UPDATED',
    targetType: 'CATEGORY',
    targetId: category._id,
    before,
    after: category.toObject()
  });

  return successResponse(res, { message: 'Catégorie mise à jour.', data: category });
});

export const archiveCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) throw new ApiError(404, 'Catégorie introuvable.', 'CATEGORY_NOT_FOUND');

  const before = category.toObject();
  category.isActive = false;
  category.archivedAt = new Date();
  await category.save();

  await Category.updateMany({ parentId: category._id }, { isActive: false, archivedAt: new Date() });

  await createAdminLog({
    req,
    adminId: req.user._id,
    action: 'CATEGORY_ARCHIVED',
    targetType: 'CATEGORY',
    targetId: category._id,
    before,
    after: { isActive: false, archivedAt: category.archivedAt }
  });

  return successResponse(res, { message: 'Catégorie archivée/désactivée.', data: category });
});
