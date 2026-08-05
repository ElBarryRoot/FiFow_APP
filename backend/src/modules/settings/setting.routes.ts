import { Router } from 'express';
import { prisma } from '../../config/prisma.js';
import { asyncHandler } from '../../shared/http/async-handler.js';
import { sendSuccess } from '../../shared/http/api-response.js';

export const settingRoutes = Router();
settingRoutes.get('/', asyncHandler(async (_request, response) => {
  const rows = await prisma.appSetting.findMany({
    where: { isPublic: true, archivedAt: null },
    select: { key: true, value: true, valueType: true }
  });
  return sendSuccess(response, {
    data: Object.fromEntries(rows.map((row) => [row.key, row.value]))
  });
}));
