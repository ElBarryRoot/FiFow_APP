import { randomUUID } from 'node:crypto';
import type { RequestHandler } from 'express';

const REQUEST_ID_PATTERN = /^[a-zA-Z0-9._:-]{8,80}$/;

export const requestId: RequestHandler = (request, response, next) => {
  const incoming = request.header('x-request-id');
  request.requestId = incoming && REQUEST_ID_PATTERN.test(incoming) ? incoming : randomUUID();
  response.setHeader('x-request-id', request.requestId);
  next();
};
