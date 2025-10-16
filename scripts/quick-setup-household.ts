/**
 * Quick Household Setup
 * Creates a household for the first admin user found
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('\n🏡 Quick Family Household Setup\n');
  console.log('━'.repeat(50));
  
  // Find an admin or first user
  let ownerUser = await prisma.user.findFirst({
    where: {
      OR: [
        { email: { contains: 'bbeierle' } },
        { role: { in: ['SUPER_ADMIN', 'CONTENT_ADMIN', 'SUPPORT_ADMIN'] } }
      ]
    }
  });
  
  if (!ownerUser) {
    ownerUser = await prisma.user.findFirst({
      orderBy: { createdAt: 'asc' }
    });
  }
  
  if (!ownerUser) {
    console.log('❌ No users found. Please create a user first.');
    return;
  }
  
  console.log(`\n✅ Found owner: ${ownerUser.email} (${ownerUser.name})\n`);
  
  // Check if user already has a household
  if (ownerUser.householdId) {
    const existing = await prisma.household.findUnique({
      where: { id: ownerUser.householdId }
    });
    console.log(`⚠️  User already in household: ${existing?.name}`);
    console.log('Skipping household creation.\n');
    await prisma.$disconnect();
    return;
  }
  
  // Create household
  const householdName = ownerUser.name 
    ? `${ownerUser.name.split(' ').pop()}'s Family`
    : 'Our Family Table';
  
  console.log(`🔄 Creating household: "${householdName}"\n`);
  
  try {
    const household = await prisma.household.create({
      data: {
        name: householdName,
        ownerId: ownerUser.id,
        digestEnabled: true,
        digestDay: 'sunday',
        digestTime: '09:00',
        birthdays: []
      }
    });
    
    console.log(`✅ Household created: ${household.name}`);
    console.log(`   ID: ${household.id}\n`);
    
    // Update owner user
    await prisma.user.update({
      where: { id: ownerUser.id },
      data: {
        householdId: household.id,
        householdRole: 'OWNER'
      }
    });
    
    console.log(`✅ ${ownerUser.email} set as OWNER\n`);
    
    // Set default roles for other users
    const otherUsers = await prisma.user.findMany({
      where: {
        id: { not: ownerUser.id },
        householdRole: null
      }
    });
    
    if (otherUsers.length > 0) {
      console.log('🔄 Setting default roles for other users...\n');
      
      for (const user of otherUsers) {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            householdRole: 'CONTRIBUTOR'
          }
        });
        console.log(`  ✅ ${user.email} set as CONTRIBUTOR`);
      }
    }
    
    console.log('\n' + '━'.repeat(50));
    console.log('\n🎉 Household Setup Complete!\n');
    console.log(`Household: ${household.name}`);
    console.log(`Owner: ${ownerUser.email}`);
    console.log(`Weekly Digest: Enabled (Sunday at 9:00 AM)`);
    console.log(`\nNext Steps:`);
    console.log('1. Visit http://localhost:9002 to see the Family Foyer');
    console.log('2. Invite family members (coming soon)');
    console.log('3. Start adding recipe stories!\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);
