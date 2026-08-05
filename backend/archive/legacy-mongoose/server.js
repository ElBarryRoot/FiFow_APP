import http from 'http';
import { createApp } from './app.js';
import { connectDatabase } from './config/database.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import { initializeSocket } from './sockets/index.js';

async function bootstrap() {
  await connectDatabase();
  const app = createApp();
  const server = http.createServer(app);
  initializeSocket(server, app);

  server.listen(env.PORT, () => {
    logger.info(`Fi Fow API démarrée sur le port ${env.PORT}`);
  });

  const shutdown = async (signal) => {
    logger.warn(`Signal reçu: ${signal}. Arrêt propre...`);
    server.close(() => process.exit(0));
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

bootstrap().catch((error) => {
  logger.error('Impossible de démarrer le serveur', { error: error.message, stack: error.stack });
  process.exit(1);
});
