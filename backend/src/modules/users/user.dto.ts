import { Prisma } from '@prisma/client';
import { getStorage } from '../../shared/storage/storage.service.js';

export const currentUserSelect = {
  id: true,
  email: true,
  fullName: true,
  phone: true,
  emailVerifiedAt: true,
  phoneVerifiedAt: true,
  commune: true,
  quartier: true,
  avatarKey: true,
  role: true,
  status: true,
  sellerVerificationStatus: true,
  canManageStock: true,
  averageRating: true,
  totalReviews: true,
  trustScore: true,
  createdAt: true
} satisfies Prisma.UserSelect;

type CurrentUser = Prisma.UserGetPayload<{ select: typeof currentUserSelect }>;

export function toCurrentUserDto(user: CurrentUser) {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    phone: user.phone,
    emailVerified: Boolean(user.emailVerifiedAt),
    phoneVerified: Boolean(user.phoneVerifiedAt),
    commune: user.commune,
    quartier: user.quartier,
    avatarUrl: user.avatarKey ? getStorage().publicUrl(user.avatarKey) : null,
    role: user.role,
    status: user.status,
    sellerVerificationStatus: user.sellerVerificationStatus,
    canManageStock: user.canManageStock,
    averageRating: String(user.averageRating),
    totalReviews: user.totalReviews,
    trustScore: user.trustScore,
    createdAt: user.createdAt.toISOString()
  };
}
