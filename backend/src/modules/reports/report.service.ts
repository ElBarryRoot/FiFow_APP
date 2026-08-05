import type { ReportPriority, ReportReason, ReportTargetType } from '@prisma/client';
import { prisma } from '../../config/prisma.js';
import { ApiError } from '../../shared/errors/api-error.js';

function priority(reason: ReportReason): ReportPriority {
  if (['SCAM', 'FORBIDDEN_PRODUCT', 'PAYMENT_ISSUE'].includes(reason)) return 'HIGH';
  if (['OFFENSIVE_CONTENT', 'FAKE_PRODUCT', 'DELIVERY_ISSUE'].includes(reason)) return 'HIGH';
  return 'MEDIUM';
}

async function ensureTarget(type: ReportTargetType, id: string, reporterId: string) {
  const found =
    type === 'PRODUCT'
      ? await prisma.product.findFirst({
          where: { id, sellerId: { not: reporterId }, status: { not: 'DRAFT' } },
          select: { id: true }
        })
      : type === 'USER'
        ? await prisma.user.findUnique({ where: { id }, select: { id: true } })
        : type === 'MESSAGE'
          ? await prisma.message.findFirst({
              where: {
                id,
                conversation: { OR: [{ buyerId: reporterId }, { sellerId: reporterId }] }
              },
              select: { id: true }
            })
          : type === 'REVIEW'
            ? await prisma.review.findFirst({
                where: { id, status: 'PUBLISHED', authorId: { not: reporterId } },
                select: { id: true }
              })
            : type === 'CONVERSATION'
              ? await prisma.conversation.findFirst({
                  where: { id, OR: [{ buyerId: reporterId }, { sellerId: reporterId }] },
                  select: { id: true }
                })
              : type === 'ORDER'
                ? await prisma.order.findFirst({
                    where: { id, OR: [{ buyerId: reporterId }, { sellerId: reporterId }] },
                    select: { id: true }
                  })
                : await prisma.payment.findFirst({
                    where: { id, userId: reporterId },
                    select: { id: true }
                  });
  if (!found) throw new ApiError(404, 'Cible du signalement introuvable.', 'REPORT_TARGET_NOT_FOUND');
}

async function threshold() {
  const setting = await prisma.appSetting.findUnique({
    where: { key: 'auto_hide_report_threshold' },
    select: { value: true }
  });
  return typeof setting?.value === 'number' ? setting.value : 5;
}

export const reportService = {
  async create(input: {
    reporterId: string;
    targetType: ReportTargetType;
    targetId: string;
    reason: ReportReason;
    description?: string;
  }) {
    if (input.targetType === 'USER' && input.targetId === input.reporterId) {
      throw new ApiError(400, 'Vous ne pouvez pas vous signaler.', 'SELF_REPORT_FORBIDDEN');
    }
    await ensureTarget(input.targetType, input.targetId, input.reporterId);
    const hideThreshold = await threshold();
    return prisma.$transaction(async (tx) => {
      const existing = await tx.report.findUnique({
        where: {
          reporterId_targetType_targetId: {
            reporterId: input.reporterId,
            targetType: input.targetType,
            targetId: input.targetId
          }
        },
        select: { id: true }
      });
      if (existing) throw new ApiError(409, 'Cette cible a déjà été signalée.', 'REPORT_ALREADY_EXISTS');
      const report = await tx.report.create({
        data: {
          reporterId: input.reporterId,
          targetType: input.targetType,
          targetId: input.targetId,
          reason: input.reason,
          ...(input.description ? { description: input.description } : {}),
          priority: priority(input.reason)
        }
      });
      if (input.targetType === 'PRODUCT') {
        const product = await tx.product.update({
          where: { id: input.targetId },
          data: { reportsCount: { increment: 1 } },
          select: { reportsCount: true }
        });
        if (product.reportsCount >= hideThreshold) {
          await tx.product.update({
            where: { id: input.targetId },
            data: { status: 'HIDDEN', moderationStatus: 'FLAGGED' }
          });
        }
      } else if (input.targetType === 'MESSAGE') {
        await tx.message.update({
          where: { id: input.targetId },
          data: { reportCount: { increment: 1 }, isReported: true }
        });
      } else if (input.targetType === 'REVIEW') {
        await tx.review.update({
          where: { id: input.targetId },
          data: { reportCount: { increment: 1 }, isReported: true }
        });
      } else if (input.targetType === 'CONVERSATION') {
        await tx.conversation.update({
          where: { id: input.targetId },
          data: { reportCount: { increment: 1 }, isReported: true, status: 'DISPUTED' }
        });
      }
      return report;
    });
  }
};
