/**
 * Math Utilities Test Suite
 * 
 * Tests critical mathematical operations to ensure reliability.
 * Run with: npm test or npx vitest
 */

import { describe, it, expect } from 'vitest';
import {
  safeDiv,
  safePercentage,
  safeAverage,
  clamp,
  clampTimeDelta,
  normalizeMacroPercentages,
  capProgress,
  hasMinimumSampleSize,
  safeWeeksFromDays,
} from '../src/lib/math-utils';

describe('Math Utils - Safe Operations', () => {
  describe('safeDiv', () => {
    it('should handle division by zero', () => {
      expect(safeDiv(10, 0)).toBe(0);
      expect(safeDiv(10, 0, 99)).toBe(99);
    });

    it('should return fallback for NaN inputs', () => {
      expect(safeDiv(NaN, 5)).toBe(0);
      expect(safeDiv(5, NaN)).toBe(0);
      expect(safeDiv(Infinity, 5, 100)).toBe(100);
    });

    it('should perform normal division', () => {
      expect(safeDiv(10, 2)).toBe(5);
      expect(safeDiv(7, 2)).toBe(3.5);
    });
  });

  describe('safePercentage', () => {
    it('should calculate percentages correctly', () => {
      expect(safePercentage(50, 100)).toBe(50);
      expect(safePercentage(1, 4)).toBe(25);
    });

    it('should return 0 for zero denominators', () => {
      expect(safePercentage(10, 0)).toBe(0);
    });

    it('should handle edge cases', () => {
      expect(safePercentage(0, 100)).toBe(0);
      expect(safePercentage(100, 100)).toBe(100);
    });
  });

  describe('safeAverage', () => {
    it('should calculate averages correctly', () => {
      expect(safeAverage([1, 2, 3, 4, 5])).toBe(3);
      expect(safeAverage([10, 20])).toBe(15);
    });

    it('should handle empty arrays', () => {
      expect(safeAverage([])).toBe(0);
    });

    it('should filter out invalid values', () => {
      expect(safeAverage([1, 2, NaN, 3])).toBe(2);
      expect(safeAverage([Infinity, 5, 10])).toBe(7.5);
    });
  });

  describe('clampTimeDelta', () => {
    it('should clamp negative values to 0', () => {
      expect(clampTimeDelta(-10)).toBe(0);
      expect(clampTimeDelta(-1)).toBe(0);
    });

    it('should preserve positive values', () => {
      expect(clampTimeDelta(10)).toBe(10);
      expect(clampTimeDelta(0)).toBe(0);
    });
  });
});

describe('Nutrition Calculations', () => {
  describe('normalizeMacroPercentages', () => {
    it('should always sum to 100%', () => {
      const result = normalizeMacroPercentages(30, 40, 20, 500);
      expect(result.proteinPercent + result.carbsPercent + result.fatPercent).toBe(100);
    });

    it('should handle zero calories', () => {
      const result = normalizeMacroPercentages(0, 0, 0, 0);
      expect(result.proteinPercent).toBe(0);
      expect(result.carbsPercent).toBe(0);
      expect(result.fatPercent).toBe(0);
    });

    it('should calculate standard macro ratios correctly', () => {
      // 100g protein = 400 cal, 100g carbs = 400 cal, 100g fat = 900 cal
      // Total = 1700 cal
      // Expected: ~24% protein, ~24% carbs, ~52% fat (should sum to 100)
      const result = normalizeMacroPercentages(100, 100, 100, 1700);
      expect(result.proteinPercent + result.carbsPercent + result.fatPercent).toBe(100);
      expect(result.proteinPercent).toBeGreaterThanOrEqual(23);
      expect(result.proteinPercent).toBeLessThanOrEqual(24);
      expect(result.fatPercent).toBeGreaterThanOrEqual(52);
    });

    it('should clamp percentages between 0-100', () => {
      const result = normalizeMacroPercentages(200, 50, 10, 1000);
      expect(result.proteinPercent).toBeGreaterThanOrEqual(0);
      expect(result.proteinPercent).toBeLessThanOrEqual(100);
      expect(result.carbsPercent).toBeGreaterThanOrEqual(0);
      expect(result.carbsPercent).toBeLessThanOrEqual(100);
      expect(result.fatPercent).toBeGreaterThanOrEqual(0);
      expect(result.fatPercent).toBeLessThanOrEqual(100);
    });
  });

  describe('capProgress', () => {
    it('should cap progress at max percentage', () => {
      expect(capProgress(150, 100, 100)).toBe(100);
      expect(capProgress(200, 100, 100)).toBe(100);
    });

    it('should allow uncapped progress', () => {
      expect(capProgress(150, 100, Infinity)).toBe(150);
    });

    it('should handle zero target safely', () => {
      expect(capProgress(10, 0, 100)).toBe(0);
    });
  });
});

describe('Analytics Guards', () => {
  describe('hasMinimumSampleSize', () => {
    it('should require minimum sample size', () => {
      expect(hasMinimumSampleSize(3, 4)).toBe(false);
      expect(hasMinimumSampleSize(4, 4)).toBe(true);
      expect(hasMinimumSampleSize(5, 4)).toBe(true);
    });
  });

  describe('safeWeeksFromDays', () => {
    it('should guard short ranges', () => {
      expect(safeWeeksFromDays(0)).toBe(1);
      expect(safeWeeksFromDays(3)).toBeCloseTo(1); // Should be ≥1
      expect(safeWeeksFromDays(7)).toBe(1);
      expect(safeWeeksFromDays(14)).toBe(2);
    });
  });
});

describe('Conversion Constants', () => {
  it('should use precise temperature conversion', () => {
    const { kelvinToFahrenheit } = require('@/lib/conversion-constants');
    
    // Water boiling point: 373.15 K = 212°F
    expect(kelvinToFahrenheit(373.15)).toBeCloseTo(212, 1);
    
    // Water freezing point: 273.15 K = 32°F
    expect(kelvinToFahrenheit(273.15)).toBeCloseTo(32, 1);
    
    // Room temperature: 293.15 K = 68°F
    expect(kelvinToFahrenheit(293.15)).toBeCloseTo(68, 1);
  });

  it('should use precise speed conversion', () => {
    const { metersPerSecondToMph } = require('@/lib/conversion-constants');
    
    // 10 m/s ≈ 22.4 mph
    expect(metersPerSecondToMph(10)).toBeCloseTo(22.4, 1);
    
    // 5 m/s ≈ 11.2 mph
    expect(metersPerSecondToMph(5)).toBeCloseTo(11.2, 1);
  });
});

describe('Edge Cases and Reliability', () => {
  it('should never produce NaN from zero denominators', () => {
    expect(Number.isNaN(safeDiv(10, 0))).toBe(false);
    expect(Number.isNaN(safePercentage(10, 0))).toBe(false);
    expect(Number.isNaN(safeAverage([]))).toBe(false);
  });

  it('should never produce Infinity', () => {
    expect(Number.isFinite(safeDiv(10, 0))).toBe(true);
    expect(Number.isFinite(safePercentage(10, 0))).toBe(true);
    expect(Number.isFinite(safeAverage([Infinity]))).toBe(true);
  });

  it('should always produce non-negative time deltas', () => {
    expect(clampTimeDelta(-100)).toBeGreaterThanOrEqual(0);
    expect(clampTimeDelta(-1)).toBeGreaterThanOrEqual(0);
    expect(clampTimeDelta(0)).toBeGreaterThanOrEqual(0);
  });
});
