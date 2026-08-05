import { Router } from 'express';
import { prisma } from '../../config/prisma.js';
import { isProduction } from '../../config/env.js';
import { isRedisHealthy } from '../../config/redis.js';
import { asyncHandler } from '../../shared/http/async-handler.js';
import { sendSuccess } from '../../shared/http/api-response.js';

export const healthRoutes = Router();

healthRoutes.get('/live', (request, response) => {
  sendSuccess(response, {
    message: 'Processus Fi Fow opérationnel.',
    data: {
      status: 'UP',
      requestId: request.requestId,
      uptimeSeconds: Math.round(process.uptime()),
      timestamp: new Date().toISOString()
    }
  });
});

healthRoutes.get(
  '/ready',
  asyncHandler(async (request, response) => {
    const checks = { database: false, redis: false };

    try {
      await prisma.$queryRaw`SELECT 1`;
      checks.database = true;
    } catch {
      checks.database = false;
    }

    checks.redis = await isRedisHealthy();

    const ready = checks.database && (!isProduction || checks.redis);
    const status = !ready ? 'NOT_READY' : checks.redis ? 'READY' : 'DEGRADED';
    return sendSuccess(response, {
      statusCode: ready ? 200 : 503,
      message:
        status === 'READY'
          ? 'API prête à recevoir du trafic.'
          : status === 'DEGRADED'
            ? 'API disponible sans les fonctions Redis.'
            : 'API temporairement indisponible.',
      data: {
        status,
        checks,
        requestId: request.requestId,
        timestamp: new Date().toISOString()
      }
    });
  })
);
