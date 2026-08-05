import { Router } from 'express';
import { prisma } from '../../config/prisma.js';
import { verificationDocuments } from '../../http/middlewares/image-upload.middleware.js';
import { ApiError } from '../../shared/errors/api-error.js';
import { asyncHandler } from '../../shared/http/async-handler.js';
import { sendSuccess } from '../../shared/http/api-response.js';
import { getStorage } from '../../shared/storage/storage.service.js';
import type { StoredImage } from '../../shared/storage/storage.types.js';
import { authenticate, requireVerifiedEmail } from '../auth/auth.middleware.js';

export const sellerVerificationRoutes = Router();
sellerVerificationRoutes.use(authenticate, requireVerifiedEmail);

sellerVerificationRoutes.post('/request', verificationDocuments, asyncHandler(async (request, response) => {
  const files = request.files as Express.Multer.File[] | undefined;
  if (!files || files.length < 1) {
    throw new ApiError(400, 'Au moins un justificatif est requis.', 'VERIFICATION_DOCUMENT_REQUIRED');
  }
  const note = typeof request.body.note === 'string' ? request.body.note.trim() : undefined;
  if (note && note.length > 1_000) throw new ApiError(400, 'Note trop longue.', 'INVALID_NOTE');
  const existing = await prisma.sellerVerification.findUnique({
    where: { userId: request.auth!.userId },
    select: { status: true, documentKeys: true }
  });
  if (existing?.status === 'PENDING' || existing?.status === 'APPROVED') {
    throw new ApiError(409, 'Une vérification est déjà active.', 'VERIFICATION_ALREADY_ACTIVE');
  }
  const stored: StoredImage[] = [];
  try {
    for (const file of files) {
      stored.push(await getStorage().saveImage({
        buffer: file.buffer,
        namespace: `seller-verifications/${request.auth!.userId}`
      }));
    }
    const verification = await prisma.$transaction(async (tx) => {
      const row = await tx.sellerVerification.upsert({
        where: { userId: request.auth!.userId },
        update: {
          status: 'PENDING',
          documentKeys: stored.map((item) => item.key),
          ...(note ? { note } : {}),
          rejectionReason: null,
          reviewedById: null,
          reviewedAt: null,
          requestedAt: new Date()
        },
        create: {
          userId: request.auth!.userId,
          documentKeys: stored.map((item) => item.key),
          ...(note ? { note } : {})
        }
      });
      await tx.user.update({
        where: { id: request.auth!.userId },
        data: { sellerVerificationStatus: 'PENDING' }
      });
      return row;
    });
    if (existing?.documentKeys.length) {
      await Promise.allSettled(existing.documentKeys.map((key) => getStorage().delete(key)));
    }
    return sendSuccess(response, {
      statusCode: 201,
      data: { ...verification, documentKeys: undefined, documentCount: stored.length },
      message: 'Demande de vérification transmise.'
    });
  } catch (error) {
    await Promise.allSettled(stored.map((item) => getStorage().delete(item.key)));
    throw error;
  }
}));

sellerVerificationRoutes.get('/me', asyncHandler(async (request, response) => {
  const row = await prisma.sellerVerification.findUnique({
    where: { userId: request.auth!.userId },
    select: {
      id: true,
      status: true,
      note: true,
      rejectionReason: true,
      requestedAt: true,
      reviewedAt: true,
      documentKeys: true
    }
  });
  return sendSuccess(response, {
    data: row ? { ...row, documentCount: row.documentKeys.length, documentKeys: undefined } : null
  });
}));
