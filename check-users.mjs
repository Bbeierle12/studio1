import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const prisma = new PrismaClient();

const users = await prisma.user.findMany({
  select: { 
    email: true, 
    role: true, 
    name: true 
  }
});

console.log('\n=== Users in Database ===');
users.forEach(u => {
  console.log(`  Name: ${u.name || 'No name'}`);
  console.log(`  Email: ${u.email}`);
  console.log(`  Role: ${u.role || 'USER'}`);
  console.log('  ---');
});

await prisma.$disconnect();
