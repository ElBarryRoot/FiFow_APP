import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireAdminRole } from '../../middlewares/requireRole.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { adminListReviews, hideReview } from './review.controller.js';
import { adminListReviewsSchema, hideReviewSchema } from './review.validator.js';

const router = Router();

router.get('/reviews', authenticate, requireAdminRole, validate(adminListReviewsSchema), adminListReviews);
router.patch('/reviews/:id/hide', authenticate, requireAdminRole, validate(hideReviewSchema), hideReview);

export default router;
