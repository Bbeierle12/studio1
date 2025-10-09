/**
 * Culinary Analytics Tracker
 * Tracks co-occurrence patterns and trends in recipe classifications
 */

import type { CulinaryClassification } from '@/types/culinary-taxonomy';

export interface ClassificationPattern {
  combination: string[];
  count: number;
  avgPrepTime?: number;
  avgCookTime?: number;
  commonIngredients?: string[];
  lastSeen: Date;
}

export interface AnalyticsStats {
  totalRecipes: number;
  topCombinations: ClassificationPattern[];
  byRegion: Record<string, number>;
  byCourse: Record<string, number>;
  byMethod: Record<string, number>;
  flavorTrends: {
    avgSpice: number;
    avgAcid: number;
    avgFat: number;
    avgUmami: number;
    avgSweet: number;
    avgBitter: number;
  };
}

/**
 * In-memory analytics store (replace with database in production)
 */
export class CulinaryAnalyticsTracker {
  private patterns: Map<string, ClassificationPattern> = new Map();
  private stats: AnalyticsStats = {
    totalRecipes: 0,
    topCombinations: [],
    byRegion: {},
    byCourse: {},
    byMethod: {},
    flavorTrends: {
      avgSpice: 0,
      avgAcid: 0,
      avgFat: 0,
      avgUmami: 0,
      avgSweet: 0,
      avgBitter: 0,
    },
  };

  /**
   * Track a new recipe classification
   */
  trackClassification(
    classification: CulinaryClassification,
    metadata?: {
      prepTime?: number;
      cookTime?: number;
      ingredients?: string[];
    }
  ): void {
    this.stats.totalRecipes++;

    // Track individual dimensions
    if (classification.course) {
      this.stats.byCourse[classification.course] = 
        (this.stats.byCourse[classification.course] || 0) + 1;
    }

    if (classification.cookingMethod && classification.cookingMethod.length > 0) {
      classification.cookingMethod.forEach(method => {
        this.stats.byMethod[method] = (this.stats.byMethod[method] || 0) + 1;
      });
    }

    if (classification.region && classification.region.length > 0) {
      classification.region.forEach(region => {
        this.stats.byRegion[region] = (this.stats.byRegion[region] || 0) + 1;
      });
    }

    // Track co-occurrence patterns
    const patternKey = this.generatePatternKey(classification);
    const existing = this.patterns.get(patternKey);

    if (existing) {
      existing.count++;
      existing.lastSeen = new Date();
      
      // Update rolling averages
      if (metadata?.prepTime) {
        existing.avgPrepTime = existing.avgPrepTime
          ? (existing.avgPrepTime + metadata.prepTime) / 2
          : metadata.prepTime;
      }
      if (metadata?.cookTime) {
        existing.avgCookTime = existing.avgCookTime
          ? (existing.avgCookTime + metadata.cookTime) / 2
          : metadata.cookTime;
      }
      
      // Merge common ingredients
      if (metadata?.ingredients) {
        if (!existing.commonIngredients) {
          existing.commonIngredients = metadata.ingredients;
        } else {
          // Keep most common ingredients
          const combined = [...existing.commonIngredients, ...metadata.ingredients];
          const frequency: Record<string, number> = {};
          combined.forEach(ing => {
            frequency[ing] = (frequency[ing] || 0) + 1;
          });
          existing.commonIngredients = Object.entries(frequency)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10)
            .map(([ing]) => ing);
        }
      }
    } else {
      this.patterns.set(patternKey, {
        combination: [
          classification.course || '',
          classification.cookingMethod?.[0] || '',
          classification.region?.[0] || '',
        ].filter(Boolean),
        count: 1,
        avgPrepTime: metadata?.prepTime,
        avgCookTime: metadata?.cookTime,
        commonIngredients: metadata?.ingredients?.slice(0, 10),
        lastSeen: new Date(),
      });
    }

    // Update flavor trends
    if (classification.flavorDimensions) {
      const total = this.stats.totalRecipes;
      const trends = this.stats.flavorTrends;
      const profile = classification.flavorDimensions;

      trends.avgSpice = ((trends.avgSpice * (total - 1)) + profile.spice) / total;
      trends.avgAcid = ((trends.avgAcid * (total - 1)) + profile.acid) / total;
      trends.avgFat = ((trends.avgFat * (total - 1)) + profile.fat) / total;
      trends.avgUmami = ((trends.avgUmami * (total - 1)) + profile.umami) / total;
      trends.avgSweet = ((trends.avgSweet * (total - 1)) + profile.sweet) / total;
      trends.avgBitter = ((trends.avgBitter * (total - 1)) + profile.bitter) / total;
    }

