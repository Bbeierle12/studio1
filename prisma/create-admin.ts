import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@familyrecipes.com';
  const password = 'admin'; // temporary password
  
  const hashedPassword = await hash(password, 12);
  
  try {
    const user = await prisma.user.upsert({
      where: { email },
      update: {
        role: 'SUPER_ADMIN',
      },
      create: {
        email,
        password: hashedPassword,
        name: 'Super Admin',
        role: 'SUPER_ADMIN',
      },
    });
    console.log(`Successfully created or updated admin user: ${user.email}`);
  } catch (error) {
    console.error('Error creating admin user:', error);
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
