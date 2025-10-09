import { describe, it, expect, beforeEach } from 'vitest';
import { CulinaryAnalyticsTracker } from '@/lib/culinary/analytics-tracker';
import type { CulinaryClassification } from '@/types/culinary-taxonomy';

describe('CulinaryAnalyticsTracker', () => {
  let tracker: CulinaryAnalyticsTracker;

  beforeEach(() => {
    tracker = new CulinaryAnalyticsTracker();
  });

  it('should track recipe classifications', () => {
    const classification: CulinaryClassification = {
      course: 'dinner',
      dishForm: 'plated_entree',
      ingredientDomain: 'protein',
      cookingMethod: ['grilled_charred'],
      region: ['southwestern'],
      flavorDimensions: {
        spice: 3,
        acid: 2,
        fat: 4,
        umami: 5,
        sweet: 1,
        bitter: 0,
      },
      dietaryTags: [],
    };

    tracker.trackClassification(classification, {
      prepTime: 15,
      cookTime: 25,
    });

    const stats = tracker.getStats();
    expect(stats.totalRecipes).toBe(1);
    expect(stats.byCourse['dinner']).toBe(1);
    expect(stats.byMethod['grilled_charred']).toBe(1);
    expect(stats.byRegion['southwestern']).toBe(1);
  });

  it('should identify co-occurrence patterns', () => {
    const baseClassification: CulinaryClassification = {
      course: 'dinner',
      dishForm: 'plated_entree',
      ingredientDomain: 'protein',
      cookingMethod: ['grilled_charred'],
      region: ['southwestern'],
      flavorDimensions: {
        spice: 3,
        acid: 2,
        fat: 4,
        umami: 5,
        sweet: 1,
        bitter: 0,
      },
      dietaryTags: [],
    };

    // Track same pattern 5 times
    for (let i = 0; i < 5; i++) {
      tracker.trackClassification(baseClassification);
    }

    const patterns = tracker.getTopPatterns(5);
    expect(patterns.length).toBeGreaterThan(0);
    expect(patterns[0].count).toBe(5);
    expect(patterns[0].combination).toContain('dinner');
    expect(patterns[0].combination).toContain('grilled_charred');
    expect(patterns[0].combination).toContain('southwestern');
  });

  it('should calculate flavor trends', () => {
    const spicyRecipe: CulinaryClassification = {
      course: 'dinner',
      flavorDimensions: { 
        spice: 5, 
        acid: 2, 
        fat: 3, 
        umami: 4, 
        sweet: 1, 
        bitter: 0 
      },
      dietaryTags: [],
    };

    const mildRecipe: CulinaryClassification = {
      course: 'breakfast',
      flavorDimensions: { 
        spice: 1, 
        acid: 1, 
        fat: 2, 
        umami: 2, 
        sweet: 4, 
        bitter: 0 
      },
      dietaryTags: [],
    };

    tracker.trackClassification(spicyRecipe);
    tracker.trackClassification(mildRecipe);

    const stats = tracker.getStats();
    expect(stats.flavorTrends.avgSpice).toBe(3); // (5 + 1) / 2
    expect(stats.flavorTrends.avgSweet).toBe(2.5); // (1 + 4) / 2
  });

  it('should find similar patterns', () => {
    const grilled1: CulinaryClassification = {
      course: 'dinner',
      cookingMethod: ['grilled_charred'],
      region: ['southwestern'],
      dietaryTags: [],
    };

    const grilled2: CulinaryClassification = {
      course: 'dinner',
      cookingMethod: ['grilled_charred'],
      region: ['french'],
      dietaryTags: [],
    };

    const baked: CulinaryClassification = {
      course: 'dessert',
      cookingMethod: ['roasted_baked'],
      region: ['french'],
      dietaryTags: [],
    };

    tracker.trackClassification(grilled1);
    tracker.trackClassification(grilled2);
    tracker.trackClassification(baked);

    const similar = tracker.findSimilarPatterns(grilled1);
    expect(similar.length).toBeGreaterThan(0);
    expect(similar[0].combination).toContain('grilled_charred');
  });

  it('should provide recommendations based on partial classification', () => {
    // Train with some data
    for (let i = 0; i < 3; i++) {
      tracker.trackClassification({
        course: 'dinner',
        cookingMethod: ['grilled_charred'],
        region: ['french'],
        dietaryTags: [],
      }, { prepTime: 20, cookTime: 15 });
    }

    const recommendations = tracker.getRecommendations({
      course: 'dinner',
    });

    expect(recommendations.suggestedMethods).toContain('grilled_charred');
    expect(recommendations.suggestedRegions).toContain('french');
    expect(recommendations.avgPrepTime).toBe(20);
    expect(recommendations.avgCookTime).toBe(15);
  });

  it('should handle multiple cooking methods and regions', () => {
    const classification: CulinaryClassification = {
      course: 'dinner',
      cookingMethod: ['grilled_charred', 'sauteed_stirfried'],
      region: ['chinese', 'japanese'],
      dietaryTags: [],
    };

    tracker.trackClassification(classification);

    const stats = tracker.getStats();
    expect(stats.byMethod['grilled_charred']).toBe(1);
    expect(stats.byMethod['sauteed_stirfried']).toBe(1);
    expect(stats.byRegion['chinese']).toBe(1);
    expect(stats.byRegion['japanese']).toBe(1);
  });

  it('should update rolling averages for prep and cook times', () => {
    const classification: CulinaryClassification = {
      course: 'dinner',
      cookingMethod: ['grilled_charred'],
      region: ['southwestern'],
      dietaryTags: [],
    };

    tracker.trackClassification(classification, { prepTime: 10, cookTime: 20 });
    tracker.trackClassification(classification, { prepTime: 20, cookTime: 30 });

    const patterns = tracker.getTopPatterns(1);
    expect(patterns[0].avgPrepTime).toBe(15); // (10 + 20) / 2
    expect(patterns[0].avgCookTime).toBe(25); // (20 + 30) / 2
  });

  it('should export and import data', () => {
    const classification: CulinaryClassification = {
      course: 'dinner',
      cookingMethod: ['grilled_charred'],
      region: ['southwestern'],
      dietaryTags: [],
    };

    tracker.trackClassification(classification);
    const exported = tracker.exportData();

    const newTracker = new CulinaryAnalyticsTracker();
    newTracker.importData(exported);

    const stats = newTracker.getStats();
    expect(stats.totalRecipes).toBe(1);
  });

  it('should reset analytics', () => {
    const classification: CulinaryClassification = {
      course: 'dinner',
      dietaryTags: [],
    };

    tracker.trackClassification(classification);
    expect(tracker.getStats().totalRecipes).toBe(1);

    tracker.reset();
    expect(tracker.getStats().totalRecipes).toBe(0);
  });
});
