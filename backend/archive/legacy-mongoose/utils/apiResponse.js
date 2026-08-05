export function successResponse(res, { statusCode = 200, message = 'Opération effectuée avec succès.', data = null, meta = null }) {
  const payload = { success: true, message, data };
  if (meta) payload.meta = meta;
  return res.status(statusCode).json(payload);
}

export function errorResponse(res, { statusCode = 500, message = 'Une erreur est survenue.', errorCode = 'INTERNAL_ERROR', details = [] }) {
  return res.status(statusCode).json({ success: false, message, errorCode, details });
}
