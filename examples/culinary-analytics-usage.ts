/**
 * Example: Using the Culinary Analytics Tracker
 * 
 * This file demonstrates how to use the analytics tracking system
 * to monitor recipe patterns and get recommendations.
 */

import { analyticsTracker } from '@/lib/culinary/analytics-tracker';
import type { CulinaryClassification } from '@/types/culinary-taxonomy';

// ============================================================================
// Example 1: Tracking a Recipe Classification
// ============================================================================

export function trackRecipeExample() {
  const classification: CulinaryClassification = {
    course: 'dinner',
    dishForm: 'plated_entree',
    ingredientDomain: 'protein',
    cookingMethod: ['grilled_charred'],
    region: ['southwestern'],
    flavorProfiles: ['spicy_hot', 'smoky_earthy'],
    flavorDimensions: {
      spice: 4,
      acid: 2,
      fat: 3,
      umami: 4,
      sweet: 1,
      bitter: 0,
    },
    dietaryTags: ['gluten_free'],
    contextualTags: ['quick'],
    aromaticBase: 'HOLY_TRINITY',
    spiceSignature: 'CAJUN',
    keySpices: ['cayenne', 'paprika', 'thyme'],
  };

  // Track the classification
  analyticsTracker.trackClassification(classification, {
    prepTime: 15,
    cookTime: 25,
    ingredients: ['chicken breast', 'bell pepper', 'onion', 'celery', 'cajun spice'],
  });

  console.log('✅ Recipe tracked successfully');
}

// ============================================================================
// Example 2: Getting Analytics Statistics
// ============================================================================

export function getAnalyticsExample() {
  const stats = analyticsTracker.getStats();

  console.log('📊 Analytics Statistics:');
  console.log(`Total Recipes: ${stats.totalRecipes}`);
  console.log('\n🔥 Top Combinations:');
  stats.topCombinations.slice(0, 5).forEach((pattern, index) => {
    console.log(`${index + 1}. ${pattern.combination.join(' + ')}`);
    console.log(`   Count: ${pattern.count}`);
    console.log(`   Avg Prep: ${pattern.avgPrepTime || 'N/A'} min`);
    console.log(`   Avg Cook: ${pattern.avgCookTime || 'N/A'} min`);
  });

  console.log('\n🌶️ Flavor Trends:');
  console.log(`Spice: ${stats.flavorTrends.avgSpice.toFixed(1)}/5`);
  console.log(`Acid: ${stats.flavorTrends.avgAcid.toFixed(1)}/5`);
  console.log(`Fat: ${stats.flavorTrends.avgFat.toFixed(1)}/5`);
  console.log(`Umami: ${stats.flavorTrends.avgUmami.toFixed(1)}/5`);
  console.log(`Sweet: ${stats.flavorTrends.avgSweet.toFixed(1)}/5`);
  console.log(`Bitter: ${stats.flavorTrends.avgBitter.toFixed(1)}/5`);

  console.log('\n🌎 Popular Regions:');
  Object.entries(stats.byRegion)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .forEach(([region, count]) => {
      console.log(`${region}: ${count} recipes`);
    });

  return stats;
}

// ============================================================================
// Example 3: Finding Similar Recipes
// ============================================================================

export function findSimilarRecipesExample() {
  const targetRecipe: CulinaryClassification = {
    course: 'dinner',
    cookingMethod: ['grilled_charred'],
    region: ['italian'],
    dietaryTags: [],
  };

  const similar = analyticsTracker.findSimilarPatterns(targetRecipe);

  console.log('🔍 Similar Recipe Patterns:');
  similar.forEach((pattern, index) => {
    console.log(`${index + 1}. ${pattern.combination.join(' + ')}`);
    console.log(`   Seen ${pattern.count} times`);
    console.log(`   Common ingredients: ${pattern.commonIngredients?.slice(0, 3).join(', ')}`);
  });

  return similar;
}

// ============================================================================
// Example 4: Getting Smart Recommendations
// ============================================================================

export function getRecommendationsExample() {
  // User has selected "dinner" course
  const partialClassification = {
    course: 'dinner' as const,
  };

  const recommendations = analyticsTracker.getRecommendations(partialClassification);

  console.log('💡 Smart Recommendations:');
  
  if (recommendations.suggestedMethods) {
    console.log('\nSuggested Cooking Methods:');
    recommendations.suggestedMethods.forEach((method, index) => {
      console.log(`${index + 1}. ${method}`);
    });
  }

  if (recommendations.suggestedRegions) {
    console.log('\nSuggested Regions:');
    recommendations.suggestedRegions.forEach((region, index) => {
      console.log(`${index + 1}. ${region}`);
    });
  }

  if (recommendations.avgPrepTime) {
    console.log(`\nTypical Prep Time: ${recommendations.avgPrepTime} minutes`);
  }

  if (recommendations.avgCookTime) {
    console.log(`Typical Cook Time: ${recommendations.avgCookTime} minutes`);
  }

  return recommendations;
}

