import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireAdminRole } from '../../middlewares/requireRole.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { getSettings, patchSetting } from './settings.controller.js';
import { updateSettingSchema } from './settings.validator.js';

const router = Router();
router.use(authenticate, requireAdminRole);
router.get('/', getSettings);
router.patch('/:key', validate(updateSettingSchema), patchSetting);
export default router;
