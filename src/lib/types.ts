export type Recipe = {
  id: string;
  title: string;
  slug: string;
  contributor: string;
  ingredients: string;
  instructions: string;
  imageUrl: string;
  imageHint: string;
  audioUrl?: string;
  tags: string[];
  summary: string;
  userId?: string;
  prepTime?: number;
  servings?: number;
  course?: 'Appetizer' | 'Main' | 'Dessert' | 'Side' | 'Breakfast';
  cuisine?: 'Italian' | 'American' | 'Mexican' | 'Asian' | 'Other';
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  story?: string;
  originName?: string;
  originLat?: number;
  originLng?: number;
  parentId?: string;
  createdAt?: Date;
  updatedAt?: Date;
};

export type UserRole = 'USER' | 'SUPPORT_ADMIN' | 'CONTENT_ADMIN' | 'SUPER_ADMIN';

export type User = {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  bio?: string;
  role?: UserRole;
  isActive?: boolean;
  lastLogin?: Date;
  createdAt?: Date;
  updatedAt?: Date;
};

export type Plan = {
  id: string;
  recipeId: string;
  userId: string;
  plannedFor: Date;
  createdAt: Date;
  updatedAt: Date;
};

// Weather and environmental data types
export type WeatherData = {
  feelsLike: number; // Temperature in Fahrenheit
  temperature: number; // Actual temperature in Fahrenheit
  humidity: number; // Percentage (0-100)
  precipitation: number; // Rain probability percentage (0-100)
  windSpeed: number; // Wind speed in mph
  aqi: number; // Air Quality Index
  uvIndex: number; // UV Index
  visibility: number; // Visibility in miles
  description: string; // Weather description (e.g., "Clear", "Cloudy")
  icon: string; // Weather icon code
};

export type SunData = {
  sunrise: Date;
  sunset: Date;
  minutesToSunset: number;
  minutesToSunrise: number;
  isDaytime: boolean;
};

export type LocationData = {
  latitude: number;
  longitude: number;
  city: string;
  region: string;
  country: string;
  timezone: string;
};

export type WeatherContext = {
  weather: WeatherData;
  sun: SunData;
  location: LocationData;
  isWeeknight: boolean; // Monday-Thursday
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  season: 'spring' | 'summer' | 'fall' | 'winter';
  month: number; // 1-12
  date: Date; // Current date for seasonal calculations
};

// Seasonal ingredient and cooking types
export type SeasonalInfo = {
  season: 'spring' | 'summer' | 'fall' | 'winter';
  producePeak: string[]; // Peak seasonal produce
  produceAvailable: string[]; // Available but not peak
  cookingMethods: string[]; // Preferred cooking methods
  flavors: string[]; // Seasonal flavor profiles
  holidayInfluences?: string[]; // Holiday-related preferences
};

// Meal recommendation types
export type MealTag = 
  | 'no-cook' | 'chilled' | 'salad' | 'light'
  | 'grill' | 'summer' | 'bbq'
  | 'soup' | 'stew' | 'bake' | 'comfort' | 'warm'
  | 'sheet-pan' | 'air-fryer' | 'stovetop' | 'indoor'
  | '30-min' | 'quick' | 'one-pot' | 'weeknight'
  | 'crowd-pleaser' | 'batch-cook' | 'leftovers'
  | 'fresh' | 'seasonal' | 'hearty' | 'spicy'
  | 'spring' | 'summer' | 'fall' | 'winter'
  | 'citrus' | 'root-vegetables' | 'leafy-greens' | 'stone-fruit'
  | 'squash' | 'berries' | 'apples' | 'pumpkin' | 'holiday';

export type MealRecommendation = {
  recipe: Recipe;
  reason: string; // Explanation for why this recipe was recommended
  confidence: number; // 0-1 confidence score
  tags: MealTag[]; // Tags that matched for this recommendation
};

export type RecommendationContext = {
  weather: WeatherContext;
  preferences?: {
    maxPrepTime?: number;
    dietary?: string[];
    cuisines?: string[];
    excludeIngredients?: string[];
  };
  mealType?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
};
