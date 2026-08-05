import { Readable } from 'node:stream';
import { successResponse } from '../../utils/apiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiError } from '../../utils/apiError.js';
import { Product } from '../products/product.model.js';
import { ProductImage } from './productImage.model.js';
import { cloudinary, configureCloudinary } from '../../config/cloudinary.js';

function uploadBufferToCloudinary(file, folder = 'fi-fow/products') {
  return new Promise((resolve, reject) => {
    const isConfigured = configureCloudinary();
    if (!isConfigured) {
      return reject(new ApiError(500, 'Cloudinary n’est pas configuré.', 'CLOUDINARY_NOT_CONFIGURED'));
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'image', transformation: [{ quality: 'auto' }, { fetch_format: 'auto' }] },
      (error, result) => {
        if (error) return reject(error);
        return resolve(result);
      }
    );

    Readable.from(file.buffer).pipe(uploadStream);
  });
}

export const addProductImage = asyncHandler(async (req, res) => {
  const product = req.product;
  if (!req.file) throw new ApiError(400, 'Image obligatoire.', 'IMAGE_REQUIRED');
  if (['ARCHIVED', 'DELETED', 'SOLD'].includes(product.status)) {
    throw new ApiError(400, 'Impossible d’ajouter une image à ce produit.', 'PRODUCT_IMAGE_NOT_ALLOWED');
  }

  const existingCount = await ProductImage.countDocuments({ productId: product._id, archivedAt: null });
  if (existingCount >= 6) throw new ApiError(400, 'Maximum 6 images par produit.', 'MAX_PRODUCT_IMAGES_REACHED');

  const upload = await uploadBufferToCloudinary(req.file);
  const image = await ProductImage.create({
    productId: product._id,
    sellerId: req.user._id,
    url: upload.secure_url,
    publicId: upload.public_id,
    width: upload.width,
    height: upload.height,
    size: req.file.size,
    format: upload.format,
    isMain: existingCount === 0,
    sortOrder: existingCount,
    moderationStatus: 'APPROVED'
  });

  await Product.updateOne({ _id: product._id }, { $addToSet: { images: image._id } });
  return successResponse(res, { statusCode: 201, message: 'Image produit ajoutée.', data: image });
});

export const setMainProductImage = asyncHandler(async (req, res) => {
  const product = req.product;
  const image = await ProductImage.findOne({ _id: req.params.imageId, productId: product._id, archivedAt: null });
  if (!image) throw new ApiError(404, 'Image introuvable.', 'IMAGE_NOT_FOUND');

  await ProductImage.updateMany({ productId: product._id }, { isMain: false });
  image.isMain = true;
  await image.save();

  return successResponse(res, { message: 'Image principale mise à jour.', data: image });
});

export const reorderProductImages = asyncHandler(async (req, res) => {
  const product = req.product;
  const updates = req.validated.body.images;

  const bulkOps = updates.map((item) => ({
    updateOne: {
      filter: { _id: item.imageId, productId: product._id, archivedAt: null },
      update: { sortOrder: item.sortOrder }
    }
  }));

  if (bulkOps.length) await ProductImage.bulkWrite(bulkOps);
  const images = await ProductImage.find({ productId: product._id, archivedAt: null }).sort({ sortOrder: 1 });

  return successResponse(res, { message: 'Ordre des images mis à jour.', data: images });
});

export const archiveProductImage = asyncHandler(async (req, res) => {
  const product = req.product;
  const image = await ProductImage.findOne({ _id: req.params.imageId, productId: product._id, archivedAt: null });
  if (!image) throw new ApiError(404, 'Image introuvable.', 'IMAGE_NOT_FOUND');

  const visibleImagesCount = await ProductImage.countDocuments({ productId: product._id, archivedAt: null });
  if (visibleImagesCount <= 1) {
    throw new ApiError(400, 'Un produit doit garder au moins une image visible.', 'PRODUCT_REQUIRES_IMAGE');
  }

  const wasMain = image.isMain;
  image.archivedAt = new Date();
  image.moderationStatus = 'HIDDEN';
  image.isMain = false;
  await image.save();
  await Product.updateOne({ _id: product._id }, { $pull: { images: image._id } });

  if (wasMain) {
    const nextImage = await ProductImage.findOne({ productId: product._id, archivedAt: null }).sort({ sortOrder: 1 });
    if (nextImage) {
      nextImage.isMain = true;
      await nextImage.save();
    }
  }

  return successResponse(res, { message: 'Image archivée sans suppression définitive.', data: image });
});
