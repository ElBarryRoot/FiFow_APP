import { Router } from 'express';
import { validate } from '../../http/middlewares/validate.middleware.js';
import { asyncHandler } from '../../shared/http/async-handler.js';
import { sendSuccess } from '../../shared/http/api-response.js';
import { authenticate } from '../auth/auth.middleware.js';
import { cartService } from './cart.service.js';
import {
  addCartItemSchema,
  cartItemIdSchema,
  cartReadSchema,
  updateCartItemSchema,
  type AddCartItemInput
} from './cart.schemas.js';

export const cartRoutes = Router();
cartRoutes.use(authenticate);

cartRoutes.get(
  '/',
  validate(cartReadSchema),
  asyncHandler(async (request, response) => {
    return sendSuccess(response, { data: await cartService.get(request.auth!.userId) });
  })
);

cartRoutes.post(
  '/items',
  validate(addCartItemSchema),
  asyncHandler(async (request, response) => {
    const { body } = request.validated as { body: AddCartItemInput };
    return sendSuccess(response, {
      statusCode: 201,
      data: await cartService.add(request.auth!.userId, body),
      message: 'Annonce ajoutée au panier.'
    });
  })
);

cartRoutes.patch(
  '/items/:itemId',
  validate(updateCartItemSchema),
  asyncHandler(async (request, response) => {
    const { params, body } = request.validated as {
      params: { itemId: string };
      body: { quantity: number };
    };
    return sendSuccess(response, {
      data: await cartService.updateQuantity(request.auth!.userId, params.itemId, body.quantity),
      message: 'Quantité mise à jour.'
    });
  })
);

cartRoutes.delete(
  '/items/:itemId',
  validate(cartItemIdSchema),
  asyncHandler(async (request, response) => {
    const { params } = request.validated as { params: { itemId: string } };
    return sendSuccess(response, {
      data: await cartService.remove(request.auth!.userId, params.itemId),
      message: 'Annonce retirée du panier.'
    });
  })
);

cartRoutes.delete(
  '/',
  validate(cartReadSchema),
  asyncHandler(async (request, response) => {
    return sendSuccess(response, {
      data: await cartService.clear(request.auth!.userId),
      message: 'Panier vidé.'
    });
  })
);
