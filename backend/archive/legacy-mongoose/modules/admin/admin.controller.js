import { successResponse } from '../../utils/apiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { User } from '../users/user.model.js';
import { Product } from '../products/product.model.js';
import { Category } from '../categories/category.model.js';
import { Report } from '../reports/report.model.js';
import { Review } from '../reviews/review.model.js';
import { Payment } from '../payments/payment.model.js';
import { Boost } from '../boosts/boost.model.js';
import { Conversation } from '../conversations/conversation.model.js';
import { AdminLog } from '../auditLogs/adminLog.model.js';
import { AppSetting } from '../settings/appSetting.model.js';

const pageOptions = (query) => ({ page: Math.max(Number(query.page || 1), 1), limit: Math.min(Math.max(Number(query.limit || 20), 1), 100) });
const paged = async (Model, filter, query, sort = { createdAt: -1 }, populate = []) => {
  const { page, limit } = pageOptions(query);
  let dbQuery = Model.find(filter).sort(sort).skip((page - 1) * limit).limit(limit);
  populate.forEach((p) => { dbQuery = dbQuery.populate(p); });
  const [items, total] = await Promise.all([dbQuery, Model.countDocuments(filter)]);
  return { items, meta: { page, limit, total, pages: Math.ceil(total / limit) } };
};

export const dashboard = asyncHandler(async (_req, res) => {
  const [users, activeUsers, products, visibleProducts, reportsOpen, paymentsSuccess, boostsActive, conversationsReported] = await Promise.all([
    User.countDocuments({ status: { $ne: 'DELETED' } }),
    User.countDocuments({ status: 'ACTIVE' }),
    Product.countDocuments({}),
    Product.countDocuments({ status: 'AVAILABLE', moderationStatus: 'APPROVED' }),
    Report.countDocuments({ status: { $in: ['OPEN', 'UNDER_REVIEW'] } }),
    Payment.countDocuments({ status: 'SUCCESS' }),
    Boost.countDocuments({ status: 'ACTIVE' }),
    Conversation.countDocuments({ isReported: true })
  ]);
  return successResponse(res, { message: 'Dashboard admin récupéré.', data: { users, activeUsers, products, visibleProducts, reportsOpen, paymentsSuccess, boostsActive, conversationsReported } });
});

export const listUsers = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.role) filter.role = req.query.role;
  if (req.query.q) filter.$or = [{ fullName: new RegExp(req.query.q, 'i') }, { phone: new RegExp(req.query.q, 'i') }];
  const result = await paged(User, filter, req.query);
  return successResponse(res, { message: 'Utilisateurs récupérés.', data: result.items, meta: result.meta });
});

export const listProducts = asyncHandler(async (req, res) => {
  const filter = {};
  ['status', 'moderationStatus', 'commune', 'categoryId'].forEach((key) => { if (req.query[key]) filter[key] = req.query[key]; });
  if (req.query.q) filter.$text = { $search: req.query.q };
  const result = await paged(Product, filter, req.query, { createdAt: -1 }, ['sellerId', 'categoryId', 'subCategoryId']);
  return successResponse(res, { message: 'Produits récupérés.', data: result.items, meta: result.meta });
});

export const listCategories = asyncHandler(async (req, res) => {
  const result = await paged(Category, {}, req.query, { sortOrder: 1, createdAt: -1 }, ['parentId']);
  return successResponse(res, { message: 'Catégories récupérées.', data: result.items, meta: result.meta });
});

export const listReviews = asyncHandler(async (req, res) => {
  const filter = req.query.status ? { status: req.query.status } : {};
  const result = await paged(Review, filter, req.query, { createdAt: -1 }, ['reviewerId', 'reviewedUserId', 'productId']);
  return successResponse(res, { message: 'Avis récupérés.', data: result.items, meta: result.meta });
});

export const listBoosts = asyncHandler(async (req, res) => {
  const filter = req.query.status ? { status: req.query.status } : {};
  const result = await paged(Boost, filter, req.query, { createdAt: -1 }, ['productId', 'sellerId', 'boostPlanId', 'paymentId']);
  return successResponse(res, { message: 'Boosts récupérés.', data: result.items, meta: result.meta });
});

export const listPayments = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.type) filter.type = req.query.type;
  const result = await paged(Payment, filter, req.query, { createdAt: -1 }, ['userId']);
  return successResponse(res, { message: 'Paiements récupérés.', data: result.items, meta: result.meta });
});

export const listReportedConversations = asyncHandler(async (req, res) => {
  const result = await paged(Conversation, { isReported: true }, req.query, { updatedAt: -1 }, ['productId', 'buyerId', 'sellerId']);
  return successResponse(res, { message: 'Conversations signalées récupérées.', data: result.items, meta: result.meta });
});

export const listLogs = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.action) filter.action = req.query.action;
  if (req.query.targetType) filter.targetType = req.query.targetType;
  const result = await paged(AdminLog, filter, req.query, { createdAt: -1 }, ['adminId']);
  return successResponse(res, { message: 'Logs admin récupérés.', data: result.items, meta: result.meta });
});

export const listSettings = asyncHandler(async (_req, res) => {
  const settings = await AppSetting.find({ archivedAt: null }).sort({ key: 1 });
  return successResponse(res, { message: 'Paramètres récupérés.', data: settings });
});
