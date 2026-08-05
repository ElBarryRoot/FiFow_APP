import type { Request, Response } from 'express';
import { sendSuccess } from '../../shared/http/api-response.js';
import { categoryService } from './category.service.js';

export const categoryController = {
  async list(_request: Request, response: Response) {
    return sendSuccess(response, {
      data: await categoryService.listTree(),
      message: 'Catégories chargées.'
    });
  },
  async detail(request: Request, response: Response) {
    const slug = request.params['slug'];
    if (typeof slug !== 'string') {
      throw new Error('Paramètre de catégorie absent.');
    }
    return sendSuccess(response, {
      data: await categoryService.detail(slug),
      message: 'Catégorie chargée.'
    });
  }
};
