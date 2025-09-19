import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testSlugBackfill() {
  console.log('Testing slug backfill functionality...');

  try {
    // First, let's see what recipes exist
    const existingRecipes = await prisma.recipe.findMany({
      select: { id: true, title: true, slug: true },
    });

    console.log('Existing recipes:');
    existingRecipes.forEach(recipe => {
      console.log(`- ${recipe.title}: ${recipe.slug}`);
    });

    // Create a test recipe without a slug (simulate old data)
    // We'll use raw SQL to bypass Prisma's required field validation
    await prisma.$executeRaw`
      INSERT INTO Recipe (
        id, title, contributor, ingredients, instructions, 
        tags, summary, imageUrl, imageHint, userId, 
        createdAt, updatedAt, slug
      ) VALUES (
        'test-recipe-id', 
        'Test Recipe Without Slug',
        'Test Chef',
        'Test ingredients',
        'Test instructions',
        '["test"]',
        'Test summary',
        'https://example.com/image.jpg',
        'test image',
        ${existingRecipes[0]?.id || 'test-user'},
        datetime('now'),
        datetime('now'),
        ''
      )
    `;

    console.log('\n✅ Created test recipe without slug');

    // Verify the recipe was created without a proper slug
    const testRecipe = await prisma.recipe.findFirst({
      where: { title: 'Test Recipe Without Slug' },
      select: { id: true, title: true, slug: true },
    });

    if (testRecipe) {
      console.log(`Test recipe slug before backfill: "${testRecipe.slug}"`);
    }

    console.log('\n🚀 Now run: npm run backfill:slugs');
    console.log('Then check the test recipe has a proper slug!');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testSlugBackfill();
