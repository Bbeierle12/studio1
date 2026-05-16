import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';

const prisma = new PrismaClient();

/**
 * Generates a strong random password (no hardcoded default — nothing
 * password-related is ever committed to the repo).
 */
function generatePassword(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  const bytes = randomBytes(18);
  let out = '';
  for (let i = 0; i < bytes.length; i++) {
    out += alphabet[bytes[i] % alphabet.length];
  }
  return out + '!9Aa'; // ensure complexity-rule coverage
}

async function main() {
  console.log('🔧 Resetting Admin Password...\n');

  const adminEmail = process.env.ADMIN_EMAIL || 'admin@ourfamilytable.com';

  // Password precedence: CLI arg > ADMIN_PASSWORD env var > random.
  const cliPassword = process.argv[2];
  const generated = !cliPassword && !process.env.ADMIN_PASSWORD;
  const newPassword = cliPassword || process.env.ADMIN_PASSWORD || generatePassword();

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
  if (generated) {
    // Only a freshly generated password is printed — and only once, here.
    console.log(`   Generated password: ${newPassword}`);
    console.log('   ⚠️  Save this now; it is not stored anywhere and will not be shown again.');
  } else {
    console.log('   Password: (set from the value you supplied)');
  }
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
