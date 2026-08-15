import { Prisma } from '@prisma/client';
import { getStorage } from '../../shared/storage/storage.service.js';

export const productCardSelect = {
  id: true,
  sellerId: true,
  title: true,
  slug: true,
  price: true,
  currency: true,
  condition: true,
  subcategoryId: true,
  listingMode: true,
  stockQuantity: true,
  reservedQuantity: true,
  isNegotiable: true,
  commune: true,
  quartier: true,
  status: true,
  viewsCount: true,
  likesCount: true,
  favoritesCount: true,
  conversationsCount: true,
  publishedAt: true,
  createdAt: true,
  images: {
    where: { archivedAt: null },
    orderBy: [{ isMain: 'desc' }, { sortOrder: 'asc' }],
    take: 1,
    select: {
      id: true,
      storageKey: true,
      width: true,
      height: true,
      isMain: true,
      sortOrder: true
    }
  },
  seller: {
    select: {
      id: true,
      fullName: true,
      avatarKey: true,
      sellerVerificationStatus: true,
      averageRating: true,
      totalReviews: true
    }
  },
  category: { select: { id: true, name: true, slug: true } },
  boosts: {
    where: { status: 'ACTIVE' },
    orderBy: { endsAt: 'desc' },
    take: 1,
    select: { endsAt: true }
  }
} satisfies Prisma.ProductSelect;

export const productDetailSelect = {
  ...productCardSelect,
  description: true,
  categoryId: true,
  subcategoryId: true,
  handoverModes: true,
  moderationStatus: true,
  moderationReason: true,
  viewsCount: true,
  favoritesCount: true,
  images: {
    where: { archivedAt: null },
    orderBy: [{ isMain: 'desc' }, { sortOrder: 'asc' }],
    select: {
      id: true,
      storageKey: true,
      width: true,
      height: true,
      isMain: true,
      sortOrder: true
    }
  },
  subcategory: { select: { id: true, name: true, slug: true } }
} satisfies Prisma.ProductSelect;

type ProductCard = Prisma.ProductGetPayload<{ select: typeof productCardSelect }>;
type ProductDetail = Prisma.ProductGetPayload<{ select: typeof productDetailSelect }>;

function imageDto(image: ProductDetail['images'][number]) {
  return {
    id: image.id,
    url: getStorage().publicUrl(image.storageKey),
    width: image.width,
    height: image.height,
    isMain: image.isMain,
    sortOrder: image.sortOrder
  };
}

function sellerDto(seller: ProductCard['seller']) {
  return {
    id: seller.id,
    fullName: seller.fullName,
    avatarUrl: seller.avatarKey ? getStorage().publicUrl(seller.avatarKey) : null,
    verified: seller.sellerVerificationStatus === 'APPROVED',
    averageRating: String(seller.averageRating),
    totalReviews: seller.totalReviews
  };
}

export function toProductCardDto(product: ProductCard) {
  return {
    id: product.id,
    title: product.title,
    slug: product.slug,
    price: product.price.toString(),
    currency: product.currency,
    condition: product.condition,
    listingMode: product.listingMode,
    stockQuantity: product.stockQuantity,
    availableQuantity: Math.max(0, product.stockQuantity - product.reservedQuantity),
    isNegotiable: product.isNegotiable,
    commune: product.commune,
    quartier: product.quartier,
    status: product.status,
    viewsCount: product.viewsCount,
    likesCount: product.likesCount,
    favoritesCount: product.favoritesCount,
    conversationsCount: product.conversationsCount,
    category: product.category,
    isBoosted: Boolean(product.boosts[0]?.endsAt && product.boosts[0].endsAt > new Date()),
    publishedAt: product.publishedAt?.toISOString() ?? null,
    createdAt: product.createdAt.toISOString(),
    mainImage: product.images[0] ? imageDto(product.images[0]) : null,
    seller: sellerDto(product.seller)
  };
}

export function toProductDetailDto(product: ProductDetail) {
  return {
    ...toProductCardDto(product),
    description: product.description,
    subcategory: product.subcategory,
    handoverModes: product.handoverModes,
    moderationStatus: product.moderationStatus,
    moderationReason: product.moderationReason,
    viewsCount: product.viewsCount,
    favoritesCount: product.favoritesCount,
    images: product.images.map(imageDto)
  };
}
