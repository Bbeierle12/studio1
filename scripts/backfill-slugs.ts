import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Function to generate slug from title
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
}

// Function to ensure slug uniqueness
async function generateUniqueSlug(
  title: string,
  excludeId?: string
): Promise<string> {
  let baseSlug = generateSlug(title);
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existingRecipe = await prisma.recipe.findUnique({
      where: { slug },
      select: { id: true },
    });

    // If no existing recipe found, or the existing recipe is the one we're updating
    if (!existingRecipe || (excludeId && existingRecipe.id === excludeId)) {
      return slug;
    }

    // If slug exists, try with a counter
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
}

async function backfillSlugs() {
  console.log('Starting slug backfill...');

  try {
    // In a real migration scenario, you would first find recipes with missing slugs
    // Since our schema requires slugs, we'll demonstrate with all recipes
    const allRecipes = await prisma.recipe.findMany({
      select: {
        id: true,
        title: true,
        slug: true,
      },
    });

    console.log(`Found ${allRecipes.length} recipes in database`);

    if (allRecipes.length === 0) {
      console.log('No recipes found in database.');
      return;
    }

    // Show current slugs
    console.log('\nCurrent recipes and their slugs:');
    allRecipes.forEach(recipe => {
      console.log(`- "${recipe.title}" → "${recipe.slug}"`);
    });

    // Demonstrate slug generation for any recipes that might need updating
    console.log('\nValidating all slugs are properly formatted...');

    let updatedCount = 0;
    for (const recipe of allRecipes) {
      const expectedSlug = await generateUniqueSlug(recipe.title, recipe.id);

      if (recipe.slug !== expectedSlug) {
        await prisma.recipe.update({
          where: { id: recipe.id },
          data: { slug: expectedSlug },
        });

        console.log(
          `Updated recipe "${recipe.title}": "${recipe.slug}" → "${expectedSlug}"`
        );
        updatedCount++;
      }
    }

    if (updatedCount === 0) {
      console.log('✅ All recipes already have properly formatted slugs!');
    } else {
      console.log(`✅ Updated ${updatedCount} recipe slugs!`);
    }

    console.log(
      '\n📝 Note: In a real migration scenario where slug was added as an optional field,'
    );
    console.log(
      '   this script would find recipes with null/empty slugs and generate unique ones.'
    );
  } catch (error) {
    console.error('❌ Error during slug backfill:', error);
    throw error;
  }
}

async function main() {
  await backfillSlugs();
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
