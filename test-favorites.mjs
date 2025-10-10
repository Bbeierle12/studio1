// Test script for Favorites API
// Run with: node test-favorites.mjs

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testFavoritesSetup() {
  console.log('🧪 Testing Favorites API Setup...\n');

  try {
    // Test 1: Check if FavoriteRecipe model exists
    console.log('Test 1: Checking if FavoriteRecipe model exists in Prisma client...');
    
    if (prisma.favoriteRecipe) {
      console.log('✅ FavoriteRecipe model found in Prisma client');
    } else {
      console.log('❌ FavoriteRecipe model NOT found in Prisma client');
      console.log('   Run: npx prisma generate');
      process.exit(1);
    }

    // Test 2: Check database connection
    console.log('\nTest 2: Checking database connection...');
    await prisma.$connect();
    console.log('✅ Database connection successful');

    // Test 3: Check if FavoriteRecipe table exists
    console.log('\nTest 3: Checking if FavoriteRecipe table exists in database...');
    try {
      const count = await prisma.favoriteRecipe.count();
      console.log(`✅ FavoriteRecipe table exists with ${count} records`);
    } catch (error) {
      console.log('❌ FavoriteRecipe table does NOT exist in database');
      console.log('   Need to run migration:');
      console.log('   npx prisma migrate dev --name add_favorite_recipes');
      console.log('   OR manually run SQL from: prisma/migrations/manual_add_favorite_recipes.sql');
      throw error;
    }

    // Test 4: Check User has favorites relation
    console.log('\nTest 4: Checking User model has favorites relation...');
    const users = await prisma.user.findFirst({
      include: { favorites: true }
    });
    console.log('✅ User.favorites relation exists');

    // Test 5: Check Recipe has favorites relation
    console.log('\nTest 5: Checking Recipe model has favorites relation...');
    const recipes = await prisma.recipe.findFirst({
      include: { favorites: true }
    });
    console.log('✅ Recipe.favorites relation exists');

    console.log('\n🎉 All tests passed! Favorites API is ready to use.');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.log('\n📝 Next steps:');
    console.log('1. Make sure DATABASE_URL is set in .env');
    console.log('2. Run database migration');
    console.log('3. Restart the test');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testFavoritesSetup();
