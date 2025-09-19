import type { WeatherContext } from '../src/lib/types';
import { pickMealTags, getMealRecommendationsDebug } from '../src/lib/meal-recommendations';

/**
 * Test the Forecast-to-Feast recommendation logic with various weather scenarios
 */

// Mock weather contexts for testing
const hotSummerDay: WeatherContext = {
  weather: {
    feelsLike: 88,
    temperature: 85,
    humidity: 65,
    precipitation: 10,
    windSpeed: 8,
    aqi: 45,
    uvIndex: 8,
    visibility: 10,
    description: 'Clear',
    icon: '01d'
  },
  sun: {
    sunrise: new Date('2025-09-19T06:30:00'),
    sunset: new Date('2025-09-19T19:45:00'),
    minutesToSunset: 120,
    minutesToSunrise: -480,
    isDaytime: true
  },
  location: {
    latitude: 37.7749,
    longitude: -122.4194,
    city: 'San Francisco',
    region: 'California',
    country: 'US',
    timezone: 'America/Los_Angeles'
  },
  isWeeknight: false,
  timeOfDay: 'afternoon'
};

const rainyWinterDay: WeatherContext = {
  weather: {
    feelsLike: 42,
    temperature: 45,
    humidity: 85,
    precipitation: 75,
    windSpeed: 12,
    aqi: 35,
    uvIndex: 2,
    visibility: 3,
    description: 'Heavy rain',
    icon: '10d'
  },
  sun: {
    sunrise: new Date('2025-09-19T07:15:00'),
    sunset: new Date('2025-09-19T18:30:00'),
    minutesToSunset: 45,
    minutesToSunrise: -420,
    isDaytime: true
  },
  location: {
    latitude: 47.6062,
    longitude: -122.3321,
    city: 'Seattle',
    region: 'Washington',
    country: 'US',
    timezone: 'America/Los_Angeles'
  },
  isWeeknight: true,
  timeOfDay: 'evening'
};

const windyPoorAirDay: WeatherContext = {
  weather: {
    feelsLike: 72,
    temperature: 74,
    humidity: 45,
    precipitation: 5,
    windSpeed: 25,
    aqi: 125,
    uvIndex: 6,
    visibility: 4,
    description: 'Windy',
    icon: '02d'
  },
  sun: {
    sunrise: new Date('2025-09-19T06:45:00'),
    sunset: new Date('2025-09-19T19:15:00'),
    minutesToSunset: 180,
    minutesToSunrise: -450,
    isDaytime: true
  },
  location: {
    latitude: 34.0522,
    longitude: -118.2437,
    city: 'Los Angeles',
    region: 'California',
    country: 'US',
    timezone: 'America/Los_Angeles'
  },
  isWeeknight: true,
  timeOfDay: 'afternoon'
};

const goldenHourGrillDay: WeatherContext = {
  weather: {
    feelsLike: 78,
    temperature: 76,
    humidity: 55,
    precipitation: 0,
    windSpeed: 5,
    aqi: 25,
    uvIndex: 4,
    visibility: 10,
    description: 'Clear',
    icon: '01d'
  },
  sun: {
    sunrise: new Date('2025-09-19T06:45:00'),
    sunset: new Date('2025-09-19T19:30:00'),
    minutesToSunset: 105,
    minutesToSunrise: -465,
    isDaytime: true
  },
  location: {
    latitude: 40.7128,
    longitude: -74.0060,
    city: 'New York',
    region: 'New York',
    country: 'US',
    timezone: 'America/New_York'
  },
  isWeeknight: false,
  timeOfDay: 'evening'
};

function runTests() {
  console.log('🌦️ Testing Forecast-to-Feast Recommendation Logic\n');

  const scenarios = [
    { name: '☀️ Hot Summer Day (88°F, 120min to sunset)', context: hotSummerDay },
    { name: '🌧️ Rainy Winter Day (42°F, 75% rain, weeknight)', context: rainyWinterDay },
    { name: '💨 Windy Poor Air Day (72°F, 25mph wind, AQI 125)', context: windyPoorAirDay },
    { name: '🔥 Golden Hour Grill Day (78°F, 105min to sunset)', context: goldenHourGrillDay }
  ];

  scenarios.forEach((scenario, index) => {
    console.log(`${index + 1}. ${scenario.name}`);
    console.log('─'.repeat(50));
    
    const tags = pickMealTags(scenario.context);
    console.log('🏷️  Recommended Tags:', tags.join(', '));
    
    console.log('📍 Weather Conditions:');
    console.log(`   • Feels like: ${scenario.context.weather.feelsLike}°F`);
    console.log(`   • Rain chance: ${scenario.context.weather.precipitation}%`);
    console.log(`   • Wind: ${scenario.context.weather.windSpeed} mph`);
    console.log(`   • Air Quality: ${scenario.context.weather.aqi}`);
    console.log(`   • Time to sunset: ${scenario.context.sun.minutesToSunset} minutes`);
    console.log(`   • Weeknight: ${scenario.context.isWeeknight ? 'Yes' : 'No'}`);
    
    console.log('\n');
  });

  // Test tag logic validation
  console.log('🧪 Tag Logic Validation');
  console.log('─'.repeat(50));
  
  // Hot weather should include no-cook/chilled tags
  const hotTags = pickMealTags(hotSummerDay);
  const hasNoCookTags = hotTags.some(tag => ['no-cook', 'chilled', 'salad', 'fresh'].includes(tag));
  console.log(`✅ Hot weather includes no-cook tags: ${hasNoCookTags}`);
  
  // Cold/rainy weather should include warm comfort tags
  const coldTags = pickMealTags(rainyWinterDay);
  const hasWarmTags = coldTags.some(tag => ['soup', 'stew', 'comfort', 'warm'].includes(tag));
  console.log(`✅ Cold/rainy weather includes warm tags: ${hasWarmTags}`);
  
  // Windy/poor air should include indoor tags
  const windyTags = pickMealTags(windyPoorAirDay);
  const hasIndoorTags = windyTags.some(tag => ['sheet-pan', 'air-fryer', 'indoor'].includes(tag));
  const lacksOutdoorTags = !windyTags.some(tag => ['grill', 'bbq'].includes(tag));
  console.log(`✅ Windy/poor air includes indoor tags: ${hasIndoorTags}`);
  console.log(`✅ Windy/poor air excludes outdoor tags: ${lacksOutdoorTags}`);
  
  // Golden hour should include grill tags
  const grillTags = pickMealTags(goldenHourGrillDay);
  const hasGrillTags = grillTags.some(tag => ['grill'].includes(tag));
  console.log(`✅ Golden hour includes grill tags: ${hasGrillTags}`);
  
  // Weeknight should include quick tags
  const weeknightTags = pickMealTags(rainyWinterDay);
  const hasQuickTags = weeknightTags.some(tag => ['30-min', 'quick', 'weeknight'].includes(tag));
  console.log(`✅ Weeknight includes quick tags: ${hasQuickTags}`);
  
  console.log('\n🎉 All tests completed!');
}

// Only run if this file is executed directly (not imported)
if (require.main === module) {
  runTests();
}

export { runTests };