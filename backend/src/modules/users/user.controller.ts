import type { Request, Response } from 'express';
import { ApiError } from '../../shared/errors/api-error.js';
import { sendSuccess } from '../../shared/http/api-response.js';
import type { UpdateProfileInput } from './user.schemas.js';
import { userService } from './user.service.js';

export const userController = {
  async updateMe(request: Request, response: Response) {
    const { body } = request.validated as { body: UpdateProfileInput };
    return sendSuccess(response, {
      data: await userService.update(request.auth!.userId, body),
      message: 'Profil mis à jour.'
    });
  },
  async updateAvatar(request: Request, response: Response) {
    if (!request.file) {
      throw new ApiError(400, 'Image obligatoire.', 'IMAGE_REQUIRED');
    }
    return sendSuccess(response, {
      data: await userService.updateAvatar(request.auth!.userId, request.file.buffer),
      message: 'Photo de profil mise à jour.'
    });
  },
  async deleteAvatar(request: Request, response: Response) {
    await userService.deleteAvatar(request.auth!.userId);
    return sendSuccess(response, {
      data: null,
      message: 'Photo de profil supprimée.'
    });
  },
  async archiveMe(request: Request, response: Response) {
    await userService.archive(request.auth!.userId);
    return sendSuccess(response, { data: null, message: 'Compte archivé.' });
  },
  async publicProfile(request: Request, response: Response) {
    const { params } = request.validated as { params: { userId: string } };
    return sendSuccess(response, {
      data: await userService.publicProfile(params.userId, request.auth?.userId),
      message: 'Profil chargé.'
    });
  },
  async block(request: Request, response: Response) {
    const { params, body } = request.validated as {
      params: { userId: string };
      body: { reason?: string };
    };
    await userService.block(request.auth!.userId, params.userId, body.reason);
    return sendSuccess(response, { data: null, message: 'Utilisateur bloqué.' });
  },
  async unblock(request: Request, response: Response) {
    const { params } = request.validated as { params: { userId: string } };
    await userService.unblock(request.auth!.userId, params.userId);
    return sendSuccess(response, { data: null, message: 'Utilisateur débloqué.' });
  }
};
