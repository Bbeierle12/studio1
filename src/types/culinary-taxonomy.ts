/**
 * Culinary Classification Framework
 * The structural taxonomy for AI-driven recipe generation and analysis
 */

// ============================================================================
// 1. COURSE / MEAL STAGE
// ============================================================================
export const CourseTypes = {
  BREAKFAST: 'breakfast',
  BRUNCH: 'brunch',
  LUNCH: 'lunch',
  DINNER: 'dinner',
  SNACK: 'snack',
  STREET_FOOD: 'street_food',
  SIDE: 'side',
  APPETIZER: 'appetizer',
  SOUP: 'soup',
  SALAD: 'salad',
  DESSERT: 'dessert',
  BEVERAGE: 'beverage',
} as const;

export type CourseType = typeof CourseTypes[keyof typeof CourseTypes];

export const CourseSubTypes = {
  // Salad subtypes
  SALAD_COLD: 'salad_cold',
  SALAD_WARM: 'salad_warm',
  SALAD_COMPOSED: 'salad_composed',
  SALAD_TOSSED: 'salad_tossed',

  // Dessert subtypes
  DESSERT_BAKED: 'dessert_baked',
  DESSERT_CHILLED: 'dessert_chilled',
  DESSERT_FROZEN: 'dessert_frozen',
  DESSERT_CONFECTION: 'dessert_confection',

  // Beverage subtypes
  BEVERAGE_SMOOTHIE: 'beverage_smoothie',
  BEVERAGE_COCKTAIL: 'beverage_cocktail',
  BEVERAGE_NON_ALCOHOLIC: 'beverage_non_alcoholic',
  BEVERAGE_HOT: 'beverage_hot',
} as const;

export type CourseSubType = typeof CourseSubTypes[keyof typeof CourseSubTypes];

// ============================================================================
// 2. DISH FORM / ARCHITECTURE
// ============================================================================
export const DishForms = {
  BOWL_MEAL: 'bowl_meal', // bibimbap, poke, grain bowl
  HANDHELD: 'handheld', // sandwich, wrap, taco, empanada, bao
  PLATED_ENTREE: 'plated_entree', // protein + sides
  SAUCE_OVER_BASE: 'sauce_over_base', // pasta, curry, stew with rice
  BAKED_DISH: 'baked_dish', // casserole, gratin, lasagna
  DUMPLING_STUFFED: 'dumpling_stuffed', // filled items
  SKEWER: 'skewer', // kebab, satay
  PANCAKE_FRITTER: 'pancake_fritter', // patty-style
  PASTRY: 'pastry', // pie, tart
  SPREAD_DIP: 'spread_dip', // condiment
  DRINKABLE: 'drinkable', // sip-based
} as const;

export type DishForm = typeof DishForms[keyof typeof DishForms];

// ============================================================================
// 3. PRIMARY INGREDIENT DOMAIN
// ============================================================================
export const IngredientDomains = {
  GRAIN_STARCH: 'grain_starch', // rice, wheat, corn, root vegetables
  PROTEIN: 'protein', // meat, poultry, fish, shellfish, tofu, legumes
  VEGETABLE_FORWARD: 'vegetable_forward',
  EGG_BASED: 'egg_based',
  DAIRY_BASED: 'dairy_based',
  FRUIT_BASED: 'fruit_based',
  MIXED: 'mixed', // balanced composition
} as const;

export type IngredientDomain = typeof IngredientDomains[keyof typeof IngredientDomains];

// ============================================================================
// 4. PRIMARY COOKING METHOD
// ============================================================================
export const CookingMethods = {
  RAW_MARINATED: 'raw_marinated',
  BOILED_SIMMERED: 'boiled_simmered',
  STEAMED: 'steamed',
  SAUTEED_STIRFRIED: 'sauteed_stirfried',
  ROASTED_BAKED: 'roasted_baked',
  GRILLED_CHARRED: 'grilled_charred',
  FRIED_DEEP: 'fried_deep',
  FRIED_SHALLOW: 'fried_shallow',
  FRIED_AIR: 'fried_air',
  BRAISED_STEWED: 'braised_stewed',
  FERMENTED_CURED: 'fermented_cured',
  BLENDED_EMULSIFIED: 'blended_emulsified',
  FROZEN_CHILLED: 'frozen_chilled',
} as const;

