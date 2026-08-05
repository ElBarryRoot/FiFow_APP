import type { Response } from 'express';

type SuccessOptions<T> = {
  data: T;
  message?: string;
  meta?: Record<string, unknown>;
  statusCode?: number;
};

export function sendSuccess<T>(
  response: Response,
  { data, message = 'Opération effectuée avec succès.', meta, statusCode = 200 }: SuccessOptions<T>
) {
  return response.status(statusCode).json({
    success: true,
    message,
    data,
    ...(meta ? { meta } : {})
  });
}
