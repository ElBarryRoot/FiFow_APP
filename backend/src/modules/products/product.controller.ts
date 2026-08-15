import type { Request, Response } from 'express';
import { ApiError } from '../../shared/errors/api-error.js';
import { sendSuccess } from '../../shared/http/api-response.js';
import type { CreateProductInput, ListProductsInput, UpdateProductInput } from './product.schemas.js';
import { productService } from './product.service.js';

function validated<T>(request: Request) {
  return request.validated as T;
}

export const productController = {
  async create(request: Request, response: Response) {
    const { body } = validated<{ body: CreateProductInput }>(request);
    return sendSuccess(response, {
      statusCode: 201,
      data: await productService.create(request.auth!.userId, body),
      message: 'Brouillon créé.'
    });
  },

  async update(request: Request, response: Response) {
    const { body, params } = validated<{
      body: UpdateProductInput;
      params: { productId: string };
    }>(request);
    return sendSuccess(response, {
      data: await productService.update(request.auth!.userId, params.productId, body),
      message: 'Brouillon mis à jour.'
    });
  },

  async updateStock(request: Request, response: Response) {
    const { params, body } = request.validated as {
      params: { productId: string };
      body: { stockQuantity: number };
    };
    return sendSuccess(response, {
      data: await productService.updateStock(request.auth!.userId, params.productId, body),
      message: 'Stock mis à jour.'
    });
  },

  async addImage(request: Request, response: Response) {
    const { params } = validated<{ params: { productId: string } }>(request);
    if (!request.file) throw new ApiError(400, 'Image requise.', 'IMAGE_REQUIRED');
    return sendSuccess(response, {
      statusCode: 201,
      data: await productService.addImage(request.auth!.userId, params.productId, request.file.buffer),
      message: 'Image ajoutée.'
    });
  },

  async deleteImage(request: Request, response: Response) {
    const { params } = validated<{ params: { productId: string; imageId: string } }>(request);
    await productService.deleteImage(request.auth!.userId, params.productId, params.imageId);
    return sendSuccess(response, { data: null, message: 'Image supprimée.' });
  },

  async setMainImage(request: Request, response: Response) {
    const { params } = validated<{ params: { productId: string; imageId: string } }>(request);
    await productService.setMainImage(request.auth!.userId, params.productId, params.imageId);
    return sendSuccess(response, { data: null, message: 'Image principale mise à jour.' });
  },

  async reorderImages(request: Request, response: Response) {
    const { params, body } = validated<{
      params: { productId: string };
      body: { imageIds: string[] };
    }>(request);
    await productService.reorderImages(request.auth!.userId, params.productId, body.imageIds);
    return sendSuccess(response, { data: null, message: 'Ordre des images mis à jour.' });
  },

  async archive(request: Request, response: Response) {
    const { params } = validated<{ params: { productId: string } }>(request);
    await productService.archive(request.auth!.userId, params.productId);
    return sendSuccess(response, { data: null, message: 'Annonce archivée.' });
  },

  async stats(request: Request, response: Response) {
    const { params } = validated<{ params: { productId: string } }>(request);
    return sendSuccess(response, {
      data: await productService.stats(request.auth!.userId, params.productId),
      message: 'Statistiques chargées.'
    });
  },

  async publish(request: Request, response: Response) {
    const { params } = validated<{ params: { productId: string } }>(request);
    return sendSuccess(response, {
      data: await productService.publish(request.auth!.userId, params.productId),
      message: 'Annonce soumise avec succès.'
    });
  },

  async list(request: Request, response: Response) {
    const { query } = validated<{ query: ListProductsInput }>(request);
    const result = await productService.list(query);
    return sendSuccess(response, {
      data: result.items,
      meta: { nextCursor: result.nextCursor },
      message: 'Annonces chargées.'
    });
  },

  async detail(request: Request, response: Response) {
    const { params } = validated<{ params: { slug: string } }>(request);
    return sendSuccess(response, {
      data: await productService.detail(params.slug),
      message: 'Annonce chargée.'
    });
  },

  async similar(request: Request, response: Response) {
    const { params, query } = validated<{
      params: { productId: string };
      query: { limit: number };
    }>(request);
    return sendSuccess(response, {
      data: await productService.similar(params.productId, query.limit),
      message: 'Suggestions chargées.'
    });
  },

  async mine(request: Request, response: Response) {
    return sendSuccess(response, {
      data: await productService.mine(request.auth!.userId),
      message: 'Vos annonces ont été chargées.'
    });
  }
};
