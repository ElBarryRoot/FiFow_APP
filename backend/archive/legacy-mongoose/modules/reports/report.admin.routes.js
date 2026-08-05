import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireAdminRole } from '../../middlewares/requireRole.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { validateObjectId } from '../../middlewares/validateObjectId.middleware.js';
import { assignReportSchema, moderationActionSchema, reportListSchema, resolveReportSchema } from './report.validator.js';
import { assignReport, createModerationAction, getReport, listReports, resolveReport } from './report.controller.js';

const router = Router();

router.get('/reports', authenticate, requireAdminRole, validate(reportListSchema), listReports);
router.get('/reports/:id', authenticate, requireAdminRole, validateObjectId('id'), getReport);
router.patch('/reports/:id/assign', authenticate, requireAdminRole, validateObjectId('id'), validate(assignReportSchema), assignReport);
router.patch('/reports/:id/resolve', authenticate, requireAdminRole, validateObjectId('id'), validate(resolveReportSchema), resolveReport);
router.post('/moderation/actions', authenticate, requireAdminRole, validate(moderationActionSchema), createModerationAction);

export default router;
