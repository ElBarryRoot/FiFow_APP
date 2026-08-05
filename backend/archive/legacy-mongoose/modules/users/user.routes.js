import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { validateObjectId } from '../../middlewares/validateObjectId.middleware.js';
import { updateProfileSchema, reportUserSchema, blockUserSchema } from './user.validator.js';
import * as userController from './user.controller.js';

const router = Router();

router.get('/me', authenticate, userController.getMe);
router.patch('/me', authenticate, validate(updateProfileSchema), userController.updateMe);
router.post('/me/archive', authenticate, userController.archiveMe);
router.get('/:id/public', validateObjectId('id'), userController.getPublicProfile);
router.post('/:id/report', authenticate, validateObjectId('id'), validate(reportUserSchema), userController.reportUser);
router.post('/:id/block', authenticate, validateObjectId('id'), validate(blockUserSchema), userController.blockUser);
router.delete('/:id/block', authenticate, validateObjectId('id'), userController.unblockUser);

export default router;
