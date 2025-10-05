import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Creating Super Admin Account...\n');

  // Prompt for admin details - you can change these values
  const adminEmail = process.argv[2] || 'admin@ourfamilytable.com';
  const adminPassword = process.argv[3] || 'Admin123!';
  const adminName = process.argv[4] || 'Super Admin';

  console.log(`Email: ${adminEmail}`);
  console.log(`Name: ${adminName}`);
  console.log(`Password: ${adminPassword}\n`);

  // Hash password
  const hashedPassword = await bcrypt.hash(adminPassword, 12);

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (existingUser) {
    console.log('📝 User already exists. Updating to SUPER_ADMIN role...\n');
    
    const updatedUser = await prisma.user.update({
      where: { email: adminEmail },
      data: {
        role: 'SUPER_ADMIN',
        isActive: true,
        lastLogin: new Date(),
      },
    });

    console.log('✅ User updated to Super Admin:');
    console.log(`   ID: ${updatedUser.id}`);
    console.log(`   Email: ${updatedUser.email}`);
    console.log(`   Name: ${updatedUser.name}`);
    console.log(`   Role: ${updatedUser.role}`);
    console.log(`   Active: ${updatedUser.isActive}\n`);
  } else {
    console.log('📝 Creating new Super Admin user...\n');
    
    const newAdmin = await prisma.user.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        name: adminName,
        role: 'SUPER_ADMIN',
        isActive: true,
        lastLogin: new Date(),
      },
    });

    console.log('✅ Super Admin created:');
    console.log(`   ID: ${newAdmin.id}`);
    console.log(`   Email: ${newAdmin.email}`);
    console.log(`   Name: ${newAdmin.name}`);
    console.log(`   Role: ${newAdmin.role}`);
    console.log(`   Active: ${newAdmin.isActive}\n`);
  }

  console.log('🎉 Setup complete! You can now log in with:');
  console.log(`   Email: ${adminEmail}`);
  console.log(`   Password: ${adminPassword}`);
  console.log('\n⚠️  IMPORTANT: Change this password after first login!\n');
  console.log('📍 Navigate to /admin after logging in to access the admin dashboard.\n');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