    // Update top combinations
    this.updateTopCombinations();
  }

  /**
   * Get analytics statistics
   */
  getStats(): AnalyticsStats {
    return { ...this.stats };
  }

  /**
   * Get most common patterns
   */
  getTopPatterns(limit: number = 10): ClassificationPattern[] {
    return this.stats.topCombinations.slice(0, limit);
  }

  /**
   * Find similar recipe patterns
   */
  findSimilarPatterns(classification: CulinaryClassification): ClassificationPattern[] {
    const patternKey = this.generatePatternKey(classification);
    const similar: ClassificationPattern[] = [];

    this.patterns.forEach((pattern, key) => {
      if (key === patternKey) return;
      
      // Calculate similarity score
      const similarity = this.calculateSimilarity(
        patternKey.split('|'),
        pattern.combination
      );

      if (similarity >= 0.5) {
        similar.push(pattern);
      }
    });

    return similar.sort((a, b) => b.count - a.count).slice(0, 5);
  }

  /**
   * Get recommendations based on partial classification
   */
  getRecommendations(classification: Partial<CulinaryClassification>): {
    suggestedMethods?: string[];
    suggestedRegions?: string[];
    avgPrepTime?: number;
    avgCookTime?: number;
  } {
    const partial = this.generatePatternKey(classification as CulinaryClassification);
    const matches: ClassificationPattern[] = [];

    this.patterns.forEach((pattern) => {
      const patternStr = pattern.combination.join('|');
      const partialParts = partial.split('|').filter(Boolean);
      
      // Check if pattern matches any part of the partial classification
      if (partialParts.some(part => patternStr.includes(part))) {
        matches.push(pattern);
      }
    });

    if (matches.length === 0) return {};

    // Aggregate recommendations
    const methodCounts: Record<string, number> = {};
    const regionCounts: Record<string, number> = {};
    let totalPrepTime = 0;
    let totalCookTime = 0;
    let prepCount = 0;
    let cookCount = 0;

    matches.forEach((match) => {
      const [, method, region] = match.combination;
      if (method) methodCounts[method] = (methodCounts[method] || 0) + match.count;
      if (region) regionCounts[region] = (regionCounts[region] || 0) + match.count;

      if (match.avgPrepTime) {
        totalPrepTime += match.avgPrepTime;
        prepCount++;
      }
      if (match.avgCookTime) {
        totalCookTime += match.avgCookTime;
        cookCount++;
      }
    });

    return {
      suggestedMethods: Object.entries(methodCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([method]) => method),
      suggestedRegions: Object.entries(regionCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([region]) => region),
      avgPrepTime: prepCount > 0 ? Math.round(totalPrepTime / prepCount) : undefined,
      avgCookTime: cookCount > 0 ? Math.round(totalCookTime / cookCount) : undefined,
    };
  }

  /**
   * Export analytics data (for persistence)
   */
  exportData(): {
    patterns: Array<[string, ClassificationPattern]>;
    stats: AnalyticsStats;
  } {
    return {
      patterns: Array.from(this.patterns.entries()),
      stats: this.stats,
    };
  }

  /**
   * Import analytics data (for restoration)
   */
  importData(data: {
    patterns: Array<[string, ClassificationPattern]>;
    stats: AnalyticsStats;
  }): void {
    this.patterns = new Map(data.patterns.map(([key, pattern]) => [
      key,
      { ...pattern, lastSeen: new Date(pattern.lastSeen) }
    ]));
    this.stats = data.stats;
  }

  /**
   * Reset analytics (useful for testing)
   */
  reset(): void {
    this.patterns.clear();
    this.stats = {
      totalRecipes: 0,
      topCombinations: [],
      byRegion: {},
      byCourse: {},
      byMethod: {},
      flavorTrends: {
        avgSpice: 0,
        avgAcid: 0,
        avgFat: 0,
        avgUmami: 0,
        avgSweet: 0,
        avgBitter: 0,
      },
    };
  }

  // Private helpers

  private generatePatternKey(classification: CulinaryClassification): string {
    return [
      classification.course || '',
      classification.cookingMethod?.[0] || '',
      classification.region?.[0] || '',
    ]
      .filter(Boolean)
      .join('|');
  }

  private updateTopCombinations(): void {
    this.stats.topCombinations = Array.from(this.patterns.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);
  }

  private calculateSimilarity(arr1: string[], arr2: string[]): number {
    const set1 = new Set(arr1);
    const set2 = new Set(arr2);
    const intersection = new Set([...set1].filter((x) => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    return union.size > 0 ? intersection.size / union.size : 0;
  }
}

// Singleton instance
export const analyticsTracker = new CulinaryAnalyticsTracker();
