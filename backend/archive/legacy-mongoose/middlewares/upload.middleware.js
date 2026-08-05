import multer from 'multer';
import { ApiError } from '../utils/apiError.js';

const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];

const storage = multer.memoryStorage();

export const uploadImage = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter(_req, file, callback) {
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return callback(new ApiError(400, 'Format image non autorisé. Utilisez JPG, PNG ou WebP.', 'INVALID_IMAGE_FORMAT'));
    }
    return callback(null, true);
  }
});
