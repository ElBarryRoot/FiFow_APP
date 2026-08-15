import { randomBytes } from 'node:crypto';
import type { Prisma, ProductStatus } from '@prisma/client';
import { env } from '../../config/env.js';
import { logger } from '../../config/logger.js';
import { prisma } from '../../config/prisma.js';
import { ApiError } from '../../shared/errors/api-error.js';
import { getStorage } from '../../shared/storage/storage.service.js';
import {
  productCardSelect,
  productDetailSelect,
  toProductCardDto,
  toProductDetailDto
} from './product.dto.js';
import type {
  CreateProductInput,
  ListProductsInput,
  UpdateProductInput,
  UpdateProductStockInput
} from './product.schemas.js';
import { rankSimilarProducts } from './recommendation-ranking.js';

const EDITABLE_STATUSES: ProductStatus[] = ['DRAFT', 'REJECTED'];

function slugify(title: string) {
  const base = title
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 140);
  return `${base || 'annonce'}-${randomBytes(5).toString('hex')}`;
}

async function activeSubcategory(categoryId: string, subcategoryId: string) {
  const subcategory = await prisma.category.findFirst({
    where: {
      id: subcategoryId,
      parentId: categoryId,
      isActive: true,
      archivedAt: null,
      parent: { isActive: true, archivedAt: null }
    },
    select: {
      id: true,
      isSensitive: true,
      requiresAdminValidation: true,
      parent: {
        select: { isSensitive: true, requiresAdminValidation: true }
      }
    }
  });
  if (!subcategory) {
    throw new ApiError(400, 'La sous-catégorie ne correspond pas à la catégorie.', 'INVALID_CATEGORY_TREE');
  }
  return subcategory;
}

async function settingNumber(key: string, fallback: number) {
  const setting = await prisma.appSetting.findUnique({
    where: { key },
    select: { value: true }
  });
  return typeof setting?.value === 'number' ? setting.value : fallback;
}

function editableProduct(status: ProductStatus) {
  if (!EDITABLE_STATUSES.includes(status)) {
    throw new ApiError(409, 'Cette annonce ne peut plus être modifiée dans son état actuel.', 'PRODUCT_NOT_EDITABLE');
  }
}

async function assertInventoryCapability(sellerId: string, listingMode: 'SINGLE' | 'STOCK' | 'LOT') {
  if (listingMode !== 'STOCK') return;
  const seller = await prisma.user.findUnique({
    where: { id: sellerId },
    select: { canManageStock: true }
  });
  if (!seller?.canManageStock) {
    throw new ApiError(
      403,
      'La vente avec stock est réservée aux vendeurs autorisés.',
      'STOCK_CAPABILITY_REQUIRED'
    );
  }
}

