import mongoose from 'mongoose';
import { ApiError } from '../utils/apiError.js';

export function validateObjectId(paramName = 'id') {
  return (req, _res, next) => {
    const value = req.params[paramName];
    if (!mongoose.Types.ObjectId.isValid(value)) {
      return next(new ApiError(400, `Identifiant ${paramName} invalide.`, 'INVALID_OBJECT_ID'));
    }
    return next();
  };
}
