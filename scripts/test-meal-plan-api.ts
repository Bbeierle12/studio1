/**
 * Test script to verify meal plan API functionality
 * Run with: npx tsx scripts/test-meal-plan-api.ts
 */

import { prisma } from '../src/lib/data';

async function testMealPlanAPI() {
  console.log('🧪 Testing Meal Plan API and Database...\n');

  try {
    // Test 1: Check if we can connect to database
    console.log('1️⃣ Testing database connection...');
    await prisma.$connect();
    console.log('✅ Database connected\n');

    // Test 2: Check if users exist
    console.log('2️⃣ Checking for users...');
    const userCount = await prisma.user.count();
    console.log(`✅ Found ${userCount} users\n`);

    if (userCount === 0) {
      console.log('⚠️  No users found. You need to create a user account first.\n');
      return;
    }

    // Test 3: Check meal plans
    console.log('3️⃣ Checking meal plans...');
    const mealPlans = await prisma.mealPlan.findMany({
      include: {
        meals: {
          include: {
            recipe: {
              select: {
                id: true,
                title: true
              }
            }
          }
        },
        user: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      }
    });

    console.log(`✅ Found ${mealPlans.length} meal plan(s)\n`);

    if (mealPlans.length === 0) {
      console.log('ℹ️  No meal plans exist yet. This is normal for new users.');
      console.log('   Users can create meal plans from the UI.\n');
    } else {
      console.log('📋 Meal Plan Details:');
      mealPlans.forEach((plan, i) => {
        console.log(`\n   Plan ${i + 1}:`);
        console.log(`   - Name: ${plan.name}`);
        console.log(`   - User: ${plan.user.email} (${plan.user.name})`);
        console.log(`   - Active: ${plan.isActive ? 'Yes' : 'No'}`);
        console.log(`   - Date Range: ${new Date(plan.startDate).toLocaleDateString()} - ${new Date(plan.endDate).toLocaleDateString()}`);
        console.log(`   - Meals: ${plan.meals.length}`);
        
        if (plan.meals.length > 0) {
          console.log(`   - Sample meals:`);
          plan.meals.slice(0, 3).forEach(meal => {
            const mealName = meal.recipe?.title || meal.customMealName || 'Unknown';
            console.log(`     • ${meal.mealType}: ${mealName} (${new Date(meal.date).toLocaleDateString()})`);
          });
        }
      });
    }

    // Test 4: Check recipes
    console.log('\n4️⃣ Checking recipes...');
    const recipeCount = await prisma.recipe.count();
    console.log(`✅ Found ${recipeCount} recipe(s)\n`);

    // Test 5: Check weather cache
    console.log('5️⃣ Checking weather cache...');
    const weatherCount = await prisma.weatherCache.count();
    console.log(`✅ Found ${weatherCount} cached weather forecast(s)\n`);

    console.log('✅ All checks complete!\n');
    console.log('Summary:');
    console.log(`- Users: ${userCount}`);
    console.log(`- Meal Plans: ${mealPlans.length}`);
    console.log(`- Recipes: ${recipeCount}`);
    console.log(`- Weather Cache: ${weatherCount}`);

    if (mealPlans.length === 0) {
      console.log('\n💡 Next Steps:');
      console.log('   1. Log in to the app');
      console.log('   2. Navigate to /meal-plan');
      console.log('   3. Click "Create Meal Plan" button');
      console.log('   4. Fill in the form and create your first meal plan');
    }

  } catch (error) {
    console.error('❌ Error:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('connect')) {
        console.log('\n⚠️  Database connection failed!');
        console.log('   Check your DATABASE_URL environment variable');
      } else if (error.message.includes('table') || error.message.includes('relation')) {
        console.log('\n⚠️  Database schema issue!');
        console.log('   Run: npx prisma migrate deploy');
      }
    }
  } finally {
    await prisma.$disconnect();
  }
}

testMealPlanAPI().catch(console.error);
