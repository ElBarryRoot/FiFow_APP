import { AdminLog } from './adminLog.model.js';

export async function createAdminLog({ req, adminId, action, targetType, targetId, before = null, after = null, note = null }) {
  if (!adminId || !action || !targetType || !targetId) return null;
  return AdminLog.create({
    adminId,
    action,
    targetType,
    targetId,
    before,
    after,
    note,
    ipAddress: req?.ip || null,
    userAgent: req?.headers?.['user-agent'] || null
  });
}
