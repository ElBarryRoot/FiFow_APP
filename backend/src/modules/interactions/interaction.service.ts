import { prisma } from '../../config/prisma.js';
import { ApiError } from '../../shared/errors/api-error.js';
import { productCardSelect, toProductCardDto } from '../products/product.dto.js';

async function availableProduct(productId: string) {
  const product = await prisma.product.findFirst({
    where: { id: productId, status: 'AVAILABLE', moderationStatus: 'APPROVED', archivedAt: null },
    select: { id: true, sellerId: true }
  });
  if (!product) throw new ApiError(404, 'Annonce introuvable.', 'PRODUCT_NOT_FOUND');
  return product;
}

export const interactionService = {
  async favorite(userId: string, productId: string) {
    const product = await availableProduct(productId);
    if (product.sellerId === userId) {
      throw new ApiError(400, 'Votre propre annonce ne peut pas être ajoutée aux favoris.', 'OWN_PRODUCT');
    }
    await prisma.$transaction(async (tx) => {
      const created = await tx.favorite.createMany({
        data: [{ userId, productId }],
        skipDuplicates: true
      });
      if (created.count) {
        await tx.product.update({ where: { id: productId }, data: { favoritesCount: { increment: 1 } } });
      }
    });
  },

  async unfavorite(userId: string, productId: string) {
    await prisma.$transaction(async (tx) => {
      const removed = await tx.favorite.deleteMany({ where: { userId, productId } });
      if (removed.count) {
        await tx.product.update({
          where: { id: productId },
          data: { favoritesCount: { decrement: 1 } }
        });
      }
    });
  },

  async like(userId: string, productId: string) {
    const product = await availableProduct(productId);
    if (product.sellerId === userId) {
      throw new ApiError(400, 'Votre propre annonce ne peut pas être aimée.', 'OWN_PRODUCT');
    }
    await prisma.$transaction(async (tx) => {
      const created = await tx.productLike.createMany({
        data: [{ userId, productId }],
        skipDuplicates: true
      });
      if (created.count) {
        await tx.product.update({ where: { id: productId }, data: { likesCount: { increment: 1 } } });
      }
    });
  },

  async unlike(userId: string, productId: string) {
    await prisma.$transaction(async (tx) => {
      const removed = await tx.productLike.deleteMany({ where: { userId, productId } });
      if (removed.count) {
        await tx.product.update({ where: { id: productId }, data: { likesCount: { decrement: 1 } } });
      }
    });
  },

  async recordView(
    productId: string,
    visitorKey: string,
    context: { userId?: string; ipHash?: string; userAgent?: string }
  ) {
    const product = await availableProduct(productId);
    if (context.userId && context.userId === product.sellerId) return;
    const since = new Date(Date.now() - 24 * 60 * 60_000);
    await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM products WHERE id = ${productId}::uuid FOR UPDATE`;
      const existing = await tx.productView.findFirst({
        where: { productId, visitorKey, viewedAt: { gte: since } },
        select: { id: true }
      });
      if (existing) return;
      await tx.productView.create({
        data: {
          productId,
          visitorKey,
          ...(context.userId ? { userId: context.userId } : {}),
          ...(context.ipHash ? { ipHash: context.ipHash } : {}),
          ...(context.userAgent ? { userAgent: context.userAgent.slice(0, 2_000) } : {})
        }
      });
      await tx.product.update({ where: { id: productId }, data: { viewsCount: { increment: 1 } } });
    });
  },

  async favorites(userId: string) {
    const favorites = await prisma.favorite.findMany({
      where: {
        userId,
        product: { status: 'AVAILABLE', moderationStatus: 'APPROVED', archivedAt: null }
      },
      orderBy: { createdAt: 'desc' },
      select: { product: { select: productCardSelect } }
    });
    return favorites.map(({ product }) => toProductCardDto(product));
  },

  async likes(userId: string) {
    const likes = await prisma.productLike.findMany({
      where: {
        userId,
        product: { status: 'AVAILABLE', moderationStatus: 'APPROVED', archivedAt: null }
      },
      orderBy: { createdAt: 'desc' },
      select: { product: { select: productCardSelect } }
    });
    return likes.map(({ product }) => toProductCardDto(product));
  }
};
