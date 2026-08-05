import type { RequestHandler } from 'express';
import multer from 'multer';
import { env } from '../../config/env.js';
import { ApiError } from '../../shared/errors/api-error.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: env.MAX_IMAGE_BYTES,
    files: 1,
    fields: 0
  },
  fileFilter: (_request, file, callback) => {
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'].includes(file.mimetype)) {
      callback(new ApiError(400, 'Format d’image non pris en charge.', 'UNSUPPORTED_IMAGE_TYPE'));
      return;
    }
    callback(null, true);
  }
});

export const singleImage: RequestHandler = (request, response, next) => {
  upload.single('image')(request, response, (error: unknown) => {
    if (error instanceof multer.MulterError) {
      return next(
        new ApiError(
          400,
          error.code === 'LIMIT_FILE_SIZE' ? 'Image trop volumineuse.' : 'Envoi d’image invalide.',
          error.code
        )
      );
    }
    return next(error);
  });
};

const verificationUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.MAX_IMAGE_BYTES, files: 3, fields: 2 },
  fileFilter: (_request, file, callback) => {
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'].includes(file.mimetype)) {
      callback(new ApiError(400, 'Format de justificatif non pris en charge.', 'UNSUPPORTED_IMAGE_TYPE'));
      return;
    }
    callback(null, true);
  }
});

export const verificationDocuments: RequestHandler = (request, response, next) => {
  verificationUpload.array('documents', 3)(request, response, (error: unknown) => {
    if (error instanceof multer.MulterError) {
      return next(new ApiError(400, 'Envoi des justificatifs invalide.', error.code));
    }
    return next(error);
  });
};
