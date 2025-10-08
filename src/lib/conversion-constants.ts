/**
 * Precise Conversion Constants
 * 
 * All conversion factors use precise scientific values.
 * Keep full precision here; round only for display.
 */

// Temperature conversions
export const KELVIN_TO_CELSIUS_OFFSET = 273.15;
export const FAHRENHEIT_TO_CELSIUS_MULTIPLIER = 5 / 9;
export const CELSIUS_TO_FAHRENHEIT_MULTIPLIER = 9 / 5;
export const FAHRENHEIT_TO_CELSIUS_OFFSET = 32;

// Speed conversions
export const METERS_PER_SECOND_TO_MPH = 2.23694; // Precise value
export const METERS_PER_SECOND_TO_KPH = 3.6;
export const MPH_TO_METERS_PER_SECOND = 0.44704;
export const METERS_PER_MILE = 1609.344; // Precise international mile

// Volume conversions (liquid)
export const CUPS_PER_LITER = 4.22675;
export const LITERS_PER_QUART = 0.946353;
export const LITERS_PER_GALLON = 3.78541;
export const TABLESPOONS_PER_CUP = 16;
export const TEASPOONS_PER_TABLESPOON = 3;
export const MILLILITERS_PER_CUP = 236.588;
export const MILLILITERS_PER_TABLESPOON = 14.7868;
export const MILLILITERS_PER_TEASPOON = 4.92892;

// Weight conversions
export const GRAMS_PER_OUNCE = 28.3495;
export const GRAMS_PER_POUND = 453.592;
export const KILOGRAMS_PER_POUND = 0.453592;
export const OUNCES_PER_POUND = 16;

// Nutrition constants
export const CALORIES_PER_GRAM_PROTEIN = 4;
export const CALORIES_PER_GRAM_CARBS = 4;
export const CALORIES_PER_GRAM_FAT = 9;
export const CALORIES_PER_GRAM_ALCOHOL = 7;

// Time conversions
export const MILLISECONDS_PER_SECOND = 1000;
export const SECONDS_PER_MINUTE = 60;
export const MINUTES_PER_HOUR = 60;
export const HOURS_PER_DAY = 24;
export const DAYS_PER_WEEK = 7;
export const MILLISECONDS_PER_MINUTE = 60000;

// Air Quality Index (AQI) category midpoints
export const AQI_CATEGORIES = {
  good: 25,          // 0-50
  moderate: 75,      // 51-100
  unhealthy_sensitive: 125, // 101-150
  unhealthy: 175,    // 151-200
  very_unhealthy: 250, // 201-300
  hazardous: 400,    // 301-500
} as const;

/**
 * Convert Kelvin to Fahrenheit with 1 decimal place
 */
export function kelvinToFahrenheit(kelvin: number): number {
  const celsius = kelvin - KELVIN_TO_CELSIUS_OFFSET;
  const fahrenheit = celsius * CELSIUS_TO_FAHRENHEIT_MULTIPLIER + FAHRENHEIT_TO_CELSIUS_OFFSET;
  return Math.round(fahrenheit * 10) / 10; // 1 decimal place
}

/**
 * Convert Celsius to Fahrenheit
 */
export function celsiusToFahrenheit(celsius: number): number {
  return celsius * CELSIUS_TO_FAHRENHEIT_MULTIPLIER + FAHRENHEIT_TO_CELSIUS_OFFSET;
}

/**
 * Convert Fahrenheit to Celsius
 */
export function fahrenheitToCelsius(fahrenheit: number): number {
  return (fahrenheit - FAHRENHEIT_TO_CELSIUS_OFFSET) * FAHRENHEIT_TO_CELSIUS_MULTIPLIER;
}

/**
 * Convert meters per second to miles per hour with 1 decimal place
 */
export function metersPerSecondToMph(mps: number): number {
  return Math.round(mps * METERS_PER_SECOND_TO_MPH * 10) / 10;
}

/**
 * Convert meters per second to kilometers per hour
 */
export function metersPerSecondToKph(mps: number): number {
  return Math.round(mps * METERS_PER_SECOND_TO_KPH * 10) / 10;
}

/**
 * Map AQI value to category midpoint
 */
export function mapAqiToMidpoint(aqi: number): number {
  if (aqi <= 50) return AQI_CATEGORIES.good;
  if (aqi <= 100) return AQI_CATEGORIES.moderate;
  if (aqi <= 150) return AQI_CATEGORIES.unhealthy_sensitive;
  if (aqi <= 200) return AQI_CATEGORIES.unhealthy;
  if (aqi <= 300) return AQI_CATEGORIES.very_unhealthy;
  return AQI_CATEGORIES.hazardous;
}
