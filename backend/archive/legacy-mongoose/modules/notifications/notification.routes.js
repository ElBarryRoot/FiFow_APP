import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { listNotifications, markAllNotificationsRead, markNotificationRead } from './notification.controller.js';
import { listNotificationsSchema, notificationIdSchema } from './notification.validator.js';

const router = Router();

router.get('/', authenticate, validate(listNotificationsSchema), listNotifications);
router.patch('/read-all', authenticate, markAllNotificationsRead);
router.patch('/:id/read', authenticate, validate(notificationIdSchema), markNotificationRead);

export default router;
