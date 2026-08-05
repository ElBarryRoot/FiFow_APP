import http from 'node:http';
import { createApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { connectDatabase, disconnectDatabase } from './config/prisma.js';
import { connectRedis, disconnectRedis } from './config/redis.js';
import { initializeSocket } from './socket.js';
import { startMaintenance, stopMaintenance } from './shared/maintenance.js';

async function bootstrap() {
  await connectDatabase();

  try {
    await connectRedis();
  } catch (error) {
    await disconnectRedis();
    logger.warn('Démarrage en mode dégradé sans Redis', {
      error: error instanceof Error ? error.message : String(error)
    });
  }

  const server = http.createServer(createApp());
  await initializeSocket(server);
  startMaintenance();
  server.listen(env.PORT, () => {
    logger.info('Fi Fow API v2 démarrée', {
      port: env.PORT,
      environment: env.NODE_ENV
    });
  });

  let shuttingDown = false;
  const shutdown = async (signal: NodeJS.Signals) => {
    if (shuttingDown) return;
    shuttingDown = true;
    stopMaintenance();
    logger.info('Arrêt propre de Fi Fow', { signal });

    const forceExit = setTimeout(() => {
      logger.error('Arrêt forcé après expiration du délai');
      process.exit(1);
    }, 10_000);
    forceExit.unref();

    server.close(async () => {
      await Promise.allSettled([disconnectRedis(), disconnectDatabase()]);
      clearTimeout(forceExit);
      process.exit(0);
    });
  };

  process.once('SIGTERM', () => void shutdown('SIGTERM'));
  process.once('SIGINT', () => void shutdown('SIGINT'));
}

bootstrap().catch((error: unknown) => {
  logger.error('Impossible de démarrer Fi Fow API v2', {
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined
  });
  process.exit(1);
});
