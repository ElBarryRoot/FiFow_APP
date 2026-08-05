import { connectDatabase } from '../config/database.js';
import { Category } from '../modules/categories/category.model.js';
import { BoostPlan } from '../modules/boosts/boostPlan.model.js';
import { ensureDefaultSettings } from '../modules/settings/settings.service.js';

const categories = [
  ['Téléphones', 'telephones'],
  ['Ordinateurs', 'ordinateurs'],
  ['Mode', 'mode'],
  ['Électroménager', 'electromenager'],
  ['Meubles', 'meubles'],
  ['Motos & pièces', 'motos-pieces'],
  ['Étudiants', 'etudiants']
];

async function run() {
  await connectDatabase();
  await ensureDefaultSettings();
  for (const [name, slug] of categories) {
    await Category.updateOne({ slug }, { $setOnInsert: { name, slug, isActive: true, isSensitive: false, requiresAdminValidation: false, sortOrder: 10 } }, { upsert: true });
  }
  await BoostPlan.updateOne({ slug: 'boost-24h' }, { $setOnInsert: { name: 'Boost 24h', slug: 'boost-24h', durationHours: 24, price: 10000, currency: 'GNF', placement: 'HOME_FEED', isActive: true } }, { upsert: true });
  console.log('Seed pilote Conakry terminé.');
  process.exit(0);
}

run().catch((error) => { console.error(error); process.exit(1); });
