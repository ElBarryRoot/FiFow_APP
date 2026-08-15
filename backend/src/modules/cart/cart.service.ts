import { Prisma, type ListingMode } from '@prisma/client';
import { prisma } from '../../config/prisma.js';
import { ApiError } from '../../shared/errors/api-error.js';
import { cartInclude, emptyCartDto, toCartDto } from './cart.dto.js';
import type { AddCartItemInput } from './cart.schemas.js';

export function maximumCartQuantity(listingMode: ListingMode, availableQuantity: number) {
  return listingMode === 'STOCK' ? Math.min(99, availableQuantity) : Math.min(1, availableQuantity);
}

function assertQuantityAllowed(listingMode: ListingMode, availableQuantity: number, quantity: number) {
  if (quantity > maximumCartQuantity(listingMode, availableQuantity)) {
    throw new ApiError(
      409,
      availableQuantity <= 0
        ? 'Cette annonce n’est plus disponible.'
        : `Seulement ${availableQuantity} exemplaire(s) disponible(s).`,
      'CART_QUANTITY_UNAVAILABLE'
    );
  }
}

async function result(buyerId: string) {
  const cart = await prisma.cart.findUnique({ where: { buyerId }, include: cartInclude });
  return cart ? toCartDto(cart) : emptyCartDto();
}

export const cartService = {
  get: result,

  async add(buyerId: string, input: AddCartItemInput) {
    await prisma.$transaction(
      async (tx) => {
        const product = await tx.product.findFirst({
          where: {
            id: input.productId,
            status: 'AVAILABLE',
            moderationStatus: 'APPROVED',
            archivedAt: null
          },
          select: {
            id: true,
            sellerId: true,
            price: true,
            currency: true,
            listingMode: true,
            stockQuantity: true,
            reservedQuantity: true
          }
        });
        if (!product) throw new ApiError(404, 'Annonce indisponible.', 'PRODUCT_NOT_AVAILABLE');
        if (product.sellerId === buyerId) {
          throw new ApiError(400, 'Vous ne pouvez pas ajouter votre propre annonce.', 'OWN_PRODUCT');
        }
        assertQuantityAllowed(product.listingMode, product.stockQuantity - product.reservedQuantity, input.quantity);

        const blocked = await tx.userBlock.findFirst({
          where: {
            OR: [
              { blockerId: buyerId, blockedId: product.sellerId },
              { blockerId: product.sellerId, blockedId: buyerId }
            ]
          },
          select: { id: true }
        });
        if (blocked) throw new ApiError(403, 'Interaction impossible.', 'USER_BLOCKED');

        const cart = await tx.cart.upsert({
          where: { buyerId },
          create: { buyerId },
          update: {},
          select: { id: true }
        });
        const existing = await tx.cartItem.findUnique({
          where: { cartId_productId: { cartId: cart.id, productId: product.id } },
          select: { id: true }
        });
        if (!existing) {
          const itemCount = await tx.cartItem.count({ where: { cartId: cart.id } });
          if (itemCount >= 100) {
            throw new ApiError(409, 'Votre panier contient déjà le maximum de 100 annonces.', 'CART_ITEM_LIMIT');
          }
          await tx.cartItem.create({
            data: {
              cartId: cart.id,
              productId: product.id,
              quantity: input.quantity,
              unitPriceAtAddition: product.price,
              currency: product.currency
            }
          });
        }
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted }
    );
    return result(buyerId);
  },

  async updateQuantity(buyerId: string, itemId: string, quantity: number) {
    await prisma.$transaction(async (tx) => {
      const item = await tx.cartItem.findFirst({
        where: { id: itemId, cart: { buyerId } },
        include: {
          product: {
            select: {
              listingMode: true,
              stockQuantity: true,
              reservedQuantity: true,
              status: true,
              moderationStatus: true,
              archivedAt: true
            }
          }
        }
      });
      if (!item) throw new ApiError(404, 'Article du panier introuvable.', 'CART_ITEM_NOT_FOUND');
      const product = item.product;
      if (product.status !== 'AVAILABLE' || product.moderationStatus !== 'APPROVED' || product.archivedAt) {
        throw new ApiError(409, 'Cette annonce n’est plus disponible.', 'PRODUCT_NOT_AVAILABLE');
      }
      assertQuantityAllowed(product.listingMode, product.stockQuantity - product.reservedQuantity, quantity);
      await tx.cartItem.update({ where: { id: item.id }, data: { quantity } });
    });
    return result(buyerId);
  },

  async remove(buyerId: string, itemId: string) {
    const removed = await prisma.cartItem.deleteMany({ where: { id: itemId, cart: { buyerId } } });
    if (removed.count === 0) throw new ApiError(404, 'Article du panier introuvable.', 'CART_ITEM_NOT_FOUND');
    return result(buyerId);
  },

  async clear(buyerId: string) {
    await prisma.cartItem.deleteMany({ where: { cart: { buyerId } } });
    return result(buyerId);
  }
};