// ============================================================================
// Example 5: Exporting Data for Persistence
// ============================================================================

export async function exportAnalyticsExample() {
  const data = analyticsTracker.exportData();

  console.log('💾 Exporting analytics data...');
  console.log(`Total patterns: ${data.patterns.length}`);
  console.log(`Total recipes tracked: ${data.stats.totalRecipes}`);

  // In production, you would save this to a database
  // Example with Prisma:
  /*
  await prisma.analytics.upsert({
    where: { id: 'global' },
    create: {
      id: 'global',
      data: JSON.stringify(data),
      updatedAt: new Date(),
    },
    update: {
      data: JSON.stringify(data),
      updatedAt: new Date(),
    },
  });
  */

  // For now, save to file (development only)
  const fs = await import('fs/promises');
  await fs.writeFile(
    './analytics-export.json',
    JSON.stringify(data, null, 2)
  );

  console.log('✅ Analytics data exported to analytics-export.json');

  return data;
}

// ============================================================================
// Example 6: Importing Data (Restore on App Start)
// ============================================================================

export async function importAnalyticsExample() {
  try {
    const fs = await import('fs/promises');
    const fileContent = await fs.readFile('./analytics-export.json', 'utf-8');
    const data = JSON.parse(fileContent);

    analyticsTracker.importData(data);

    console.log('✅ Analytics data imported successfully');
    console.log(`Restored ${data.stats.totalRecipes} recipe patterns`);
  } catch (error) {
    console.log('ℹ️ No existing analytics data found. Starting fresh.');
  }
}

// ============================================================================
// Example 7: Complete Workflow
// ============================================================================

export async function completeWorkflowExample() {
  console.log('🚀 Starting Complete Analytics Workflow\n');

  // Step 1: Import existing data (if any)
  await importAnalyticsExample();
  console.log('\n---\n');

  // Step 2: Track some recipes
  console.log('📝 Tracking sample recipes...\n');
  
  // Track a grilled southwestern dish
  trackRecipeExample();
  
  // Track a few more Italian dishes
  for (let i = 0; i < 3; i++) {
    analyticsTracker.trackClassification({
      course: 'dinner',
      cookingMethod: ['roasted_baked'],
      region: ['italian'],
      dietaryTags: [],
    }, { prepTime: 20, cookTime: 30 });
  }
  
  console.log('✅ Tracked 4 recipes\n');
  console.log('---\n');

  // Step 3: View statistics
  getAnalyticsExample();
  console.log('\n---\n');

  // Step 4: Find similar recipes
  findSimilarRecipesExample();
  console.log('\n---\n');

  // Step 5: Get recommendations
  getRecommendationsExample();
  console.log('\n---\n');

  // Step 6: Export data
  await exportAnalyticsExample();
  
  console.log('\n✨ Workflow complete!');
}

// ============================================================================
// Usage in React Components
// ============================================================================

/*
// Example: In a recipe creation form
import { analyticsTracker } from '@/lib/culinary/analytics-tracker';

function RecipeForm() {
  const [classification, setClassification] = useState<CulinaryClassification>({});
  
  // Get recommendations as user fills out the form
  useEffect(() => {
    if (classification.course) {
      const recs = analyticsTracker.getRecommendations(classification);
      
      // Show suggested cooking methods
      if (recs.suggestedMethods) {
        setSuggestedMethods(recs.suggestedMethods);
      }
      
      // Pre-fill estimated times
      if (recs.avgPrepTime) {
        setPrepTime(recs.avgPrepTime);
      }
    }
  }, [classification]);
  
  const handleSubmit = (recipe) => {
    // Track the classification
    analyticsTracker.trackClassification(classification, {
      prepTime: recipe.prepTime,
      cookTime: recipe.cookTime,
      ingredients: recipe.ingredients,
    });
    
    // Save recipe...
  };
}
*/

// ============================================================================
// Usage in API Routes
// ============================================================================

/*
// Example: In /api/recipes/analyze route
import { NextResponse } from 'next/server';
import { analyticsTracker } from '@/lib/culinary/analytics-tracker';

export async function POST(request: Request) {
  const { recipe } = await request.json();
  
  // Classify the recipe
  const classification = await classifyRecipe(recipe);
  
  // Track it
  analyticsTracker.trackClassification(classification, {
    prepTime: recipe.prepTime,
    cookTime: recipe.cookTime,
    ingredients: recipe.ingredients.map(i => i.name),
  });
  
  // Get recommendations
  const recommendations = analyticsTracker.getRecommendations(classification);
  
  return NextResponse.json({
    classification,
    recommendations,
  });
}
*/

// Run the complete workflow if this file is executed directly
if (require.main === module) {
  completeWorkflowExample();
}