export const productService = {
  async create(sellerId: string, input: CreateProductInput) {
    await activeSubcategory(input.categoryId, input.subcategoryId);
    await assertInventoryCapability(sellerId, input.listingMode);

    const dailyLimit = await settingNumber('max_daily_products_per_user', 20);
    const startOfDay = new Date();
    startOfDay.setUTCHours(0, 0, 0, 0);
    const createdToday = await prisma.product.count({
      where: { sellerId, createdAt: { gte: startOfDay }, archivedAt: null }
    });
    if (createdToday >= dailyLimit) {
      throw new ApiError(429, 'Limite quotidienne d’annonces atteinte.', 'DAILY_PRODUCT_LIMIT');
    }

    const product = await prisma.product.create({
      data: {
        sellerId,
        categoryId: input.categoryId,
        subcategoryId: input.subcategoryId,
        title: input.title,
        slug: slugify(input.title),
        description: input.description,
        price: BigInt(input.price),
        condition: input.condition,
        listingMode: input.listingMode,
        stockQuantity: input.listingMode === 'STOCK' ? input.stockQuantity : 1,
        isNegotiable: input.isNegotiable,
        commune: input.commune,
        quartier: input.quartier,
        handoverModes: input.handoverModes
      },
      select: productDetailSelect
    });
    return toProductDetailDto(product);
  },

  async update(sellerId: string, productId: string, input: UpdateProductInput) {
    const existing = await prisma.product.findFirst({
      where: { id: productId, sellerId, archivedAt: null },
      select: {
        id: true,
        status: true,
        categoryId: true,
        subcategoryId: true,
        listingMode: true,
        stockQuantity: true
      }
    });
    if (!existing) throw new ApiError(404, 'Annonce introuvable.', 'PRODUCT_NOT_FOUND');
    editableProduct(existing.status);

    const categoryId = input.categoryId ?? existing.categoryId;
    const subcategoryId = input.subcategoryId ?? existing.subcategoryId;
    if (input.categoryId || input.subcategoryId) {
      await activeSubcategory(categoryId, subcategoryId);
    }
    const listingMode = input.listingMode ?? existing.listingMode;
    const stockQuantity = listingMode === 'STOCK'
      ? input.stockQuantity ?? (existing.listingMode === 'STOCK' ? existing.stockQuantity : 1)
      : 1;
    await assertInventoryCapability(sellerId, listingMode);
    if (listingMode !== 'STOCK' && input.stockQuantity !== undefined && input.stockQuantity !== 1) {
      throw new ApiError(400, 'Un article unique ou un lot possède une quantité fixe de 1.', 'INVALID_STOCK_QUANTITY');
    }

    const { price, ...rest } = input;
    const data: Prisma.ProductUncheckedUpdateInput = {
      moderationReason: null,
      ...(rest.title !== undefined ? { title: rest.title, slug: slugify(rest.title) } : {}),
      ...(rest.description !== undefined ? { description: rest.description } : {}),
      ...(rest.condition !== undefined ? { condition: rest.condition } : {}),
      ...(rest.listingMode !== undefined ? { listingMode: rest.listingMode } : {}),
      ...(rest.listingMode !== undefined || rest.stockQuantity !== undefined
        ? { stockQuantity: listingMode === 'STOCK' ? stockQuantity : 1 }
        : {}),
      ...(rest.isNegotiable !== undefined ? { isNegotiable: rest.isNegotiable } : {}),
      ...(rest.categoryId !== undefined ? { categoryId: rest.categoryId } : {}),
      ...(rest.subcategoryId !== undefined ? { subcategoryId: rest.subcategoryId } : {}),
      ...(rest.commune !== undefined ? { commune: rest.commune } : {}),
      ...(rest.quartier !== undefined ? { quartier: rest.quartier } : {}),
      ...(rest.handoverModes !== undefined ? { handoverModes: rest.handoverModes } : {}),
      ...(price !== undefined ? { price: BigInt(price) } : {})
    };
    const product = await prisma.product.update({
      where: { id: productId },
      data,
      select: productDetailSelect
    });
    return toProductDetailDto(product);
  },

  async updateStock(sellerId: string, productId: string, input: UpdateProductStockInput) {
    const product = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM products WHERE id = ${productId}::uuid FOR UPDATE`;
      const current = await tx.product.findFirst({
        where: { id: productId, sellerId, archivedAt: null },
        select: {
          id: true,
          listingMode: true,
          reservedQuantity: true,
          status: true,
          moderationStatus: true,
          seller: { select: { canManageStock: true } }
        }
      });
      if (!current) throw new ApiError(404, 'Annonce introuvable.', 'PRODUCT_NOT_FOUND');
      if (current.listingMode !== 'STOCK') {
        throw new ApiError(409, 'Cette annonce ne gère pas de stock.', 'PRODUCT_STOCK_NOT_SUPPORTED');
      }
      if (!current.seller.canManageStock) {
        throw new ApiError(403, 'La gestion du stock n’est plus autorisée pour ce compte.', 'STOCK_CAPABILITY_REQUIRED');
      }
      if (
        current.moderationStatus !== 'APPROVED' ||
        !['AVAILABLE', 'RESERVED', 'SOLD'].includes(current.status)
      ) {
        throw new ApiError(409, 'Le stock de cette annonce ne peut pas être modifié actuellement.', 'PRODUCT_STOCK_NOT_EDITABLE');
      }
      if (input.stockQuantity < current.reservedQuantity) {
        throw new ApiError(
          409,
          `${current.reservedQuantity} exemplaire(s) sont déjà réservé(s).`,
          'STOCK_BELOW_RESERVED_QUANTITY'
        );
      }
      const status = input.stockQuantity === 0
        ? 'SOLD'
        : input.stockQuantity - current.reservedQuantity > 0
          ? 'AVAILABLE'
          : 'RESERVED';
      return tx.product.update({
        where: { id: current.id },
        data: {
          stockQuantity: input.stockQuantity,
          status,
          soldAt: status === 'SOLD' ? new Date() : null,
          ...(current.reservedQuantity === 0 ? { reservedAt: null } : {})
        },
        select: productDetailSelect
      });
    });
    return toProductDetailDto(product);
  },

  async addImage(sellerId: string, productId: string, buffer: Buffer) {
    const product = await prisma.product.findFirst({
      where: { id: productId, sellerId, archivedAt: null },
      select: { id: true, status: true }
    });
    if (!product) throw new ApiError(404, 'Annonce introuvable.', 'PRODUCT_NOT_FOUND');
    editableProduct(product.status);

    const stored = await getStorage().saveImage({
      buffer,
      namespace: `products/${productId}`
    });

    try {
      return await prisma.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT id FROM products WHERE id = ${productId}::uuid FOR UPDATE`;
        const images = await tx.productImage.findMany({
          where: { productId },
          orderBy: { sortOrder: 'desc' },
          select: { sortOrder: true, archivedAt: true }
        });
        const activeImageCount = images.filter((image) => !image.archivedAt).length;
        if (activeImageCount >= env.MAX_PRODUCT_IMAGES) {
          throw new ApiError(
            400,
            `Une annonce accepte au maximum ${env.MAX_PRODUCT_IMAGES} images.`,
            'PRODUCT_IMAGE_LIMIT'
          );
        }
        const image = await tx.productImage.create({
          data: {
            productId,
            sellerId,
            storageKey: stored.key,
            mimeType: stored.mimeType,
            width: stored.width,
            height: stored.height,
            sizeBytes: stored.sizeBytes,
            isMain: activeImageCount === 0,
            sortOrder: (images[0]?.sortOrder ?? -1) + 1
          }
        });
        return {
          id: image.id,
          url: getStorage().publicUrl(image.storageKey),
          width: image.width,
          height: image.height,
          isMain: image.isMain,
          sortOrder: image.sortOrder
        };
      });
    } catch (error) {
      await getStorage().delete(stored.key);
      throw error;
    }
  },

  async deleteImage(sellerId: string, productId: string, imageId: string) {
    const storageKey = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM products WHERE id = ${productId}::uuid FOR UPDATE`;
      const product = await tx.product.findFirst({
        where: { id: productId, sellerId, archivedAt: null },
        select: { status: true }
      });
      if (!product) throw new ApiError(404, 'Annonce introuvable.', 'PRODUCT_NOT_FOUND');
      editableProduct(product.status);

      const image = await tx.productImage.findFirst({
        where: { id: imageId, productId, sellerId, archivedAt: null },
        select: { id: true, storageKey: true, isMain: true }
      });
      if (!image) throw new ApiError(404, 'Image introuvable.', 'PRODUCT_IMAGE_NOT_FOUND');

      await tx.productImage.update({
        where: { id: image.id },
        data: { archivedAt: new Date(), isMain: false }
      });
      if (image.isMain) {
        const nextImage = await tx.productImage.findFirst({
          where: { productId, archivedAt: null },
          orderBy: { sortOrder: 'asc' },
          select: { id: true }
        });
        if (nextImage) {
          await tx.productImage.update({ where: { id: nextImage.id }, data: { isMain: true } });
        }
      }
      return image.storageKey;
    });

    try {
      await getStorage().delete(storageKey);
    } catch (error) {
      logger.warn('Suppression différée d’un fichier produit', { productId, imageId, error });
    }
  },

  async setMainImage(sellerId: string, productId: string, imageId: string) {
    await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM products WHERE id = ${productId}::uuid FOR UPDATE`;
      const product = await tx.product.findFirst({
        where: { id: productId, sellerId, archivedAt: null },
        select: { status: true }
      });
      if (!product) throw new ApiError(404, 'Annonce introuvable.', 'PRODUCT_NOT_FOUND');
      editableProduct(product.status);
      const image = await tx.productImage.findFirst({
        where: { id: imageId, productId, sellerId, archivedAt: null },
        select: { id: true }
      });
      if (!image) throw new ApiError(404, 'Image introuvable.', 'PRODUCT_IMAGE_NOT_FOUND');
      await tx.productImage.updateMany({ where: { productId, isMain: true }, data: { isMain: false } });
      await tx.productImage.update({ where: { id: imageId }, data: { isMain: true } });
    });
  },

  async reorderImages(sellerId: string, productId: string, imageIds: string[]) {
    if (new Set(imageIds).size !== imageIds.length) {
      throw new ApiError(400, 'Une image apparaît plusieurs fois.', 'DUPLICATE_IMAGE_ID');
    }
    await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM products WHERE id = ${productId}::uuid FOR UPDATE`;
      const product = await tx.product.findFirst({
        where: { id: productId, sellerId, archivedAt: null },
        select: { status: true }
      });
      if (!product) throw new ApiError(404, 'Annonce introuvable.', 'PRODUCT_NOT_FOUND');
      editableProduct(product.status);
      const active = await tx.productImage.findMany({
        where: { productId, sellerId, archivedAt: null },
        select: { id: true }
      });
      const activeIds = new Set(active.map((image) => image.id));
      if (active.length !== imageIds.length || imageIds.some((id) => !activeIds.has(id))) {
        throw new ApiError(400, 'La liste doit contenir toutes les images actives.', 'INVALID_IMAGE_ORDER');
      }
      for (const [index, id] of imageIds.entries()) {
        await tx.productImage.update({ where: { id }, data: { sortOrder: 10_000 + index } });
      }
      for (const [index, id] of imageIds.entries()) {
        await tx.productImage.update({ where: { id }, data: { sortOrder: index } });
      }
    });
  },

  async archive(sellerId: string, productId: string) {
    const product = await prisma.product.findFirst({
      where: { id: productId, sellerId, archivedAt: null },
      select: {
        status: true,
        inventoryReservations: {
          where: { status: 'ACTIVE' },
          take: 1,
          select: { id: true }
        }
      }
    });
    if (!product) throw new ApiError(404, 'Annonce introuvable.', 'PRODUCT_NOT_FOUND');
    if (['RESERVED', 'SOLD'].includes(product.status) || product.inventoryReservations.length > 0) {
      throw new ApiError(409, 'Une annonce engagée dans une vente ne peut pas être archivée.', 'PRODUCT_ARCHIVE_FORBIDDEN');
    }
    await prisma.product.update({
      where: { id: productId },
      data: { status: 'ARCHIVED', archivedAt: new Date() }
    });
  },

  async stats(sellerId: string, productId: string) {
    const product = await prisma.product.findFirst({
      where: { id: productId, sellerId },
      select: {
        viewsCount: true,
        likesCount: true,
        favoritesCount: true,
        conversationsCount: true,
        reportsCount: true,
        status: true,
        publishedAt: true
      }
    });
    if (!product) throw new ApiError(404, 'Annonce introuvable.', 'PRODUCT_NOT_FOUND');
    return product;
  },

  async publish(sellerId: string, productId: string) {
    const updated = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM products WHERE id = ${productId}::uuid FOR UPDATE`;
      const product = await tx.product.findFirst({
        where: { id: productId, sellerId, archivedAt: null },
        select: {
          id: true,
          status: true,
          categoryId: true,
          subcategoryId: true,
          listingMode: true,
          seller: { select: { canManageStock: true } },
          images: { where: { archivedAt: null }, select: { id: true } }
        }
      });
      if (!product) throw new ApiError(404, 'Annonce introuvable.', 'PRODUCT_NOT_FOUND');
      editableProduct(product.status);
      if (product.images.length === 0) {
        throw new ApiError(400, 'Ajoutez au moins une image avant de publier.', 'PRODUCT_IMAGE_REQUIRED');
      }
      if (product.listingMode === 'STOCK' && !product.seller.canManageStock) {
        throw new ApiError(
          403,
          'La vente avec stock n’est plus autorisée pour ce compte.',
          'STOCK_CAPABILITY_REQUIRED'
        );
      }
      const category = await tx.category.findFirst({
        where: {
          id: product.subcategoryId,
          parentId: product.categoryId,
          isActive: true,
          archivedAt: null,
          parent: { isActive: true, archivedAt: null }
        },
        select: {
          isSensitive: true,
          requiresAdminValidation: true,
          parent: { select: { isSensitive: true, requiresAdminValidation: true } }
        }
      });
      if (!category) throw new ApiError(400, 'Catégorie invalide.', 'INVALID_CATEGORY_TREE');
      const requiresReview =
        category.isSensitive ||
        category.requiresAdminValidation ||
        category.parent?.isSensitive ||
        category.parent?.requiresAdminValidation;
      return tx.product.update({
        where: { id: product.id },
        data: {
          status: requiresReview ? 'PENDING_REVIEW' : 'AVAILABLE',
          moderationStatus: requiresReview ? 'PENDING' : 'APPROVED',
          publishedAt: requiresReview ? null : new Date(),
          moderationReason: null
        },
        select: productDetailSelect
      });
    });
    return toProductDetailDto(updated);
  },

  async list(input: ListProductsInput) {
    const where: Prisma.ProductWhereInput = {
      status: 'AVAILABLE',
      moderationStatus: 'APPROVED',
      archivedAt: null,
      ...(input.search
        ? {
            OR: [
              { title: { contains: input.search, mode: 'insensitive' } },
              { description: { contains: input.search, mode: 'insensitive' } }
            ]
          }
        : {}),
      ...(input.sellerId ? { sellerId: input.sellerId } : {}),
      ...(input.verified !== undefined
        ? { seller: { sellerVerificationStatus: input.verified ? 'APPROVED' : { not: 'APPROVED' } } }
        : {}),
      ...(input.boosted !== undefined
        ? {
            boosts: input.boosted
              ? { some: { status: 'ACTIVE', endsAt: { gt: new Date() }, archivedAt: null } }
              : { none: { status: 'ACTIVE', endsAt: { gt: new Date() }, archivedAt: null } }
          }
        : {}),
      ...(input.category ? { category: { slug: input.category } } : {}),
      ...(input.subcategory ? { subcategory: { slug: input.subcategory } } : {}),
      ...(input.commune ? { commune: { equals: input.commune, mode: 'insensitive' } } : {}),
      ...(input.condition ? { condition: input.condition } : {}),
      ...(input.negotiable !== undefined ? { isNegotiable: input.negotiable } : {}),
      ...(input.minPrice || input.maxPrice
        ? {
            price: {
              ...(input.minPrice ? { gte: BigInt(input.minPrice) } : {}),
              ...(input.maxPrice ? { lte: BigInt(input.maxPrice) } : {})
            }
          }
        : {})
    };
    const orderBy: Prisma.ProductOrderByWithRelationInput[] =
      input.sort === 'price_asc'
        ? [{ price: 'asc' }, { id: 'asc' }]
        : input.sort === 'price_desc'
          ? [{ price: 'desc' }, { id: 'desc' }]
          : [{ publishedAt: 'desc' }, { id: 'desc' }];

    const products = await prisma.product.findMany({
      where,
      orderBy,
      take: input.limit + 1,
      ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
      select: productCardSelect
    });
    const hasNextPage = products.length > input.limit;
    const page = hasNextPage ? products.slice(0, input.limit) : products;
    return {
      items: page.map(toProductCardDto),
      nextCursor: hasNextPage ? page.at(-1)?.id ?? null : null
    };
  },

  async detail(identifier: string) {
    const isId = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(identifier);
    const product = await prisma.product.findFirst({
      where: {
        ...(isId ? { id: identifier } : { slug: identifier }),
        status: 'AVAILABLE',
        moderationStatus: 'APPROVED',
        archivedAt: null
      },
      select: productDetailSelect
    });
    if (!product) throw new ApiError(404, 'Annonce introuvable.', 'PRODUCT_NOT_FOUND');
    return toProductDetailDto(product);
  },

  async similar(productId: string, limit: number) {
    const source = await prisma.product.findFirst({
      where: {
        id: productId,
        status: 'AVAILABLE',
        moderationStatus: 'APPROVED',
        archivedAt: null
      },
      select: {
        id: true,
        sellerId: true,
        categoryId: true,
        subcategoryId: true,
        commune: true,
        quartier: true,
        price: true
      }
    });
    if (!source) throw new ApiError(404, 'Annonce introuvable.', 'PRODUCT_NOT_FOUND');

    const candidates = await prisma.product.findMany({
      where: {
        id: { not: source.id },
        categoryId: source.categoryId,
        status: 'AVAILABLE',
        moderationStatus: 'APPROVED',
        archivedAt: null,
        stockQuantity: { gt: 0 }
      },
      orderBy: [{ publishedAt: 'desc' }, { id: 'desc' }],
      take: 80,
      select: productCardSelect
    });

    const ranked = rankSimilarProducts(source, candidates, limit);
    return ranked.map(toProductCardDto);
  },

  async mine(sellerId: string) {
    const products = await prisma.product.findMany({
      where: { sellerId, archivedAt: null },
      orderBy: { createdAt: 'desc' },
      select: productDetailSelect
    });
    return products.map((product) => ({
      ...toProductDetailDto(product),
      reservedQuantity: product.reservedQuantity
    }));
  }
};
