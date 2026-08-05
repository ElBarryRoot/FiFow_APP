import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { successResponse } from '../../utils/apiResponse.js';
import { Favorite } from './favorite.model.js';

const router = Router();

router.get('/favorites', authenticate, asyncHandler(async (req, res) => {
  const favorites = await Favorite.find({ userId: req.user._id })
    .populate({
      path: 'productId',
      match: { status: 'AVAILABLE', moderationStatus: 'APPROVED', archivedAt: null, deletedAt: null },
      populate: [
        { path: 'images' },
        { path: 'sellerId', select: 'fullName commune quartier avatarUrl isVerifiedSeller averageRating totalReviews' }
      ]
    })
    .sort({ createdAt: -1 });

  const visibleFavorites = favorites.filter((favorite) => favorite.productId);
  return successResponse(res, { message: 'Mes favoris.', data: visibleFavorites });
}));

export default router;
