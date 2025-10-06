import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const admins = await prisma.user.findMany({
    where: {
      role: {
        not: 'USER'
      }
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true
    }
  });

  console.log('Admin users:');
  console.log(admins);

  if (admins.length === 0) {
    console.log('\nNo admin users found. Create one with:');
    console.log('npx tsx scripts/create-admin.ts');
  }

  await prisma.$disconnect();
}

main();
