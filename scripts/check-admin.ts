import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAdmin() {
  try {
    const admin = await prisma.user.findUnique({
      where: { email: 'admin@ourfamilytable.com' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
      },
    });

    if (admin) {
      console.log('✅ Admin user found in production:');
      console.log(JSON.stringify(admin, null, 2));
    } else {
      console.log('❌ Admin user not found');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAdmin();
