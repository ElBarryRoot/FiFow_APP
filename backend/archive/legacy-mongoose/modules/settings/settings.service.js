import { AppSetting } from './appSetting.model.js';
import { createAdminLog } from '../auditLogs/adminLog.service.js';

export const DEFAULT_SETTINGS = [
  { key: 'max_product_images', value: 6, valueType: 'NUMBER', description: 'Nombre maximum d’images par produit.' },
  { key: 'otp_expiration_minutes', value: 5, valueType: 'NUMBER', description: 'Durée de validité OTP en minutes.' },
  { key: 'otp_max_attempts', value: 5, valueType: 'NUMBER', description: 'Nombre maximum de tentatives OTP.' },
  { key: 'boost_enabled', value: true, valueType: 'BOOLEAN', description: 'Activation des boosts payants.' },
  { key: 'auto_hide_report_threshold', value: 5, valueType: 'NUMBER', description: 'Seuil de masquage auto après signalements.' },
  { key: 'max_daily_products_per_user', value: 20, valueType: 'NUMBER', description: 'Limite journalière de publication.' },
  { key: 'max_message_length', value: 1000, valueType: 'NUMBER', description: 'Longueur maximale d’un message.' },
  { key: 'payment_enabled', value: true, valueType: 'BOOLEAN', description: 'Activation des paiements.' },
  { key: 'seller_verification_enabled', value: true, valueType: 'BOOLEAN', description: 'Activation de la vérification vendeur.' }
];

export async function ensureDefaultSettings() {
  await Promise.all(
    DEFAULT_SETTINGS.map((setting) => AppSetting.updateOne({ key: setting.key }, { $setOnInsert: setting }, { upsert: true }))
  );
}

export async function listSettings({ includeArchived = false } = {}) {
  await ensureDefaultSettings();
  const filter = includeArchived ? {} : { archivedAt: null };
  return AppSetting.find(filter).sort({ key: 1 });
}

export async function updateSetting({ req, key, payload, adminId }) {
  const before = await AppSetting.findOne({ key }).lean();
  const valueType = payload.valueType || inferValueType(payload.value);
  const setting = await AppSetting.findOneAndUpdate(
    { key },
    {
      $set: {
        value: payload.value,
        valueType,
        description: payload.description ?? before?.description ?? null,
        isPublic: payload.isPublic ?? before?.isPublic ?? false,
        updatedBy: adminId,
        archivedAt: null
      }
    },
    { new: true, upsert: true }
  );

  await createAdminLog({
    req,
    adminId,
    action: 'SETTING_UPDATED',
    targetType: 'AppSetting',
    targetId: setting._id,
    before,
    after: setting.toObject(),
    note: `Paramètre ${key} mis à jour.`
  });

  return setting;
}

function inferValueType(value) {
  if (typeof value === 'boolean') return 'BOOLEAN';
  if (typeof value === 'number') return 'NUMBER';
  if (typeof value === 'object') return 'JSON';
  return 'STRING';
}
