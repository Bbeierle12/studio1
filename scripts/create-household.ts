/**
 * Create First Household
 * 
 * This script helps you set up your first household after running the migration.
 * It will:
 * 1. Find your user account
 * 2. Create a household
 * 3. Set you as the owner
 * 4. Set default household roles for other users
 */

import { PrismaClient } from '@prisma/client';
import readline from 'readline';

const prisma = new PrismaClient();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

async function main() {
  console.log('\n🏡 Family Household Setup\n');
  console.log('━'.repeat(50));
  
  // Step 1: Find all users
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      householdId: true,
      householdRole: true
    },
    orderBy: { createdAt: 'asc' }
  });
  
  if (users.length === 0) {
    console.log('❌ No users found. Please create a user first.');
    rl.close();
    return;
  }
  
  console.log('\n📋 Existing Users:\n');
  users.forEach((user, index) => {
    console.log(`${index + 1}. ${user.email} (${user.name || 'No name'})`);
    if (user.householdId) {
      console.log(`   Already in household: ${user.householdId}`);
    }
  });
  
  // Step 2: Ask which user should be the owner
  console.log('\n');
  const ownerIndex = await question('Which user should be the household owner? (enter number): ');
  const ownerUser = users[parseInt(ownerIndex) - 1];
  
  if (!ownerUser) {
    console.log('❌ Invalid selection');
    rl.close();
    return;
  }
  
  console.log(`\n✅ Selected: ${ownerUser.email}\n`);
  
  // Step 3: Ask for household name
  const householdName = await question('What should the household be called? (e.g., "The Smith Family"): ');
  
  if (!householdName) {
    console.log('❌ Household name is required');
    rl.close();
    return;
  }
  
  // Step 4: Ask about digest settings
  console.log('\n📧 Weekly Family Digest Settings:\n');
  const digestEnabled = (await question('Enable weekly digest emails? (y/n): ')).toLowerCase() === 'y';
  
  let digestDay = 'sunday';
  let digestTime = '09:00';
  
  if (digestEnabled) {
    digestDay = await question('Which day to send? (monday/tuesday/.../sunday): ') || 'sunday';
    digestTime = await question('What time? (HH:MM format, e.g., 09:00): ') || '09:00';
  }
  
  // Step 5: Create the household
  console.log('\n🔄 Creating household...\n');
  
  try {
    const household = await prisma.household.create({
      data: {
        name: householdName,
        ownerId: ownerUser.id,
        digestEnabled,
        digestDay: digestDay.toLowerCase(),
        digestTime,
        birthdays: [] // Empty array to start
      }
    });
    
    console.log(`✅ Household created: ${household.name} (ID: ${household.id})\n`);
    
    // Step 6: Update owner user
    await prisma.user.update({
      where: { id: ownerUser.id },
      data: {
        householdId: household.id,
        householdRole: 'OWNER'
      }
    });
    
    console.log(`✅ ${ownerUser.email} set as OWNER\n`);
    
    // Step 7: Set default roles for other users
    const otherUsers = users.filter(u => u.id !== ownerUser.id && !u.householdId);
    
    if (otherUsers.length > 0) {
      console.log('🔄 Setting default roles for other users...\n');
      
      for (const user of otherUsers) {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            householdRole: 'CONTRIBUTOR' // Default to contributor
          }
        });
        console.log(`  ✅ ${user.email} set as CONTRIBUTOR`);
      }
      
      console.log('\n💡 Note: Other users are not added to the household yet.');
      console.log('   You can invite them through the household dashboard.\n');
    }
    
    // Step 8: Summary
    console.log('\n' + '━'.repeat(50));
    console.log('\n🎉 Household Setup Complete!\n');
    console.log(`Household: ${household.name}`);
    console.log(`Owner: ${ownerUser.email}`);
    console.log(`Digest: ${digestEnabled ? `Enabled (${digestDay} at ${digestTime})` : 'Disabled'}`);
    console.log(`ID: ${household.id}\n`);
    
    console.log('Next Steps:');
    console.log('1. Invite family members through the household dashboard');
    console.log('2. Assign roles (Curator, Contributor, Kid)');
    console.log('3. Add family birthdays for digest notifications');
    console.log('4. Start preserving family recipes!\n');
    
  } catch (error) {
    console.error('❌ Error creating household:', error);
  } finally {
    rl.close();
    await prisma.$disconnect();
  }
}

main()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