export type CookingMethod = typeof CookingMethods[keyof typeof CookingMethods];

// ============================================================================
// 5. CULINARY REGION / TRADITION
// ============================================================================
export const CulinaryRegions = {
  // Western Europe
  FRENCH: 'french',
  ITALIAN: 'italian',
  SPANISH: 'spanish',
  GERMAN: 'german',
  BRITISH: 'british',

  // Eastern Europe
  EASTERN_EUROPEAN: 'eastern_european',
  BALKANS: 'balkans',
  RUSSIAN: 'russian',

  // Middle East & Africa
  MIDDLE_EASTERN: 'middle_eastern',
  LEVANTINE: 'levantine',
  NORTH_AFRICAN: 'north_african',
  WEST_AFRICAN: 'west_african',
  EAST_AFRICAN: 'east_african',
  SOUTHERN_AFRICAN: 'southern_african',

  // Asia
  SOUTH_ASIAN: 'south_asian',
  INDIAN: 'indian',
  CHINESE: 'chinese',
  JAPANESE: 'japanese',
  KOREAN: 'korean',
  THAI: 'thai',
  VIETNAMESE: 'vietnamese',
  FILIPINO: 'filipino',
  SOUTHEAST_ASIAN: 'southeast_asian',

  // Americas
  MEXICAN: 'mexican',
  CENTRAL_AMERICAN: 'central_american',
  SOUTH_AMERICAN: 'south_american',
  CARIBBEAN: 'caribbean',
  CAJUN: 'cajun',
  SOUTHWESTERN: 'southwestern',
  PACIFIC_NORTHWEST: 'pacific_northwest',
  SOUTHERN_US: 'southern_us',

  // Modern
  FUSION: 'fusion',
  MODERN: 'modern',
  GLOBAL_CONTEMPORARY: 'global_contemporary',
} as const;

export type CulinaryRegion = typeof CulinaryRegions[keyof typeof CulinaryRegions];

// ============================================================================
// 6. FLAVOR & SEASONING PROFILE
// ============================================================================
export const FlavorProfiles = {
  SAVORY_UMAMI: 'savory_umami',
  BRIGHT_ACIDIC: 'bright_acidic',
  SPICY_HOT: 'spicy_hot',
  SWEET_RICH: 'sweet_rich',
  BITTER_HERBAL: 'bitter_herbal',
  SMOKY_EARTHY: 'smoky_earthy',
  FERMENTED_TANGY: 'fermented_tangy',
  AROMATIC_FLORAL: 'aromatic_floral',
  BALANCED_MILD: 'balanced_mild',
} as const;

export type FlavorProfile = typeof FlavorProfiles[keyof typeof FlavorProfiles];

// Radar chart dimensions (0-5 scale)
export interface FlavorDimensions {
  spice: number; // 0-5
  acid: number; // 0-5
  fat: number; // 0-5
  umami: number; // 0-5
  sweet: number; // 0-5
  bitter: number; // 0-5
}

// ============================================================================
// 7. DIETARY & CONTEXTUAL TAGS
// ============================================================================
export const DietaryTags = {
  VEGETARIAN: 'vegetarian',
  VEGAN: 'vegan',
  PESCATARIAN: 'pescatarian',
  GLUTEN_FREE: 'gluten_free',
  DAIRY_FREE: 'dairy_free',
  LOW_SODIUM: 'low_sodium',
  LOW_FAT: 'low_fat',
  HIGH_PROTEIN: 'high_protein',
  KETO: 'keto',
  PALEO: 'paleo',
  WHOLE30: 'whole30',
} as const;

export type DietaryTag = typeof DietaryTags[keyof typeof DietaryTags];

