import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env, corsOrigins, isProduction } from '../config/env.js';
import { User } from '../modules/users/user.model.js';
import { Conversation } from '../modules/conversations/conversation.model.js';
import { logger } from '../utils/logger.js';

export function initializeSocket(server, app) {
  const io = new Server(server, {
    cors: {
      origin: isProduction ? corsOrigins : '*',
      credentials: true
    },
    transports: ['websocket', 'polling']
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace('Bearer ', '');
      if (!token) return next(new Error('AUTH_REQUIRED'));

      const payload = jwt.verify(token, env.JWT_ACCESS_SECRET);
      const user = await User.findById(payload.sub);
      if (!user || ['BANNED', 'DELETED'].includes(user.status)) return next(new Error('ACCOUNT_NOT_ALLOWED'));

      socket.user = user;
      return next();
    } catch {
      return next(new Error('INVALID_TOKEN'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user._id.toString();
    socket.join(`user:${userId}`);
    logger.info('Socket connecté', { userId, socketId: socket.id });

    socket.on('conversation:join', async ({ conversationId }, callback) => {
      try {
        const conversation = await Conversation.findById(conversationId);
        const allowed = conversation?.participants?.some((id) => id.toString() === userId);
        if (!allowed) throw new Error('CONVERSATION_FORBIDDEN');
        socket.join(`conversation:${conversationId}`);
        callback?.({ success: true });
      } catch (error) {
        callback?.({ success: false, message: error.message });
      }
    });

    socket.on('conversation:typing', async ({ conversationId, isTyping = true }) => {
      const conversation = await Conversation.findById(conversationId).select('participants');
      const allowed = conversation?.participants?.some((id) => id.toString() === userId);
      if (!allowed) return;
      socket.to(`conversation:${conversationId}`).emit('conversation:typing', { conversationId, userId, isTyping });
    });

    socket.on('disconnect', () => {
      logger.info('Socket déconnecté', { userId, socketId: socket.id });
    });
  });

  app.set('io', io);
  return io;
}
