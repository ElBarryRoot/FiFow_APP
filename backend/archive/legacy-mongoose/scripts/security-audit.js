import fs from 'fs';
import path from 'path';

const root = process.cwd();
const requiredFiles = [
  'src/middlewares/auth.middleware.js',
  'src/middlewares/error.middleware.js',
  'src/middlewares/rateLimit.middleware.js',
  'src/modules/auditLogs/adminLog.model.js',
  'src/modules/settings/appSetting.model.js',
  'src/modules/admin/admin.routes.js',
  '.env.example',
  'src/deployment/production-checklist.md'
];

const missing = requiredFiles.filter((file) => !fs.existsSync(path.join(root, file)));
if (missing.length) {
  console.error('Audit échoué. Fichiers manquants :');
  missing.forEach((file) => console.error(`- ${file}`));
  process.exit(1);
}

const envExample = fs.readFileSync(path.join(root, '.env.example'), 'utf8');
['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET', 'MONGO_URI', 'PAYMENT_WEBHOOK_SECRET', 'CLOUDINARY_API_SECRET'].forEach((key) => {
  if (!envExample.includes(key)) missing.push(`ENV:${key}`);
});

if (missing.length) process.exit(1);
console.log('Audit sécurité statique OK : fichiers critiques et variables obligatoires présents.');
