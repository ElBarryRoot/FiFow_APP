import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { optionalAuth } from '../../middlewares/optionalAuth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { createReview, listUserReviews, replyToReview, reportReview } from './review.controller.js';
import { createReviewSchema, listUserReviewsSchema, replyReviewSchema, reportReviewSchema } from './review.validator.js';

const router = Router();

router.post('/reviews', authenticate, validate(createReviewSchema), createReview);
router.get('/users/:id/reviews', optionalAuth, validate(listUserReviewsSchema), listUserReviews);
router.patch('/reviews/:id/reply', authenticate, validate(replyReviewSchema), replyToReview);
router.post('/reviews/:id/report', authenticate, validate(reportReviewSchema), reportReview);

export default router;
