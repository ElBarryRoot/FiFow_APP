import { Router } from 'express';
import { authenticate, optionalAuthenticate } from '../../modules/auth/auth.middleware.js';
import { userController } from '../../modules/users/user.controller.js';
import { blockUserSchema, updateProfileSchema, userIdSchema } from '../../modules/users/user.schemas.js';
import { asyncHandler } from '../../shared/http/async-handler.js';
import { singleImage } from '../middlewares/image-upload.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';

export const userRoutes = Router();

userRoutes.patch('/me', authenticate, validate(updateProfileSchema), asyncHandler(userController.updateMe));
userRoutes.put('/me/avatar', authenticate, singleImage, asyncHandler(userController.updateAvatar));
userRoutes.delete('/me/avatar', authenticate, asyncHandler(userController.deleteAvatar));
userRoutes.post('/me/archive', authenticate, asyncHandler(userController.archiveMe));
userRoutes.get(
  '/:userId/public',
  optionalAuthenticate,
  validate(userIdSchema),
  asyncHandler(userController.publicProfile)
);
userRoutes.post(
  '/:userId/block',
  authenticate,
  validate(blockUserSchema),
  asyncHandler(userController.block)
);
userRoutes.delete(
  '/:userId/block',
  authenticate,
  validate(userIdSchema),
  asyncHandler(userController.unblock)
);
