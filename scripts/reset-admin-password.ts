import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Resetting Admin Password...\n');

  const adminEmail = 'admin@ourfamilytable.com';
  const newPassword = 'Admin123!';

  // Hash password
  const hashedPassword = await bcrypt.hash(newPassword, 12);

  // Find and update the admin user
  const existingUser = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingUser) {
    console.log('❌ Admin user not found!');
    console.log('Run: npx tsx scripts/create-admin.ts to create the admin account first.\n');
    return;
  }

  const updatedUser = await prisma.user.update({
    where: { email: adminEmail },
    data: {
      password: hashedPassword,
    },
  });

  console.log('✅ Password reset successfully!');
  console.log(`   Email: ${updatedUser.email}`);
  console.log(`   New Password: ${newPassword}\n`);
  console.log('⚠️  IMPORTANT: Change this password after logging in!\n');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
