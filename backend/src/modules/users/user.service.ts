import { prisma } from '../../config/prisma.js';
import type { Prisma } from '@prisma/client';
import { ApiError } from '../../shared/errors/api-error.js';
import { getStorage } from '../../shared/storage/storage.service.js';
import { currentUserSelect, toCurrentUserDto } from './user.dto.js';
import type { UpdateProfileInput } from './user.schemas.js';

function normalizedPhone(phone: string | null) {
  return phone ? phone.replace(/\s+/g, '') : null;
}

export const userService = {
  async update(userId: string, input: UpdateProfileInput) {
    const phone = input.phone === undefined ? undefined : normalizedPhone(input.phone);
    const current = await prisma.user.findUnique({
      where: { id: userId },
      select: { phone: true }
    });
    if (!current) throw new ApiError(404, 'Utilisateur introuvable.', 'USER_NOT_FOUND');

    const data: Prisma.UserUncheckedUpdateInput = {
      lastActiveAt: new Date(),
      ...(input.fullName !== undefined ? { fullName: input.fullName } : {}),
      ...(input.commune !== undefined ? { commune: input.commune } : {}),
      ...(input.quartier !== undefined ? { quartier: input.quartier } : {}),
      ...(input.phone !== undefined
        ? {
            phone: phone ?? null,
            ...(phone !== current.phone ? { phoneVerifiedAt: null } : {})
          }
        : {})
    };
    const user = await prisma.user.update({
      where: { id: userId },
      data,
      select: currentUserSelect
    });
    return toCurrentUserDto(user);
  },

  async updateAvatar(userId: string, buffer: Buffer) {
    const current = await prisma.user.findUnique({
      where: { id: userId },
      select: { avatarKey: true }
    });
    if (!current) throw new ApiError(404, 'Utilisateur introuvable.', 'USER_NOT_FOUND');

    const storage = getStorage();
    const stored = await storage.saveImage({
      buffer,
      namespace: `avatars/${userId}`
    });

    try {
      const user = await prisma.user.update({
        where: { id: userId },
        data: { avatarKey: stored.key, lastActiveAt: new Date() },
        select: currentUserSelect
      });
      if (current.avatarKey) {
        await storage.delete(current.avatarKey).catch(() => undefined);
      }
      return toCurrentUserDto(user);
    } catch (error) {
      await storage.delete(stored.key).catch(() => undefined);
      throw error;
    }
  },

  async deleteAvatar(userId: string) {
    const current = await prisma.user.findUnique({
      where: { id: userId },
      select: { avatarKey: true }
    });
    if (!current) throw new ApiError(404, 'Utilisateur introuvable.', 'USER_NOT_FOUND');
    if (!current.avatarKey) return;

    await prisma.user.update({
      where: { id: userId },
      data: { avatarKey: null, lastActiveAt: new Date() }
    });
    await getStorage().delete(current.avatarKey).catch(() => undefined);
  },

  async archive(userId: string) {
    const now = new Date();
    await prisma.$transaction(async (tx) => {
      const activeOrder = await tx.order.findFirst({
        where: {
          OR: [{ buyerId: userId }, { sellerId: userId }],
          status: { notIn: ['COMPLETED', 'CANCELLED', 'REFUNDED'] }
        },
        select: { id: true }
      });
      if (activeOrder) {
        throw new ApiError(
          409,
          'Votre compte ne peut pas être archivé tant qu’une commande est en cours.',
          'ACCOUNT_HAS_ACTIVE_ORDER'
        );
      }
      await tx.user.update({
        where: { id: userId },
        data: { status: 'ARCHIVED', archivedAt: now }
      });
      await tx.session.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: now, revokeReason: 'ACCOUNT_ARCHIVED' }
      });
      await tx.product.updateMany({
        where: { sellerId: userId, archivedAt: null },
        data: { status: 'ARCHIVED', archivedAt: now }
      });
    });
  },

  async publicProfile(userId: string, viewerId?: string) {
    const blocked =
      viewerId &&
      (await prisma.userBlock.findFirst({
        where: {
          OR: [
            { blockerId: viewerId, blockedId: userId },
            { blockerId: userId, blockedId: viewerId }
          ]
        },
        select: { id: true }
      }));
    if (blocked) throw new ApiError(404, 'Profil introuvable.', 'USER_NOT_FOUND');

    const user = await prisma.user.findFirst({
      where: { id: userId, status: 'ACTIVE', archivedAt: null },
      select: {
        id: true,
        fullName: true,
        avatarKey: true,
        commune: true,
        sellerVerificationStatus: true,
        averageRating: true,
        totalReviews: true,
        trustScore: true,
        createdAt: true,
        _count: {
          select: {
            products: {
              where: { status: 'AVAILABLE', moderationStatus: 'APPROVED', archivedAt: null }
            }
          }
        }
      }
    });
    if (!user) throw new ApiError(404, 'Profil introuvable.', 'USER_NOT_FOUND');
    return {
      id: user.id,
      fullName: user.fullName,
      avatarUrl: user.avatarKey ? getStorage().publicUrl(user.avatarKey) : null,
      commune: user.commune,
      verifiedSeller: user.sellerVerificationStatus === 'APPROVED',
      averageRating: String(user.averageRating),
      totalReviews: user.totalReviews,
      trustScore: user.trustScore,
      activeProducts: user._count.products,
      memberSince: user.createdAt.toISOString()
    };
  },

  async block(blockerId: string, blockedId: string, reason?: string) {
    if (blockerId === blockedId) {
      throw new ApiError(400, 'Vous ne pouvez pas vous bloquer.', 'SELF_BLOCK_FORBIDDEN');
    }
    const target = await prisma.user.findFirst({
      where: { id: blockedId, status: { not: 'ARCHIVED' } },
      select: { id: true }
    });
    if (!target) throw new ApiError(404, 'Utilisateur introuvable.', 'USER_NOT_FOUND');
    await prisma.userBlock.upsert({
      where: { blockerId_blockedId: { blockerId, blockedId } },
      update: { ...(reason ? { reason } : { reason: null }) },
      create: { blockerId, blockedId, ...(reason ? { reason } : {}) }
    });
  },

  async unblock(blockerId: string, blockedId: string) {
    await prisma.userBlock.deleteMany({ where: { blockerId, blockedId } });
  }
};
