import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireAdminRole } from '../../middlewares/requireRole.middleware.js';
import { dashboard, listBoosts, listCategories, listLogs, listPayments, listProducts, listReportedConversations, listReviews, listSettings, listUsers } from './admin.controller.js';

const router = Router();
router.use(authenticate, requireAdminRole);
router.get('/dashboard', dashboard);
router.get('/users', listUsers);
router.get('/products', listProducts);
router.get('/categories', listCategories);
router.get('/reviews', listReviews);
router.get('/boosts', listBoosts);
router.get('/payments', listPayments);
router.get('/conversations/reported', listReportedConversations);
router.get('/logs', listLogs);
router.get('/settings', listSettings);
export default router;
