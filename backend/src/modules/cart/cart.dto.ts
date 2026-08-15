import type { Prisma } from '@prisma/client';
import { getStorage } from '../../shared/storage/storage.service.js';

export const cartInclude = {
  items: {
    orderBy: { createdAt: 'asc' as const },
    include: {
      product: {
        include: {
          seller: {
            select: {
              id: true,
              fullName: true,
              avatarKey: true,
              sellerVerificationStatus: true
            }
          },
          images: {
            where: { archivedAt: null },
            orderBy: [{ isMain: 'desc' as const }, { sortOrder: 'asc' as const }],
            take: 1,
            select: { storageKey: true }
          }
        }
      }
    }
  }
} satisfies Prisma.CartInclude;

export type CartWithItems = Prisma.CartGetPayload<{ include: typeof cartInclude }>;

function itemDto(item: CartWithItems['items'][number]) {
  const { product } = item;
  const availableQuantity = Math.max(0, product.stockQuantity - product.reservedQuantity);
  const listingAvailable =
    product.status === 'AVAILABLE' &&
    product.moderationStatus === 'APPROVED' &&
    !product.archivedAt &&
    availableQuantity >= item.quantity;
  const priceChanged = item.unitPriceAtAddition !== product.price;
  const imageKey = product.images[0]?.storageKey;

  return {
    id: item.id,
    quantity: item.quantity,
    unitPriceAtAddition: item.unitPriceAtAddition.toString(),
    currentUnitPrice: product.price.toString(),
    lineTotal: (product.price * BigInt(item.quantity)).toString(),
    currency: item.currency,
    priceChanged,
    availability: listingAvailable ? 'AVAILABLE' : 'UNAVAILABLE',
    canCheckout: listingAvailable,
    availableQuantity,
    product: {
      id: product.id,
      title: product.title,
      slug: product.slug,
      status: product.status,
      listingMode: product.listingMode,
      stockQuantity: product.stockQuantity,
      reservedQuantity: product.reservedQuantity,
      handoverModes: product.handoverModes,
      imageUrl: imageKey ? getStorage().publicUrl(imageKey) : null
    },
    createdAt: item.createdAt,
    updatedAt: item.updatedAt
  };
}

export function emptyCartDto() {
  return {
    id: null,
    itemCount: 0,
    totalQuantity: 0,
    estimatedSubtotal: '0',
    currency: 'GNF' as const,
    hasUnavailableItems: false,
    hasPriceChanges: false,
    groups: []
  };
}

export function toCartDto(cart: CartWithItems) {
  const grouped = new Map<
    string,
    {
      seller: CartWithItems['items'][number]['product']['seller'];
      items: ReturnType<typeof itemDto>[];
    }
  >();

  for (const row of cart.items) {
    const group = grouped.get(row.product.sellerId) ?? { seller: row.product.seller, items: [] };
    group.items.push(itemDto(row));
    grouped.set(row.product.sellerId, group);
  }

  const groups = [...grouped.values()].map(({ seller, items }) => {
    const estimatedSubtotal = items.reduce(
      (total, item) => total + (item.canCheckout ? BigInt(item.lineTotal) : 0n),
      0n
    );
    return {
      seller: {
        id: seller.id,
        fullName: seller.fullName,
        avatarUrl: seller.avatarKey ? getStorage().publicUrl(seller.avatarKey) : null,
        verified: seller.sellerVerificationStatus === 'APPROVED'
      },
      itemCount: items.length,
      estimatedSubtotal: estimatedSubtotal.toString(),
      canCheckout: items.length > 0 && items.every((item) => item.canCheckout),
      items
    };
  });
  const allItems = groups.flatMap((group) => group.items);
  const estimatedSubtotal = groups.reduce((total, group) => total + BigInt(group.estimatedSubtotal), 0n);

  return {
    id: cart.id,
    itemCount: allItems.length,
    totalQuantity: allItems.reduce((total, item) => total + item.quantity, 0),
    estimatedSubtotal: estimatedSubtotal.toString(),
    currency: 'GNF' as const,
    hasUnavailableItems: allItems.some((item) => !item.canCheckout),
    hasPriceChanges: allItems.some((item) => item.priceChanged),
    groups
  };
}
