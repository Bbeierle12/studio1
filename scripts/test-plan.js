const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testPlanModel() {
  try {
    console.log('Testing Plan model...');

    // Get the first recipe and user
    const recipe = await prisma.recipe.findFirst();
    const user = await prisma.user.findFirst();

    if (!recipe || !user) {
      console.log('❌ No recipe or user found');
      return;
    }

    // Create a meal plan
    const plan = await prisma.plan.create({
      data: {
        recipeId: recipe.id,
        userId: user.id,
        plannedFor: new Date('2025-12-25'), // Christmas dinner
      },
      include: {
        recipe: { select: { title: true } },
        user: { select: { name: true } },
      },
    });

    console.log('✅ Created meal plan:');
    console.log(`- Recipe: ${plan.recipe.title}`);
    console.log(`- User: ${plan.user.name}`);
    console.log(
      `- Planned for: ${plan.plannedFor.toISOString().split('T')[0]}`
    );

    // List all plans
    const allPlans = await prisma.plan.findMany({
      include: {
        recipe: { select: { title: true } },
        user: { select: { name: true } },
      },
    });

    console.log(`\nTotal plans in database: ${allPlans.length}`);
  } catch (error) {
    if (error.code === 'P2002') {
      console.log(
        'ℹ️  Plan already exists for this recipe/date/user combination'
      );
    } else {
      console.error('❌ Error:', error.message);
    }
  } finally {
    await prisma.$disconnect();
  }
}

testPlanModel();
