import type { Server as HttpServer } from 'node:http';
import { createAdapter } from '@socket.io/redis-adapter';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { prisma } from './config/prisma.js';
import { getRedis } from './config/redis.js';
import { verifyAccessToken } from './modules/auth/token.service.js';
import { setRealtimeServer } from './shared/realtime.js';

type SocketCallback = (result: { success: boolean; errorCode?: string }) => void;
type ClientSocket = {
  handshake: {
    headers: { authorization?: string };
    auth: Record<string, unknown>;
  };
  data: Record<string, unknown>;
  join(room: string): Promise<void>;
  leave(room: string): Promise<void>;
  disconnect(close?: boolean): void;
  to(room: string): { emit(event: string, payload: unknown): void };
  on(
    event: string,
    listener: (payload: unknown, callback?: SocketCallback) => void | Promise<void>
  ): void;
};
type SocketServer = {
  use(
    middleware: (socket: ClientSocket, next: (error?: Error) => void) => void | Promise<void>
  ): void;
  on(event: 'connection', listener: (socket: ClientSocket) => void): void;
  adapter(adapter: unknown): void;
  to(room: string): { emit(event: string, payload: unknown): void };
};
type SocketServerConstructor = new (
  server: HttpServer,
  options: Record<string, unknown>
) => SocketServer;

function conversationPayload(payload: unknown) {
  if (!payload || typeof payload !== 'object' || !('conversationId' in payload)) return null;
  const conversationId = String(payload.conversationId);
  if (!/^[0-9a-f-]{36}$/i.test(conversationId)) return null;
  if ('isTyping' in payload && typeof payload.isTyping !== 'boolean') return null;
  return { conversationId, isTyping: 'isTyping' in payload ? payload.isTyping : true };
}

export async function initializeSocket(server: HttpServer) {
  let Server: SocketServerConstructor;
  try {
    const packageName = 'socket.io';
    const loaded = (await import(packageName)) as unknown as { Server: SocketServerConstructor };
    Server = loaded.Server;
  } catch {
    logger.warn('Socket.IO non installé: temps réel désactivé');
    return;
  }

  const io = new Server(server, {
    cors: { origin: env.CORS_ORIGINS, credentials: true },
    transports: ['websocket', 'polling'],
    maxHttpBufferSize: 100_000
  });
  try {
    const publisher = getRedis();
    if (publisher.status === 'ready') {
      const subscriber = publisher.duplicate();
      await subscriber.connect();
      io.adapter(createAdapter(publisher, subscriber));
    }
  } catch (error) {
    logger.warn('Socket.IO sans adaptateur Redis', {
      error: error instanceof Error ? error.message : String(error)
    });
  }
  io.use(async (socket, next) => {
    try {
      const header = socket.handshake.headers.authorization;
      const token =
        (typeof socket.handshake.auth['token'] === 'string'
          ? socket.handshake.auth['token']
          : undefined) ??
        (header?.startsWith('Bearer ') ? header.slice(7) : undefined);
      if (!token) return next(new Error('AUTH_REQUIRED'));
      const claims = verifyAccessToken(token);
      const session = await prisma.session.findFirst({
        where: {
          id: claims.sessionId,
          userId: claims.userId,
          revokedAt: null,
          expiresAt: { gt: new Date() },
          user: { status: 'ACTIVE' }
        },
        select: { id: true }
      });
      if (!session) return next(new Error('SESSION_NOT_AVAILABLE'));
      socket.data['userId'] = claims.userId;
      socket.data['sessionId'] = claims.sessionId;
      socket.data['accessExpiresAt'] = claims.expiresAt;
      return next();
    } catch {
      return next(new Error('INVALID_TOKEN'));
    }
  });
  io.on('connection', (socket) => {
    const userId = socket.data['userId'] as string;
    const sessionId = socket.data['sessionId'] as string;
    const accessExpiresAt = socket.data['accessExpiresAt'] as number;
    const joinedConversations = new Set<string>();
    let lastTypingAt = 0;
    const expiryTimer = setTimeout(
      () => socket.disconnect(true),
      Math.max(0, accessExpiresAt - Date.now())
    );
    const sessionAudit = setInterval(async () => {
      try {
        const session = await prisma.session.findFirst({
          where: { id: sessionId, userId, revokedAt: null, expiresAt: { gt: new Date() } },
          select: { id: true }
        });
        if (!session) socket.disconnect(true);
      } catch {
        socket.disconnect(true);
      }
    }, 60_000);
    void socket.join(`user:${userId}`);
    socket.on('conversation:join', async (payload, callback) => {
      try {
        const parsed = conversationPayload(payload);
        if (!parsed) return callback?.({ success: false, errorCode: 'INVALID_PAYLOAD' });
        const { conversationId } = parsed;
        const allowed = await prisma.conversation.findFirst({
          where: { id: conversationId, OR: [{ buyerId: userId }, { sellerId: userId }] },
          select: { id: true }
        });
        if (!allowed) return callback?.({ success: false, errorCode: 'CONVERSATION_FORBIDDEN' });
        await socket.join(`conversation:${conversationId}`);
        joinedConversations.add(conversationId);
        return callback?.({ success: true });
      } catch {
        return callback?.({ success: false, errorCode: 'JOIN_FAILED' });
      }
    });
    socket.on('conversation:leave', async (payload, callback) => {
      const parsed = conversationPayload(payload);
      if (!parsed) return callback?.({ success: false, errorCode: 'INVALID_PAYLOAD' });
      joinedConversations.delete(parsed.conversationId);
      await socket.leave(`conversation:${parsed.conversationId}`);
      return callback?.({ success: true });
    });
    socket.on('conversation:typing', (payload) => {
      const parsed = conversationPayload(payload);
      if (!parsed) return;
      const { conversationId, isTyping } = parsed;
      if (!joinedConversations.has(conversationId)) return;
      const now = Date.now();
      if (isTyping && now - lastTypingAt < 400) return;
      lastTypingAt = now;
      socket.to(`conversation:${conversationId}`).emit('conversation:typing', {
        conversationId,
        userId,
        isTyping
      });
    });
    socket.on('disconnect', () => {
      clearTimeout(expiryTimer);
      clearInterval(sessionAudit);
      joinedConversations.clear();
    });
  });
  setRealtimeServer(io);
}
