/**
 * User Data Export API
 * CCPA/GDPR Compliance - Right to Access
 * Allows users to download all their personal data
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/data';
import { withErrorHandler, ApiError } from '@/lib/api-utils';

async function handleDataExport(request: NextRequest) {
  // Authenticate user
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    throw ApiError.unauthorized('Please sign in to export your data');
  }

  // Get user with all related data
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      recipes: {
        select: {
          id: true,
          title: true,
          ingredients: true,
          instructions: true,
          course: true,
          cuisine: true,
          prepTime: true,
          servings: true,
          createdAt: true,
          updatedAt: true,
        }
      },
      mealPlans: {
        select: {
          id: true,
          name: true,
          startDate: true,
          endDate: true,
          createdAt: true,
        }
      },
      shoppingLists: {
        select: {
          id: true,
          name: true,
          items: true,
          generatedAt: true,
          updatedAt: true,
        }
      },
      nutritionGoals: {
        select: {
          id: true,
          name: true,
          targetCalories: true,
          targetProtein: true,
          targetCarbs: true,
          targetFat: true,
          startDate: true,
          endDate: true,
          isActive: true,
          createdAt: true,
        }
      },
    }
  });

  if (!user) {
    throw ApiError.notFound('User');
  }

  // Remove sensitive fields
  const { password, openaiApiKey, ...userData } = user;

  // Create comprehensive data export
  const dataExport = {
    exportDate: new Date().toISOString(),
    exportVersion: '1.0',
    dataCategories: {
      personalInformation: {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        bio: userData.bio,
        avatarUrl: userData.avatarUrl,
        role: userData.role,
        createdAt: userData.createdAt,
        updatedAt: userData.updatedAt,
        lastLogin: userData.lastLogin,
      },
      userGeneratedContent: {
        recipes: userData.recipes,
        mealPlans: userData.mealPlans,
        shoppingLists: userData.shoppingLists,
        nutritionGoals: userData.nutritionGoals,
      },
      accountActivity: {
        totalRecipes: userData.recipes.length,
        totalMealPlans: userData.mealPlans.length,
        totalShoppingLists: userData.shoppingLists.length,
        accountAge: Math.floor(
          (Date.now() - new Date(userData.createdAt).getTime()) / (1000 * 60 * 60 * 24)
        ) + ' days',
      },
      privacySettings: {
        hasApiKey: !!openaiApiKey,
        accountStatus: userData.isActive ? 'Active' : 'Inactive',
      }
    },
    metadata: {
      exportFormat: 'JSON',
      dataRetentionPolicy: 'Data retained until account deletion',
      yourRights: {
        rightToAccess: 'You are exercising this right now',
        rightToDelete: 'You can delete your account in Settings',
        rightToCorrect: 'You can update your information in Settings',
        rightToPortability: 'This export is in JSON format for portability',
      },
      contact: {
        forPrivacyQuestions: 'privacy@yourdomain.com', // TODO: Update with your email
        website: process.env.NEXTAUTH_URL,
      }
    }
  };

  // Set headers for file download
  const filename = `ourfamilytable-data-${userData.id}-${new Date().toISOString().split('T')[0]}.json`;
  
  return new NextResponse(JSON.stringify(dataExport, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  });
}

export const GET = withErrorHandler(handleDataExport);
