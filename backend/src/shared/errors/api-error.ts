export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly errorCode = 'INTERNAL_ERROR',
    public readonly details: ReadonlyArray<{ field?: string; message: string }> = []
  ) {
    super(message);
    this.name = 'ApiError';
    Error.captureStackTrace(this, ApiError);
  }
}
