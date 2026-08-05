import type { NotificationType, Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma.js';

type DbClient = Prisma.TransactionClient | typeof prisma;

export async function createNotification(
  input: {
    userId: string;
    type: NotificationType;
    title: string;
    body: string;
    data?: Prisma.InputJsonValue;
  },
  db: DbClient = prisma
) {
  return db.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: input.title,
      body: input.body,
      ...(input.data !== undefined ? { data: input.data } : {})
    }
  });
}

export const notificationService = {
  async list(userId: string, cursor?: string, limit = 30) {
    const [rows, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId, archivedAt: null },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        take: limit + 1,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {})
      }),
      prisma.notification.count({ where: { userId, archivedAt: null, readAt: null } })
    ]);
    const hasNextPage = rows.length > limit;
    const items = hasNextPage ? rows.slice(0, limit) : rows;
    return { items, nextCursor: hasNextPage ? items.at(-1)?.id ?? null : null, unreadCount };
  },
  markRead(userId: string, id: string) {
    return prisma.notification.updateMany({
      where: { id, userId, archivedAt: null, readAt: null },
      data: { readAt: new Date() }
    });
  },
  markAllRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, archivedAt: null, readAt: null },
      data: { readAt: new Date() }
    });
  }
};