export const ContextualTags = {
  FAMILY_STYLE: 'family_style',
  SINGLE_SERVE: 'single_serve',
  MEAL_PREP: 'meal_prep',
  FREEZER_FRIENDLY: 'freezer_friendly',
  PICNIC: 'picnic',
  CELEBRATION: 'celebration',
  COMFORT: 'comfort',
  EVERYDAY: 'everyday',
  QUICK: 'quick', // < 30 min
  ONE_POT: 'one_pot',
  NO_COOK: 'no_cook',
} as const;

export type ContextualTag = typeof ContextualTags[keyof typeof ContextualTags];

// ============================================================================
// 8. AROMATIC SIGNATURES & SPICE LOGIC
// ============================================================================
export interface AromaticBase {
  name: string;
  region: CulinaryRegion[];
  ingredients: string[];
  description: string;
}

export const AromaticBases: Record<string, AromaticBase> = {
  MIREPOIX: {
    name: 'Mirepoix',
    region: ['french'],
    ingredients: ['onion', 'celery', 'carrot'],
    description: 'Classic French aromatic base',
  },
  SOFRITO: {
    name: 'Sofrito',
    region: ['spanish', 'caribbean', 'south_american'],
    ingredients: ['onion', 'garlic', 'tomato', 'bell_pepper'],
    description: 'Latin/Spanish aromatic base',
  },
  HOLY_TRINITY: {
    name: 'Holy Trinity',
    region: ['cajun', 'southern_us'],
    ingredients: ['onion', 'celery', 'bell_pepper'],
    description: 'Cajun/Creole aromatic base',
  },
  BATTUTO: {
    name: 'Battuto/Soffritto',
    region: ['italian'],
    ingredients: ['onion', 'celery', 'carrot', 'garlic'],
    description: 'Italian aromatic base',
  },
  DUXELLES: {
    name: 'Duxelles',
    region: ['french'],
    ingredients: ['mushroom', 'shallot', 'garlic'],
    description: 'French mushroom base',
  },
  MASALA_BASE: {
    name: 'Masala Base',
    region: ['indian', 'south_asian'],
    ingredients: ['onion', 'ginger', 'garlic', 'tomato'],
    description: 'Indian subcontinent aromatic base',
  },
  ASIAN_TRINITY: {
    name: 'Asian Trinity',
    region: ['chinese', 'southeast_asian'],
    ingredients: ['ginger', 'garlic', 'scallion'],
    description: 'East/Southeast Asian aromatic base',
  },
  THAI_TRIO: {
    name: 'Thai Trio',
    region: ['thai'],
    ingredients: ['lemongrass', 'galangal', 'kaffir_lime'],
    description: 'Thai aromatic base',
  },
};

export interface SpiceSignature {
  name: string;
  region: CulinaryRegion[];
  spices: string[];
  heatLevel: number; // 0-5
  description: string;
}

export const SpiceSignatures: Record<string, SpiceSignature> = {
  GARAM_MASALA: {
    name: 'Garam Masala',
    region: ['indian', 'south_asian'],
    spices: ['cumin', 'coriander', 'cardamom', 'cinnamon', 'clove', 'black_pepper'],
    heatLevel: 2,
    description: 'Warming Indian spice blend',
  },
  FIVE_SPICE: {
    name: 'Chinese Five Spice',
    region: ['chinese'],
    spices: ['star_anise', 'clove', 'cinnamon', 'sichuan_pepper', 'fennel'],
    heatLevel: 1,
    description: 'Sweet and aromatic Chinese blend',
  },
  RAS_EL_HANOUT: {
    name: 'Ras el Hanout',
    region: ['north_african', 'middle_eastern'],
    spices: ['cumin', 'coriander', 'cinnamon', 'paprika', 'turmeric', 'cayenne'],
    heatLevel: 2,
    description: 'Complex North African blend',
  },
  HERBES_DE_PROVENCE: {
    name: 'Herbes de Provence',
    region: ['french'],
    spices: ['thyme', 'rosemary', 'oregano', 'marjoram', 'lavender'],
    heatLevel: 0,
    description: 'Aromatic French herb blend',
  },
  BERBERE: {
    name: 'Berbere',
    region: ['east_african'],
    spices: ['chili', 'fenugreek', 'coriander', 'cardamom', 'cinnamon', 'nutmeg'],
    heatLevel: 3,
    description: 'Ethiopian spice blend',
  },
  BAHARAT: {
    name: 'Baharat',
    region: ['middle_eastern'],
    spices: ['black_pepper', 'cumin', 'coriander', 'cardamom', 'nutmeg', 'cinnamon'],
    heatLevel: 1,
    description: 'Middle Eastern all-purpose blend',
  },
};

