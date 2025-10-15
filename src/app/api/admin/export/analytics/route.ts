import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/data';
import { hasPermission } from '@/lib/admin-permissions';
import { arrayToCSV, generateCSVFilename, formatDateForCSV, formatNumberForCSV } from '@/lib/csv-utils';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!adminUser || !hasPermission(adminUser.role, 'VIEW_ANALYTICS')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse query parameters
    const searchParams = req.nextUrl.searchParams;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const exportType = searchParams.get('type') || 'overview'; // overview, users, recipes, popular

    // Build date filter
    const dateFilter: any = {};
    if (startDate) {
      dateFilter.gte = new Date(startDate);
    }
    if (endDate) {
      dateFilter.lte = new Date(endDate);
    }

    let csvData: any[] = [];
    let filename = '';

    switch (exportType) {
      case 'users': {
        // Export user growth data
        const users = await prisma.user.findMany({
          where: dateFilter.gte || dateFilter.lte ? { createdAt: dateFilter } : {},
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
            _count: {
              select: {
                recipes: true,
                favorites: true,
                mealPlans: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        });

        csvData = users.map((user) => ({
          ID: user.id,
          Name: user.name || 'N/A',
          Email: user.email,
          Role: user.role,
          'Recipes Created': user._count.recipes,
          'Favorited Recipes': user._count.favorites,
          'Meal Plans': user._count.mealPlans,
          'Joined Date': formatDateForCSV(user.createdAt),
        }));

        filename = generateCSVFilename('user_analytics');
        break;
      }

      case 'recipes': {
        // Export recipe data
        const recipes = await prisma.recipe.findMany({
          where: dateFilter.gte || dateFilter.lte ? { createdAt: dateFilter } : {},
          select: {
            id: true,
            title: true,
            contributor: true,
            course: true,
            cuisine: true,
            difficulty: true,
            prepTime: true,
            servings: true,
            createdAt: true,
            isFeatured: true,
            user: {
              select: {
                name: true,
                email: true,
              },
            },
            _count: {
              select: {
                favorites: true,
                plans: true,
                plannedMeals: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        });

        csvData = recipes.map((recipe) => ({
          ID: recipe.id,
          Title: recipe.title,
          Contributor: recipe.contributor || recipe.user.name || 'N/A',
          'Author Email': recipe.user.email,
          Course: recipe.course || 'N/A',
          Cuisine: recipe.cuisine || 'N/A',
          Difficulty: recipe.difficulty || 'N/A',
          'Prep Time (min)': recipe.prepTime || 'N/A',
          Servings: recipe.servings || 'N/A',
          Featured: recipe.isFeatured ? 'Yes' : 'No',
          'Favorites Count': recipe._count.favorites,
          'In Meal Plans': recipe._count.plans + recipe._count.plannedMeals,
          'Created Date': formatDateForCSV(recipe.createdAt),
        }));

        filename = generateCSVFilename('recipe_analytics');
        break;
      }

      case 'popular': {
        // Export popular recipes
        const popularRecipes = await prisma.recipe.findMany({
          where: dateFilter.gte || dateFilter.lte ? { createdAt: dateFilter } : {},
          select: {
            id: true,
            title: true,
            contributor: true,
            course: true,
            cuisine: true,
            difficulty: true,
            createdAt: true,
            _count: {
              select: {
                favorites: true,
                plans: true,
                plannedMeals: true,
              },
            },
          },
          orderBy: {
            favorites: {
              _count: 'desc',
            },
          },
          take: 100,
        });

        csvData = popularRecipes.map((recipe, index) => ({
          Rank: index + 1,
          ID: recipe.id,
          Title: recipe.title,
          Contributor: recipe.contributor || 'N/A',
          Course: recipe.course || 'N/A',
          Cuisine: recipe.cuisine || 'N/A',
          Difficulty: recipe.difficulty || 'N/A',
          'Favorites Count': recipe._count.favorites,
          'In Meal Plans': recipe._count.plans + recipe._count.plannedMeals,
          'Total Engagement': recipe._count.favorites + recipe._count.plans + recipe._count.plannedMeals,
          'Created Date': formatDateForCSV(recipe.createdAt),
        }));

        filename = generateCSVFilename('popular_recipes');
        break;
      }

      case 'overview':
      default: {
        // Export overview statistics
        const [
          totalUsers,
          totalRecipes,
          totalMealPlans,
          totalFavorites,
          usersByRole,
          recipesByCourse,
          recipesByCuisine,
        ] = await Promise.all([
          prisma.user.count({
            where: dateFilter.gte || dateFilter.lte ? { createdAt: dateFilter } : {},
          }),
          prisma.recipe.count({
            where: dateFilter.gte || dateFilter.lte ? { createdAt: dateFilter } : {},
          }),
          prisma.mealPlan.count({
            where: dateFilter.gte || dateFilter.lte ? { createdAt: dateFilter } : {},
          }),
          prisma.favorite.count({
            where: dateFilter.gte || dateFilter.lte ? { createdAt: dateFilter } : {},
          }),
          prisma.user.groupBy({
            by: ['role'],
            _count: true,
            where: dateFilter.gte || dateFilter.lte ? { createdAt: dateFilter } : {},
          }),
          prisma.recipe.groupBy({
            by: ['course'],
            _count: true,
            where: dateFilter.gte || dateFilter.lte ? { createdAt: dateFilter } : {},
          }),
          prisma.recipe.groupBy({
            by: ['cuisine'],
            _count: true,
            where: dateFilter.gte || dateFilter.lte ? { createdAt: dateFilter } : {},
          }),
        ]);

        csvData = [
          { Metric: 'Total Users', Value: totalUsers },
          { Metric: 'Total Recipes', Value: totalRecipes },
          { Metric: 'Total Meal Plans', Value: totalMealPlans },
          { Metric: 'Total Favorites', Value: totalFavorites },
          { Metric: '', Value: '' }, // Empty row
          { Metric: 'Users by Role', Value: '' },
          ...usersByRole.map((item) => ({
            Metric: `  ${item.role}`,
            Value: item._count,
          })),
          { Metric: '', Value: '' }, // Empty row
          { Metric: 'Recipes by Course', Value: '' },
          ...recipesByCourse.map((item) => ({
            Metric: `  ${item.course || 'Unspecified'}`,
            Value: item._count,
          })),
          { Metric: '', Value: '' }, // Empty row
          { Metric: 'Recipes by Cuisine', Value: '' },
          ...recipesByCuisine.map((item) => ({
            Metric: `  ${item.cuisine || 'Unspecified'}`,
            Value: item._count,
          })),
        ];

        filename = generateCSVFilename('analytics_overview');
        break;
      }
    }

    // Generate CSV
    const csv = arrayToCSV(csvData);

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'EXPORT',
        entityType: 'analytics',
        entityId: exportType,
        changes: JSON.stringify({
          exportType,
          startDate,
          endDate,
          recordCount: csvData.length,
        }),
        ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
        userAgent: req.headers.get('user-agent') || 'unknown',
      },
    });

    // Return CSV file
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Error exporting analytics:', error);
    return NextResponse.json(
      { error: 'Failed to export analytics' },
      { status: 500 }
    );
  }
}
