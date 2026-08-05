import { Router } from 'express';
import { authenticate, optionalAuthenticate } from '../../modules/auth/auth.middleware.js';
import { interactionController } from '../../modules/interactions/interaction.controller.js';
import { interactionProductSchema } from '../../modules/interactions/interaction.schemas.js';
import { asyncHandler } from '../../shared/http/async-handler.js';
import { validate } from '../middlewares/validate.middleware.js';

export const interactionRoutes = Router();

interactionRoutes.get('/favorites', authenticate, asyncHandler(interactionController.favorites));
interactionRoutes.get('/likes', authenticate, asyncHandler(interactionController.likes));
interactionRoutes.post(
  '/products/:productId/favorite',
  authenticate,
  validate(interactionProductSchema),
  asyncHandler(interactionController.favorite)
);
interactionRoutes.delete(
  '/products/:productId/favorite',
  authenticate,
  validate(interactionProductSchema),
  asyncHandler(interactionController.unfavorite)
);
interactionRoutes.post(
  '/products/:productId/like',
  authenticate,
  validate(interactionProductSchema),
  asyncHandler(interactionController.like)
);
interactionRoutes.delete(
  '/products/:productId/like',
  authenticate,
  validate(interactionProductSchema),
  asyncHandler(interactionController.unlike)
);
interactionRoutes.post(
  '/products/:productId/view',
  optionalAuthenticate,
  validate(interactionProductSchema),
  asyncHandler(interactionController.view)
);
