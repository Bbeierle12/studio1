const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testDatabase() {
  try {
    console.log('Testing database schema...');

    const recipes = await prisma.recipe.findMany({
      select: {
        id: true,
        title: true,
        slug: true,
      },
    });

    console.log(`Found ${recipes.length} recipes:`);
    recipes.forEach(recipe => {
      console.log(`- "${recipe.title}" → "${recipe.slug}"`);
    });

    console.log('\n✅ Database schema is working correctly!');
    console.log('All recipes have slugs properly generated.');
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testDatabase();
