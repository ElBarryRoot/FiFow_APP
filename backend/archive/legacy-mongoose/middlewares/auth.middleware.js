import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { ApiError } from '../utils/apiError.js';
import { User } from '../modules/users/user.model.js';

export async function authenticate(req, _res, next) {
  try {
    const header = req.headers.authorization || '';
    const [scheme, token] = header.split(' ');

    if (scheme !== 'Bearer' || !token) {
      throw new ApiError(401, 'Authentification requise.', 'AUTH_REQUIRED');
    }

    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET);
    const user = await User.findById(payload.sub).select('+refreshTokenHash');

    if (!user || user.status === 'DELETED') {
      throw new ApiError(401, 'Compte introuvable ou désactivé.', 'ACCOUNT_NOT_AVAILABLE');
    }

    if (user.status === 'BANNED') {
      throw new ApiError(403, 'Compte banni.', 'ACCOUNT_BANNED');
    }

    req.user = user;
    return next();
  } catch (error) {
    if (error instanceof ApiError) return next(error);
    return next(new ApiError(401, 'Token invalide ou expiré.', 'INVALID_TOKEN'));
  }
}
