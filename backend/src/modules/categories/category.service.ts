import { prisma } from '../../config/prisma.js';
import { ApiError } from '../../shared/errors/api-error.js';
import { toCategoryDto } from './category.dto.js';

export const categoryService = {
  async listTree() {
    const categories = await prisma.category.findMany({
      where: {
        parentId: null,
        isActive: true,
        archivedAt: null
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        iconKey: true,
        imageKey: true,
        children: {
          where: { isActive: true, archivedAt: null },
          orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            iconKey: true,
            imageKey: true
          }
        }
      }
    });
    return categories.map(toCategoryDto);
  },

  async detail(slug: string) {
    const category = await prisma.category.findFirst({
      where: { slug, isActive: true, archivedAt: null },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        iconKey: true,
        imageKey: true,
        children: {
          where: { isActive: true, archivedAt: null },
          orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            iconKey: true,
            imageKey: true
          }
        }
      }
    });
    if (!category) throw new ApiError(404, 'Catégorie introuvable.', 'CATEGORY_NOT_FOUND');
    return toCategoryDto(category);
  }
};
