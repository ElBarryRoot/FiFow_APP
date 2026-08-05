import { Redis } from 'ioredis';
import { env } from './env.js';
import { logger } from './logger.js';

let redis: Redis | null = null;

export function getRedis() {
  if (redis) return redis;

  redis = new Redis(env.REDIS_URL, {
    lazyConnect: true,
    enableOfflineQueue: false,
    maxRetriesPerRequest: 1,
    retryStrategy(times) {
      return Math.min(times * 200, 2000);
    }
  });

  redis.on('error', (error) => {
    logger.warn('Redis indisponible', { error: error.message });
  });

  return redis;
}

export async function connectRedis() {
  const client = getRedis();
  if (client.status === 'wait') await client.connect();
  await client.ping();
}

export async function isRedisHealthy() {
  if (!redis || redis.status !== 'ready') return false;
  try {
    return (await redis.ping()) === 'PONG';
  } catch {
    return false;
  }
}

export async function disconnectRedis() {
  if (!redis) return;
  if (redis.status === 'ready') await redis.quit();
  else redis.disconnect();
  redis = null;
}
