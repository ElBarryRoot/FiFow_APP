import { ApiError } from '../utils/apiError.js';

export function validate(schema) {
  return (req, _res, next) => {
    const result = schema.safeParse({ body: req.body, params: req.params, query: req.query });
    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message
      }));
      return next(new ApiError(400, 'Validation échouée.', 'VALIDATION_ERROR', details));
    }
    req.validated = result.data;
    return next();
  };
}
