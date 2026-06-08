import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

/**
 * Upsert a SUPER_ADMIN user. Driven by env vars so it can target any DB via
 * an inline/sourced DATABASE_URL (no hardcoded credentials):
 *   ADMIN_EMAIL=... ADMIN_PASSWORD=... ADMIN_NAME=... npx tsx scripts/upsert-superadmin.ts
 */
async function main() {
  const email = (process.env.ADMIN_EMAIL || '').toLowerCase().trim();
  const password = process.env.ADMIN_PASSWORD || '';
  const name = process.env.ADMIN_NAME || 'Admin';
  if (!email || !password) {
    throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD env vars are required');
  }

  const hash = await bcrypt.hash(password, 12);

  const user = await prisma.user.upsert({
    where: { email },
    update: { password: hash, role: 'SUPER_ADMIN', isActive: true },
    create: {
      email,
      password: hash,
      name,
      role: 'SUPER_ADMIN',
      isActive: true,
      emailVerified: new Date(),
    },
    select: { id: true, email: true, name: true, role: true, isActive: true },
  });

  const ok = await bcrypt.compare(password, hash);
  console.log('✅ Superadmin upserted:', JSON.stringify(user));
  console.log('   bcrypt verify:', ok);
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
