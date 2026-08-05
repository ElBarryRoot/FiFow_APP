import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { createReportSchema } from './report.validator.js';
import { createReport } from './report.controller.js';

const router = Router();

router.post('/', authenticate, validate(createReportSchema), createReport);

export default router;
