import { Router } from 'express';
import { categoryController } from '../../modules/categories/category.controller.js';
import { asyncHandler } from '../../shared/http/async-handler.js';

export const categoryRoutes = Router();

categoryRoutes.get('/', asyncHandler(categoryController.list));
categoryRoutes.get('/:slug', asyncHandler(categoryController.detail));
