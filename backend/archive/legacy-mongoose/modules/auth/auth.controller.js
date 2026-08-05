import { successResponse } from '../../utils/apiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import * as authService from './auth.service.js';

export const sendOtp = asyncHandler(async (req, res) => {
  const result = await authService.sendOtp({
    ...req.validated.body,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  });
  return successResponse(res, { message: 'OTP envoyé avec succès.', data: result });
});

export const verifyOtp = asyncHandler(async (req, res) => {
  const result = await authService.verifyOtp(req.validated.body);
  return successResponse(res, { message: 'Connexion réussie.', data: result });
});

export const refreshToken = asyncHandler(async (req, res) => {
  const result = await authService.refreshToken(req.validated.body);
  return successResponse(res, { message: 'Token renouvelé avec succès.', data: result });
});

export const logout = asyncHandler(async (req, res) => {
  await authService.logout(req.user);
  return successResponse(res, { message: 'Déconnexion réussie.', data: null });
});

export const me = asyncHandler(async (req, res) => {
  return successResponse(res, { message: 'Profil connecté.', data: authService.sanitizeUser(req.user) });
});
