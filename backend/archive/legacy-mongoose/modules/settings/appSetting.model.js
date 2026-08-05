import mongoose from 'mongoose';

const appSettingSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, trim: true, lowercase: true, index: true },
    value: { type: mongoose.Schema.Types.Mixed, required: true },
    valueType: { type: String, enum: ['STRING', 'NUMBER', 'BOOLEAN', 'JSON'], required: true },
    description: { type: String, trim: true, maxlength: 500, default: null },
    isPublic: { type: Boolean, default: false, index: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    archivedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

export const AppSetting = mongoose.model('AppSetting', appSettingSchema);
