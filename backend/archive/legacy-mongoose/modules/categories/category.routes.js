import { Router } from 'express';
import { validate } from '../../middlewares/validate.middleware.js';
import { listCategoriesSchema } from './category.validator.js';
import * as controller from './category.controller.js';

const router = Router();

router.get('/', validate(listCategoriesSchema), controller.listCategories);
router.get('/:slug', controller.getCategoryBySlug);

export default router;