// ============================================================================
// COMPLETE CULINARY CLASSIFICATION
// ============================================================================
export interface CulinaryClassification {
  // Primary classifications
  course?: CourseType;
  courseSubType?: CourseSubType;
  dishForm?: DishForm;
  ingredientDomain?: IngredientDomain;
  cookingMethod?: CookingMethod[];
  region?: CulinaryRegion[];

  // Flavor profile
  flavorProfiles?: FlavorProfile[];
  flavorDimensions?: FlavorDimensions;

  // Tags
  dietaryTags?: DietaryTag[];
  contextualTags?: ContextualTag[];

  // Aromatics & spices
  aromaticBase?: keyof typeof AromaticBases;
  spiceSignature?: keyof typeof SpiceSignatures;
  keySpices?: string[]; // up to 5 custom spices

  // Additional metadata
  servingStyle?: 'individual' | 'family' | 'buffet';
  temperature?: 'hot' | 'cold' | 'room_temp';
  texture?: 'crispy' | 'creamy' | 'chunky' | 'smooth' | 'chewy';
  seasonality?: 'spring' | 'summer' | 'fall' | 'winter' | 'year_round';
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================
export function getRegionDisplayName(region: CulinaryRegion): string {
  const displayNames: Record<CulinaryRegion, string> = {
    french: 'French',
    italian: 'Italian',
    spanish: 'Spanish',
    german: 'German',
    british: 'British',
    eastern_european: 'Eastern European',
    balkans: 'Balkans',
    russian: 'Russian',
    middle_eastern: 'Middle Eastern',
    levantine: 'Levantine',
    north_african: 'North African',
    west_african: 'West African',
    east_african: 'East African',
    southern_african: 'Southern African',
    south_asian: 'South Asian',
    indian: 'Indian',
    chinese: 'Chinese',
    japanese: 'Japanese',
    korean: 'Korean',
    thai: 'Thai',
    vietnamese: 'Vietnamese',
    filipino: 'Filipino',
    southeast_asian: 'Southeast Asian',
    mexican: 'Mexican',
    central_american: 'Central American',
    south_american: 'South American',
    caribbean: 'Caribbean',
    cajun: 'Cajun',
    southwestern: 'Southwestern',
    pacific_northwest: 'Pacific Northwest',
    southern_us: 'Southern US',
    fusion: 'Fusion',
    modern: 'Modern',
    global_contemporary: 'Global Contemporary',
  };
  return displayNames[region] || region;
}

export function getCourseDisplayName(course: CourseType): string {
  const displayNames: Record<CourseType, string> = {
    breakfast: 'Breakfast',
    brunch: 'Brunch',
    lunch: 'Lunch',
    dinner: 'Dinner',
    snack: 'Snack',
    street_food: 'Street Food',
    side: 'Side Dish',
    appetizer: 'Appetizer',
    soup: 'Soup/Stew',
    salad: 'Salad',
    dessert: 'Dessert',
    beverage: 'Beverage',
  };
  return displayNames[course] || course;
}

export function getDishFormDisplayName(form: DishForm): string {
  const displayNames: Record<DishForm, string> = {
    bowl_meal: 'Bowl Meal',
    handheld: 'Handheld',
    plated_entree: 'Plated Entrée',
    sauce_over_base: 'Sauce Over Base',
    baked_dish: 'Baked Dish',
    dumpling_stuffed: 'Dumpling/Stuffed',
    skewer: 'Skewer/Kebab',
    pancake_fritter: 'Pancake/Fritter',
    pastry: 'Pastry/Pie',
    spread_dip: 'Spread/Dip',
    drinkable: 'Drinkable',
  };
  return displayNames[form] || form;
}