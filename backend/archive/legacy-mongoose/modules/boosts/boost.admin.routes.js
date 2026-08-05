import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireAdminRole } from '../../middlewares/requireRole.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { adminListBoosts, archiveBoostPlan, cancelBoost, createBoostPlan, updateBoostPlan } from './boost.controller.js';
import { adminListBoostsSchema, cancelBoostSchema, createBoostPlanSchema, updateBoostPlanSchema } from './boost.validator.js';

const router = Router();

router.get('/boosts', authenticate, requireAdminRole, validate(adminListBoostsSchema), adminListBoosts);
router.patch('/boosts/:id/cancel', authenticate, requireAdminRole, validate(cancelBoostSchema), cancelBoost);
router.post('/boost-plans', authenticate, requireAdminRole, validate(createBoostPlanSchema), createBoostPlan);
router.patch('/boost-plans/:id', authenticate, requireAdminRole, validate(updateBoostPlanSchema), updateBoostPlan);
router.patch('/boost-plans/:id/archive', authenticate, requireAdminRole, validate(updateBoostPlanSchema.pick({ params: true })), archiveBoostPlan);

export default router;
