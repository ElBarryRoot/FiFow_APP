import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { createProductBoost, listBoostPlans, listMyBoosts } from './boost.controller.js';
import { createBoostSchema, listBoostPlansSchema, listMyBoostsSchema } from './boost.validator.js';

const router = Router();

router.get('/boost-plans', validate(listBoostPlansSchema), listBoostPlans);
router.post('/products/:id/boosts', authenticate, validate(createBoostSchema), createProductBoost);
router.get('/me/boosts', authenticate, validate(listMyBoostsSchema), listMyBoosts);

export default router;
