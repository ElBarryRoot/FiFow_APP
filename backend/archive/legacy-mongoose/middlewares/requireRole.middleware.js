import { ApiError } from '../utils/apiError.js';

export function requireRole(...allowedRoles) {
  return (req, _res, next) => {
    if (!req.user) return next(new ApiError(401, 'Authentification requise.', 'AUTH_REQUIRED'));
    if (!allowedRoles.includes(req.user.role)) {
      return next(new ApiError(403, 'Accès refusé.', 'ROLE_FORBIDDEN'));
    }
    return next();
  };
}

export const requireAdminRole = requireRole('MODERATOR', 'ADMIN', 'SUPER_ADMIN');
export const requireSuperAdmin = requireRole('SUPER_ADMIN');
