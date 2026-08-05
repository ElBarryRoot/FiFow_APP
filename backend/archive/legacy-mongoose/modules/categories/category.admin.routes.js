import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireAdminRole } from '../../middlewares/requireRole.middleware.js';
import { validateObjectId } from '../../middlewares/validateObjectId.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { createCategorySchema, updateCategorySchema } from './category.validator.js';
import * as controller from './category.controller.js';

const router = Router();

router.post('/', authenticate, requireAdminRole, validate(createCategorySchema), controller.createCategory);
router.patch('/:id', authenticate, requireAdminRole, validateObjectId('id'), validate(updateCategorySchema), controller.updateCategory);
router.patch('/:id/archive', authenticate, requireAdminRole, validateObjectId('id'), controller.archiveCategory);

export default router;
