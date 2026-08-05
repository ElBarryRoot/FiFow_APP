import { createHash } from 'node:crypto';
import type { Request, Response } from 'express';
import { sendSuccess } from '../../shared/http/api-response.js';
import { interactionService } from './interaction.service.js';

function productId(request: Request) {
  return (request.validated as { params: { productId: string } }).params.productId;
}

export const interactionController = {
  async favorite(request: Request, response: Response) {
    await interactionService.favorite(request.auth!.userId, productId(request));
    return sendSuccess(response, { data: null, message: 'Annonce ajoutée aux favoris.' });
  },
  async unfavorite(request: Request, response: Response) {
    await interactionService.unfavorite(request.auth!.userId, productId(request));
    return sendSuccess(response, { data: null, message: 'Annonce retirée des favoris.' });
  },
  async like(request: Request, response: Response) {
    await interactionService.like(request.auth!.userId, productId(request));
    return sendSuccess(response, { data: null, message: 'Annonce aimée.' });
  },
  async unlike(request: Request, response: Response) {
    await interactionService.unlike(request.auth!.userId, productId(request));
    return sendSuccess(response, { data: null, message: 'Mention retirée.' });
  },
  async view(request: Request, response: Response) {
    const userAgent = request.get('user-agent') ?? '';
    const ipHash = createHash('sha256').update(request.ip ?? 'unknown').digest('hex');
    const visitorKey = request.auth?.userId ?? createHash('sha256').update(`${ipHash}:${userAgent}`).digest('hex');
    await interactionService.recordView(productId(request), visitorKey, {
      ...(request.auth ? { userId: request.auth.userId } : {}),
      ipHash,
      userAgent
    });
    return sendSuccess(response, { data: null, message: 'Vue enregistrée.' });
  },
  async favorites(request: Request, response: Response) {
    return sendSuccess(response, {
      data: await interactionService.favorites(request.auth!.userId),
      message: 'Favoris chargés.'
    });
  },
  async likes(request: Request, response: Response) {
    return sendSuccess(response, {
      data: await interactionService.likes(request.auth!.userId),
      message: 'Mentions chargées.'
    });
  }
};
