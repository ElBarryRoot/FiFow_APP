import bcrypt from 'bcryptjs';
import {
  BoostPlacement,
  PrismaClient,
  SettingValueType,
  UserRole,
  UserStatus
} from '@prisma/client';

const prisma = new PrismaClient();

const categoryTree = [
  {
    name: 'Mode',
    slug: 'mode',
    children: [
      ['Vêtements', 'vetements'],
      ['Chaussures', 'chaussures'],
      ['Sacs et accessoires', 'sacs-accessoires']
    ]
  },
  {
    name: 'Téléphones',
    slug: 'telephones',
    children: [
      ['Smartphones', 'smartphones'],
      ['Téléphones simples', 'telephones-simples'],
      ['Accessoires téléphone', 'accessoires-telephone']
    ]
  },
  {
    name: 'Maison',
    slug: 'maison',
    children: [
      ['Meubles', 'meubles'],
      ['Électroménager', 'electromenager'],
      ['Décoration', 'decoration']
    ]
  },
  {
    name: 'Auto',
    slug: 'auto',
    children: [
      ['Voitures', 'voitures'],
      ['Motos', 'motos'],
      ['Pièces et accessoires', 'pieces-accessoires-auto']
    ]
  },
  {
    name: 'Électronique',
    slug: 'electronique',
    children: [
      ['Ordinateurs', 'ordinateurs'],
      ['Télévisions', 'televisions'],
      ['Audio et vidéo', 'audio-video']
    ]
  }
] as const;

const settings = [
  ['max_product_images', 6, SettingValueType.NUMBER, 'Nombre maximum d’images par produit.'],
  ['max_daily_products_per_user', 20, SettingValueType.NUMBER, 'Limite quotidienne de publication.'],
  ['max_message_length', 2000, SettingValueType.NUMBER, 'Longueur maximale d’un message.'],
  ['auto_hide_report_threshold', 5, SettingValueType.NUMBER, 'Seuil de masquage après signalements.'],
  ['buyer_protection_fixed_fee', 5000, SettingValueType.NUMBER, 'Part fixe de la protection acheteur en GNF.'],
  ['buyer_protection_rate_bps', 500, SettingValueType.NUMBER, 'Taux de protection acheteur en points de base.'],
  ['buyer_protection_policy_version', '2026-01', SettingValueType.STRING, 'Version active de la politique de protection.'],
  ['terms_version', '2026-01', SettingValueType.STRING, 'Version active des conditions.'],
  ['payment_enabled', false, SettingValueType.BOOLEAN, 'Activation des paiements réels.'],
  ['boost_enabled', true, SettingValueType.BOOLEAN, 'Activation des boosts.'],
  ['home_delivery_fee', 0, SettingValueType.NUMBER, 'Frais de livraison a domicile en GNF.'],
  ['pickup_point_fee', 0, SettingValueType.NUMBER, 'Frais de remise en point de retrait en GNF.'],
  ['order_confirmation_timeout_minutes', 1440, SettingValueType.NUMBER, 'Delai de confirmation vendeur.'],
  ['order_payment_timeout_minutes', 120, SettingValueType.NUMBER, 'Delai de paiement apres confirmation.']
] as const;

async function seedCategories() {
  for (const [rootIndex, root] of categoryTree.entries()) {
    const parent = await prisma.category.upsert({
      where: { slug: root.slug },
      update: { name: root.name, sortOrder: rootIndex * 10, isActive: true, archivedAt: null },
      create: { name: root.name, slug: root.slug, sortOrder: rootIndex * 10, isActive: true }
    });

    for (const [childIndex, [name, slug]] of root.children.entries()) {
      await prisma.category.upsert({
        where: { slug },
        update: {
          name,
          parentId: parent.id,
          sortOrder: childIndex * 10,
          isActive: true,
          archivedAt: null
        },
        create: {
          name,
          slug,
          parentId: parent.id,
          sortOrder: childIndex * 10,
          isActive: true
        }
      });
    }
  }
}

async function seedSettings() {
  for (const [key, value, valueType, description] of settings) {
    await prisma.appSetting.upsert({
      where: { key },
      update: { value, valueType, description, archivedAt: null },
      create: { key, value, valueType, description }
    });
  }
}

async function seedBoostPlans() {
  await prisma.boostPlan.upsert({
    where: { slug: 'boost-24h' },
    update: { name: 'Boost 24 h', durationHours: 24, price: 10000n, isActive: true, archivedAt: null },
    create: {
      name: 'Boost 24 h',
      slug: 'boost-24h',
      durationHours: 24,
      price: 10000n,
      placement: BoostPlacement.HOME_FEED
    }
  });

  await prisma.boostPlan.upsert({
    where: { slug: 'boost-7j' },
    update: { name: 'Boost 7 jours', durationHours: 168, price: 50000n, isActive: true, archivedAt: null },
    create: {
      name: 'Boost 7 jours',
      slug: 'boost-7j',
      durationHours: 168,
      price: 50000n,
      placement: BoostPlacement.SEARCH_RESULTS
    }
  });
}

async function bootstrapAdmin() {
  const rawEmail = process.env['BOOTSTRAP_ADMIN_EMAIL']?.trim().toLowerCase();
  const rawPassword = process.env['BOOTSTRAP_ADMIN_PASSWORD'];

  if (!rawEmail && !rawPassword) return;
  if (!rawEmail || !rawPassword) {
    throw new Error('BOOTSTRAP_ADMIN_EMAIL et BOOTSTRAP_ADMIN_PASSWORD doivent être définis ensemble.');
  }
  if (rawPassword.length < 12) {
    throw new Error('Le mot de passe bootstrap administrateur doit contenir au moins 12 caractères.');
  }

  const passwordHash = await bcrypt.hash(rawPassword, 12);
  await prisma.user.upsert({
    where: { email: rawEmail },
    update: {
      passwordHash,
      role: UserRole.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
      emailVerifiedAt: new Date()
    },
    create: {
      email: rawEmail,
      fullName: 'Administrateur Fi Fow',
      passwordHash,
      role: UserRole.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
      emailVerifiedAt: new Date(),
      termsAcceptedAt: new Date(),
      termsVersion: '2026-01'
    }
  });
}

async function main() {
  await seedCategories();
  await seedSettings();
  await seedBoostPlans();
  await bootstrapAdmin();
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
