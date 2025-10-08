/**
 * Mathematical Utilities - Universal Safety Guards
 * 
 * Provides safe mathematical operations to prevent NaN, Infinity, and other edge cases.
 * Keep full precision internally; round only for display.
 */

/**
 * Safe division that returns 0 instead of NaN/Infinity
 */
export function safeDiv(numerator: number, denominator: number, fallback: number = 0): number {
  if (!isFinite(numerator) || !isFinite(denominator) || denominator === 0) {
    return fallback;
  }
  const result = numerator / denominator;
  return isFinite(result) ? result : fallback;
}

/**
 * Safe percentage calculation (returns 0 for invalid inputs)
 */
export function safePercentage(value: number, total: number): number {
  return safeDiv(value, total, 0) * 100;
}

/**
 * Safe average calculation (handles empty arrays)
 */
export function safeAverage(values: number[]): number {
  if (!values || values.length === 0) return 0;
  const validValues = values.filter(v => isFinite(v));
  if (validValues.length === 0) return 0;
  const sum = validValues.reduce((acc, val) => acc + val, 0);
  return safeDiv(sum, validValues.length, 0);
}

/**
 * Clamp a value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Clamp time delta to non-negative
 */
export function clampTimeDelta(minutes: number): number {
  return Math.max(0, minutes);
}

/**
 * Round to specified decimal places (for display only)
 */
export function roundToDP(value: number, decimalPlaces: number): number {
  if (!isFinite(value)) return 0;
  const multiplier = Math.pow(10, decimalPlaces);
  return Math.round(value * multiplier) / multiplier;
}

/**
 * Format for display with specified decimal places
 */
export function formatNumber(value: number, decimalPlaces: number = 0): number {
  if (!isFinite(value)) return 0;
  return roundToDP(value, decimalPlaces);
}

/**
 * Ensure macro percentages sum to 100% (enforce invariant)
 * Computes first two, sets third to 100 - (p1 + p2)
 */
export function normalizeMacroPercentages(
  protein: number,
  carbs: number,
  fat: number,
  totalCalories: number
): { proteinPercent: number; carbsPercent: number; fatPercent: number } {
  // Calories per gram
  const PROTEIN_CAL_PER_G = 4;
  const CARBS_CAL_PER_G = 4;
  const FAT_CAL_PER_G = 9;

  const proteinCalories = protein * PROTEIN_CAL_PER_G;
  const carbsCalories = carbs * CARBS_CAL_PER_G;
  const fatCalories = fat * FAT_CAL_PER_G;
  
  const calculatedTotal = proteinCalories + carbsCalories + fatCalories;
  
  // If no calories, return zeros
  if (calculatedTotal === 0) {
    return { proteinPercent: 0, carbsPercent: 0, fatPercent: 0 };
  }

  // Calculate first two percentages
  const proteinPercent = Math.round(safeDiv(proteinCalories, calculatedTotal, 0) * 100);
  const carbsPercent = Math.round(safeDiv(carbsCalories, calculatedTotal, 0) * 100);
  
  // Set third to ensure sum = 100
  const fatPercent = 100 - (proteinPercent + carbsPercent);

  return {
    proteinPercent: clamp(proteinPercent, 0, 100),
    carbsPercent: clamp(carbsPercent, 0, 100),
    fatPercent: clamp(fatPercent, 0, 100),
  };
}

/**
 * Safe sum of array (handles empty arrays and invalid values)
 */
export function safeSum(values: number[]): number {
  if (!values || values.length === 0) return 0;
  return values.filter(v => isFinite(v)).reduce((acc, val) => acc + val, 0);
}

/**
 * Cap progress at maximum percentage (for UI bars)
 */
export function capProgress(current: number, target: number, maxPercent: number = 100): number {
  const percentage = safePercentage(current, target);
  return Math.min(percentage, maxPercent);
}

/**
 * Require minimum sample size for trend detection
 */
export function hasMinimumSampleSize(dataPoints: number, minimum: number = 4): boolean {
  return dataPoints >= minimum;
}

/**
 * Guard short ranges for weekly calculations
 */
export function safeWeeksFromDays(days: number): number {
  return Math.max(1, days / 7);
}
