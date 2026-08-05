import { successResponse } from '../../utils/apiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { listSettings, updateSetting } from './settings.service.js';

export const getSettings = asyncHandler(async (req, res) => {
  const settings = await listSettings({ includeArchived: req.query.includeArchived === 'true' });
  return successResponse(res, { message: 'Paramètres récupérés.', data: settings });
});

export const patchSetting = asyncHandler(async (req, res) => {
  const { key } = req.validated.params;
  const setting = await updateSetting({ req, key, payload: req.validated.body, adminId: req.user._id });
  return successResponse(res, { message: 'Paramètre mis à jour.', data: setting });
});
