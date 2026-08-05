import { getStorage } from '../../shared/storage/storage.service.js';

type CategoryItem = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  iconKey: string | null;
  imageKey: string | null;
  children?: CategoryItem[];
};

export type CategoryDto = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  iconUrl: string | null;
  imageUrl: string | null;
  children: CategoryDto[];
};

export function toCategoryDto(category: CategoryItem): CategoryDto {
  const storage = getStorage();
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description,
    iconUrl: category.iconKey ? storage.publicUrl(category.iconKey) : null,
    imageUrl: category.imageKey ? storage.publicUrl(category.imageKey) : null,
    children: category.children?.map(toCategoryDto) ?? []
  };
}
