import { ApiError } from '../../utils/apiError.js';
import { Order } from './order.model.js';

export async function orderParticipant(req, _res, next) {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return next(new ApiError(404, 'Commande introuvable.', 'ORDER_NOT_FOUND'));

    const userId = req.user._id.toString();
    const isParticipant = order.buyerId.toString() === userId || order.sellerId.toString() === userId;
    const isAdmin = ['MODERATOR', 'ADMIN', 'SUPER_ADMIN'].includes(req.user.role);
    if (!isParticipant && !isAdmin) return next(new ApiError(403, 'Accès interdit à cette commande.', 'ORDER_FORBIDDEN'));

    req.order = order;
    return next();
  } catch (error) {
    return next(error);
  }
}
