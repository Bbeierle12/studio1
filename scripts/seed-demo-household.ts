/**
 * Seed a demo household with one member per HouseholdRole so the role-badge
 * colors on /household are visible in local dev. LOCAL DEV ONLY — creates four
 * *.demo.local users in one household. Idempotent (upserts by email).
 *
 * Run: npx tsx scripts/seed-demo-household.ts
 * Then log in at http://localhost:9002/login as owner@demo.local / demo1234
 * and open /household.
 */
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { PrismaClient, type HouseholdRole } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

const DEMO_PASSWORD = 'demo1234';

const MEMBERS: Array<{ email: string; name: string; role: HouseholdRole }> = [
  { email: 'owner@demo.local', name: 'Demo Owner', role: 'OWNER' },
  { email: 'curator@demo.local', name: 'Demo Curator', role: 'CURATOR' },
  { email: 'contributor@demo.local', name: 'Demo Contributor', role: 'CONTRIBUTOR' },
  { email: 'kid@demo.local', name: 'Demo Kid', role: 'KID' },
];

async function main() {
  console.log('\n🏡 Seeding demo household (one member per role)\n');
  const password = await hash(DEMO_PASSWORD, 12);

  // 1. Ensure the owner user exists (so we have an ownerId for the household).
  const owner = await prisma.user.upsert({
    where: { email: 'owner@demo.local' },
    update: { name: 'Demo Owner', password, isActive: true },
    create: { email: 'owner@demo.local', name: 'Demo Owner', password, isActive: true },
  });

  // 2. Create the household if the owner doesn't already have one.
  let householdId = owner.householdId;
  if (householdId) {
    console.log(`  ↺ Reusing existing household ${householdId}\n`);
  } else {
    const household = await prisma.household.create({
      data: { name: 'Demo Family', ownerId: owner.id },
    });
    householdId = household.id;
    console.log(`  ✅ Created household "Demo Family" (${householdId})\n`);
  }

  // 3. Upsert all four members into that household with their roles.
  for (const m of MEMBERS) {
    await prisma.user.upsert({
      where: { email: m.email },
      update: { name: m.name, password, householdId, householdRole: m.role, isActive: true },
      create: { email: m.email, name: m.name, password, householdId, householdRole: m.role, isActive: true },
    });
    console.log(`  ✅ ${m.email.padEnd(24)} → ${m.role}`);
  }

  console.log('\n' + '─'.repeat(52));
  console.log('🎉 Done. Log in and open /household:\n');
  console.log('   URL:   http://localhost:9002/login');
  console.log('   Email: owner@demo.local');
  console.log(`   Pass:  ${DEMO_PASSWORD}`);
  console.log('\n   You should see four role badges:');
  console.log('   👑 Owner=gold · Curator=blue · Contributor=green · Kid=neutral\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
