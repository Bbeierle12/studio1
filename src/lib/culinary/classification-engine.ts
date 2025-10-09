/**
 * Culinary Classification Engine
 * Automatically infers taxonomy from recipe data
 */

import type { ParsedRecipe } from '@/lib/recipe-parser';
import {
  type CulinaryClassification,
  type CourseType,
  type DishForm,
  type CookingMethod,
  type CulinaryRegion,
  type FlavorProfile,
  type DietaryTag,
  type ContextualTag,
  type FlavorDimensions,
  CourseTypes,
  DishForms,
  CookingMethods,
  CulinaryRegions,
  FlavorProfiles,
  DietaryTags,
  ContextualTags,
} from '@/types/culinary-taxonomy';

// Pattern matching for classifications
const COURSE_PATTERNS: Record<CourseType, RegExp[]> = {
  [CourseTypes.BREAKFAST]: [
    /breakfast/i, /brunch/i, /morning/i, /pancake/i, /waffle/i, /omelet/i,
    /french toast/i, /cereal/i, /granola/i, /muesli/i, /porridge/i,
  ],
  [CourseTypes.LUNCH]: [
    /lunch/i, /sandwich/i, /wrap/i, /salad bowl/i, /light meal/i,
  ],
  [CourseTypes.DINNER]: [
    /dinner/i, /supper/i, /main course/i, /entrée/i, /entree/i,
  ],
  [CourseTypes.DESSERT]: [
    /dessert/i, /cake/i, /pie/i, /tart/i, /cookie/i, /brownie/i,
    /ice cream/i, /pudding/i, /custard/i, /sweet/i,
  ],
  [CourseTypes.APPETIZER]: [
    /appetizer/i, /starter/i, /hors d'oeuvre/i, /antipasto/i, /tapas/i,
  ],
  [CourseTypes.SOUP]: [
    /soup/i, /stew/i, /chowder/i, /bisque/i, /broth/i, /consommé/i,
  ],
  [CourseTypes.SALAD]: [
    /salad/i, /slaw/i, /greens/i,
  ],
  [CourseTypes.SIDE]: [
    /side dish/i, /side/i, /accompaniment/i,
  ],
  [CourseTypes.SNACK]: [
    /snack/i, /bite/i, /munchie/i,
  ],
  [CourseTypes.BEVERAGE]: [
    /smoothie/i, /drink/i, /beverage/i, /cocktail/i, /juice/i, /tea/i, /coffee/i,
  ],
  [CourseTypes.STREET_FOOD]: [
    /street food/i, /food truck/i, /vendor/i,
  ],
  [CourseTypes.BRUNCH]: [
    /brunch/i,
  ],
};

const DISH_FORM_PATTERNS: Record<DishForm, RegExp[]> = {
  [DishForms.BOWL_MEAL]: [
    /bowl/i, /poke/i, /bibimbap/i, /buddha bowl/i, /grain bowl/i,
  ],
  [DishForms.HANDHELD]: [
    /sandwich/i, /wrap/i, /taco/i, /burger/i, /hot dog/i, /bao/i,
    /empanada/i, /samosa/i, /roll/i, /burrito/i,
  ],
  [DishForms.PLATED_ENTREE]: [
    /steak/i, /chicken breast/i, /salmon/i, /pork chop/i, /filet/i,
  ],
  [DishForms.SAUCE_OVER_BASE]: [
    /pasta/i, /curry/i, /stir.?fry/i, /marinara/i, /alfredo/i, /bolognese/i,
  ],
  [DishForms.BAKED_DISH]: [
    /casserole/i, /lasagna/i, /gratin/i, /bake/i, /roast/i,
  ],
  [DishForms.DUMPLING_STUFFED]: [
    /dumpling/i, /ravioli/i, /pierogi/i, /wonton/i, /stuffed/i,
  ],
  [DishForms.SKEWER]: [
    /skewer/i, /kebab/i, /satay/i, /yakitori/i, /souvlaki/i,
  ],
  [DishForms.PANCAKE_FRITTER]: [
    /pancake/i, /fritter/i, /latke/i, /patty/i, /cake\s/i,
  ],
  [DishForms.PASTRY]: [
    /pie/i, /tart/i, /pastry/i, /quiche/i, /galette/i,
  ],
  [DishForms.SPREAD_DIP]: [
    /dip/i, /spread/i, /hummus/i, /salsa/i, /pâté/i, /tapenade/i,
  ],
  [DishForms.DRINKABLE]: [
    /smoothie/i, /shake/i, /juice/i, /latte/i,
  ],
};

const COOKING_METHOD_KEYWORDS: Record<CookingMethod, string[]> = {
  [CookingMethods.RAW_MARINATED]: ['raw', 'marinated', 'ceviche', 'carpaccio', 'tartare'],
  [CookingMethods.BOILED_SIMMERED]: ['boil', 'simmer', 'poach', 'blanch'],
  [CookingMethods.STEAMED]: ['steam', 'steamer'],
  [CookingMethods.SAUTEED_STIRFRIED]: ['sauté', 'stir-fry', 'pan-fry', 'sear'],
  [CookingMethods.ROASTED_BAKED]: ['roast', 'bake', 'oven'],
  [CookingMethods.GRILLED_CHARRED]: ['grill', 'barbecue', 'bbq', 'char'],
  [CookingMethods.FRIED_DEEP]: ['deep fry', 'deep-fry'],
  [CookingMethods.FRIED_SHALLOW]: ['pan fry', 'shallow fry'],
  [CookingMethods.FRIED_AIR]: ['air fry', 'air fryer'],
  [CookingMethods.BRAISED_STEWED]: ['braise', 'stew', 'slow cook'],
  [CookingMethods.FERMENTED_CURED]: ['ferment', 'pickle', 'cure', 'brine'],
  [CookingMethods.BLENDED_EMULSIFIED]: ['blend', 'purée', 'emulsify', 'whip'],
  [CookingMethods.FROZEN_CHILLED]: ['freeze', 'chill', 'refrigerate'],
};

const REGION_KEYWORDS: Record<CulinaryRegion, string[]> = {
  [CulinaryRegions.FRENCH]: ['french', 'provence', 'normandy', 'lyon'],
  [CulinaryRegions.ITALIAN]: ['italian', 'tuscan', 'sicilian', 'roman'],
  [CulinaryRegions.SPANISH]: ['spanish', 'catalan', 'andalusian', 'basque'],
  [CulinaryRegions.MEXICAN]: ['mexican', 'tex-mex', 'oaxacan'],
  [CulinaryRegions.CHINESE]: ['chinese', 'szechuan', 'cantonese', 'hunan'],
  [CulinaryRegions.JAPANESE]: ['japanese', 'sushi', 'ramen', 'tempura'],
  [CulinaryRegions.THAI]: ['thai', 'pad thai', 'tom yum', 'green curry'],
  [CulinaryRegions.INDIAN]: ['indian', 'tikka', 'masala', 'biryani', 'tandoori'],
  [CulinaryRegions.MIDDLE_EASTERN]: ['middle eastern', 'lebanese', 'turkish', 'persian'],
  [CulinaryRegions.GREEK]: ['greek', 'mediterranean', 'moussaka', 'souvlaki'],
  // Add more as needed...
};

const DIETARY_PATTERNS: Record<DietaryTag, RegExp[]> = {
  [DietaryTags.VEGETARIAN]: [/vegetarian/i, /veggie/i, /meatless/i],
  [DietaryTags.VEGAN]: [/vegan/i, /plant.?based/i],
  [DietaryTags.GLUTEN_FREE]: [/gluten.?free/i, /celiac/i],
  [DietaryTags.DAIRY_FREE]: [/dairy.?free/i, /lactose.?free/i],
  [DietaryTags.LOW_SODIUM]: [/low.?sodium/i, /low.?salt/i],
  [DietaryTags.LOW_FAT]: [/low.?fat/i, /lean/i, /light/i],
  [DietaryTags.HIGH_PROTEIN]: [/high.?protein/i, /protein.?rich/i],
  [DietaryTags.KETO]: [/keto/i, /ketogenic/i, /low.?carb/i],
  [DietaryTags.PALEO]: [/paleo/i],
  [DietaryTags.WHOLE30]: [/whole30/i, /whole 30/i],
  [DietaryTags.PESCATARIAN]: [/pescatarian/i],
};

export class CulinaryClassifier {
  /**
   * Classify a parsed recipe into culinary taxonomy
   */
  classifyRecipe(recipe: ParsedRecipe): CulinaryClassification {
    const classification: CulinaryClassification = {};

    // Infer course
    classification.course = this.inferCourse(recipe);

    // Infer dish form
    classification.dishForm = this.inferDishForm(recipe);

    // Infer cooking methods
    classification.cookingMethod = this.inferCookingMethods(recipe);

    // Infer region
    classification.region = this.inferRegions(recipe);

    // Infer flavor profiles
    classification.flavorProfiles = this.inferFlavorProfiles(recipe);
    classification.flavorDimensions = this.inferFlavorDimensions(recipe);

    // Infer dietary tags
    classification.dietaryTags = this.inferDietaryTags(recipe);

    // Infer contextual tags
    classification.contextualTags = this.inferContextualTags(recipe);

    // Infer ingredient domain
    classification.ingredientDomain = this.inferIngredientDomain(recipe);

    return classification;
  }

  /**
   * Infer course from recipe
   */
  private inferCourse(recipe: ParsedRecipe): CourseType | undefined {
    const searchText = this.getSearchableText(recipe);

    // Check explicit course field first
    if (recipe.course) {
      for (const [course, patterns] of Object.entries(COURSE_PATTERNS)) {
        if (patterns.some(pattern => pattern.test(recipe.course!))) {
          return course as CourseType;
        }
      }
    }

    // Search in title, description, and tags
    for (const [course, patterns] of Object.entries(COURSE_PATTERNS)) {
      if (patterns.some(pattern => pattern.test(searchText))) {
        return course as CourseType;
      }
    }

    // Default based on time of day hints
    if (/morning|dawn|sunrise/i.test(searchText)) return CourseTypes.BREAKFAST;
    if (/evening|sunset|night/i.test(searchText)) return CourseTypes.DINNER;

    return undefined;
  }

  /**
   * Infer dish form from recipe
   */
  private inferDishForm(recipe: ParsedRecipe): DishForm | undefined {
    const searchText = this.getSearchableText(recipe);

    for (const [form, patterns] of Object.entries(DISH_FORM_PATTERNS)) {
      if (patterns.some(pattern => pattern.test(searchText))) {
        return form as DishForm;
      }
    }

    return undefined;
  }

  /**
   * Infer cooking methods from recipe
   */
  private inferCookingMethods(recipe: ParsedRecipe): CookingMethod[] {
    const methods: Set<CookingMethod> = new Set();
    const instructionsText = recipe.instructions.join(' ').toLowerCase();

    for (const [method, keywords] of Object.entries(COOKING_METHOD_KEYWORDS)) {
      if (keywords.some(keyword => instructionsText.includes(keyword))) {
        methods.add(method as CookingMethod);
      }
    }

    return Array.from(methods);
  }

  /**
   * Infer culinary regions from recipe
   */
  private inferRegions(recipe: ParsedRecipe): CulinaryRegion[] {
    const regions: Set<CulinaryRegion> = new Set();
    const searchText = this.getSearchableText(recipe).toLowerCase();

    // Check explicit cuisine field
    if (recipe.cuisine) {
      const cuisineLower = recipe.cuisine.toLowerCase();
      for (const [region, keywords] of Object.entries(REGION_KEYWORDS)) {
        if (keywords.some(keyword => cuisineLower.includes(keyword))) {
          regions.add(region as CulinaryRegion);
        }
      }
    }

    // Check ingredients for regional indicators
    const ingredientsText = recipe.ingredients.join(' ').toLowerCase();

    // Asian indicators
    if (/soy sauce|miso|gochujang|fish sauce|sesame oil/i.test(ingredientsText)) {
      if (/gochujang|kimchi/i.test(ingredientsText)) regions.add(CulinaryRegions.KOREAN);
      if (/miso|sake|mirin/i.test(ingredientsText)) regions.add(CulinaryRegions.JAPANESE);
      if (/fish sauce|lemongrass|galangal/i.test(ingredientsText)) regions.add(CulinaryRegions.THAI);
    }

    // Mediterranean indicators
    if (/olive oil|feta|oregano|lemon/i.test(ingredientsText)) {
      if (/feta|tzatziki|phyllo/i.test(ingredientsText)) regions.add(CulinaryRegions.GREEK);
    }

    // Latin indicators
    if (/cilantro|lime|jalapeño|cumin/i.test(ingredientsText)) {
      if (/tortilla|salsa|taco/i.test(searchText)) regions.add(CulinaryRegions.MEXICAN);
    }

    return Array.from(regions);
  }

  /**
   * Infer flavor profiles from recipe
   */
  private inferFlavorProfiles(recipe: ParsedRecipe): FlavorProfile[] {
    const profiles: Set<FlavorProfile> = new Set();
    const ingredientsText = recipe.ingredients.join(' ').toLowerCase();

    // Spicy indicators
    if (/chili|pepper|hot sauce|jalapeño|cayenne|sriracha/i.test(ingredientsText)) {
      profiles.add(FlavorProfiles.SPICY_HOT);
    }

    // Acidic indicators
    if (/lemon|lime|vinegar|citrus|tomato/i.test(ingredientsText)) {
      profiles.add(FlavorProfiles.BRIGHT_ACIDIC);
    }

    // Umami indicators
    if (/soy sauce|miso|parmesan|mushroom|tomato paste|fish sauce/i.test(ingredientsText)) {
      profiles.add(FlavorProfiles.SAVORY_UMAMI);
    }

    // Sweet indicators
    if (/sugar|honey|maple|caramel|chocolate/i.test(ingredientsText)) {
      profiles.add(FlavorProfiles.SWEET_RICH);
    }

    // Smoky indicators
    if (/smoked|barbecue|chipotle|char/i.test(ingredientsText)) {
      profiles.add(FlavorProfiles.SMOKY_EARTHY);
    }

    return Array.from(profiles);
  }

  /**
   * Infer flavor dimensions from recipe
   */
  private inferFlavorDimensions(recipe: ParsedRecipe): FlavorDimensions {
    const ingredientsText = recipe.ingredients.join(' ').toLowerCase();

    return {
      spice: this.calculateSpiceLevel(ingredientsText),
      acid: this.calculateAcidLevel(ingredientsText),
      fat: this.calculateFatLevel(ingredientsText),
      umami: this.calculateUmamiLevel(ingredientsText),
      sweet: this.calculateSweetLevel(ingredientsText),
      bitter: this.calculateBitterLevel(ingredientsText),
    };
  }

  /**
   * Calculate spice level (0-5)
   */
  private calculateSpiceLevel(ingredients: string): number {
    const spiceIndicators = [
      { pattern: /ghost pepper|carolina reaper|habanero/i, value: 5 },
      { pattern: /thai chili|scotch bonnet|serrano/i, value: 4 },
      { pattern: /jalapeño|cayenne|hot sauce/i, value: 3 },
      { pattern: /chili flakes|paprika|black pepper/i, value: 2 },
      { pattern: /mild|bell pepper/i, value: 1 },
    ];

    for (const indicator of spiceIndicators) {
      if (indicator.pattern.test(ingredients)) {
        return indicator.value;
      }
    }
    return 0;
  }

  /**
   * Calculate acid level (0-5)
   */
  private calculateAcidLevel(ingredients: string): number {
    let level = 0;
    if (/vinegar|pickle/i.test(ingredients)) level += 2;
    if (/lemon|lime|citrus/i.test(ingredients)) level += 2;
    if (/tomato|yogurt/i.test(ingredients)) level += 1;
    return Math.min(5, level);
  }

  /**
   * Calculate fat level (0-5)
   */
  private calculateFatLevel(ingredients: string): number {
    let level = 0;
    if (/butter|cream|cheese/i.test(ingredients)) level += 2;
    if (/oil|avocado|nuts/i.test(ingredients)) level += 1;
    if (/bacon|sausage/i.test(ingredients)) level += 2;
    return Math.min(5, level);
  }

  /**
   * Calculate umami level (0-5)
   */
  private calculateUmamiLevel(ingredients: string): number {
    let level = 0;
    if (/soy sauce|miso|fish sauce/i.test(ingredients)) level += 2;
    if (/mushroom|tomato paste/i.test(ingredients)) level += 2;
    if (/parmesan|anchovies/i.test(ingredients)) level += 1;
    return Math.min(5, level);
  }

  /**
   * Calculate sweet level (0-5)
   */
  private calculateSweetLevel(ingredients: string): number {
    let level = 0;
    if (/sugar|honey|maple syrup/i.test(ingredients)) level += 2;
    if (/chocolate|caramel/i.test(ingredients)) level += 2;
    if (/fruit|berries/i.test(ingredients)) level += 1;
    return Math.min(5, level);
  }

  /**
   * Calculate bitter level (0-5)
   */
  private calculateBitterLevel(ingredients: string): number {
    let level = 0;
    if (/coffee|cocoa|dark chocolate/i.test(ingredients)) level += 2;
    if (/kale|arugula|endive/i.test(ingredients)) level += 2;
    if (/herbs|greens/i.test(ingredients)) level += 1;
    return Math.min(5, level);
  }

  /**
   * Infer dietary tags from recipe
   */
  private inferDietaryTags(recipe: ParsedRecipe): DietaryTag[] {
    const tags: Set<DietaryTag> = new Set();
    const searchText = this.getSearchableText(recipe);
    const ingredientsLower = recipe.ingredients.join(' ').toLowerCase();

    // Check explicit patterns
    for (const [tag, patterns] of Object.entries(DIETARY_PATTERNS)) {
      if (patterns.some(pattern => pattern.test(searchText))) {
        tags.add(tag as DietaryTag);
      }
    }

    // Infer from ingredients
    const hasMeat = /chicken|beef|pork|lamb|turkey|bacon|sausage/i.test(ingredientsLower);
    const hasFish = /fish|salmon|tuna|shrimp|seafood/i.test(ingredientsLower);
    const hasDairy = /milk|cheese|butter|cream|yogurt/i.test(ingredientsLower);
    const hasEggs = /egg/i.test(ingredientsLower);

    if (!hasMeat && !hasFish) {
      tags.add(DietaryTags.VEGETARIAN);
      if (!hasDairy && !hasEggs) {
        tags.add(DietaryTags.VEGAN);
      }
    } else if (!hasMeat && hasFish) {
      tags.add(DietaryTags.PESCATARIAN);
    }

    return Array.from(tags);
  }

  /**
   * Infer contextual tags from recipe
   */
  private inferContextualTags(recipe: ParsedRecipe): ContextualTag[] {
    const tags: Set<ContextualTag> = new Set();

    // Quick recipes
    if (recipe.totalTime && recipe.totalTime <= 30) {
      tags.add(ContextualTags.QUICK);
    }

    // Family style (large servings)
    if (recipe.servings && recipe.servings >= 6) {
      tags.add(ContextualTags.FAMILY_STYLE);
    } else if (recipe.servings === 1) {
      tags.add(ContextualTags.SINGLE_SERVE);
    }

    // One-pot detection
    if (/one.?pot|one.?pan|sheet.?pan/i.test(recipe.title || '')) {
      tags.add(ContextualTags.ONE_POT);
    }

    // No-cook detection
    const cookingMethods = this.inferCookingMethods(recipe);
    if (cookingMethods.includes(CookingMethods.RAW_MARINATED) ||
        cookingMethods.includes(CookingMethods.FROZEN_CHILLED)) {
      tags.add(ContextualTags.NO_COOK);
    }

    return Array.from(tags);
  }

  /**
   * Infer ingredient domain from recipe
   */
  private inferIngredientDomain(recipe: ParsedRecipe): string | undefined {
    const ingredientsText = recipe.ingredients.join(' ').toLowerCase();

    // Count ingredient types
    const counts = {
      protein: (ingredientsText.match(/chicken|beef|pork|fish|tofu|beans|lentils/gi) || []).length,
      grain: (ingredientsText.match(/rice|pasta|bread|flour|oats|quinoa/gi) || []).length,
      vegetable: (ingredientsText.match(/carrot|onion|pepper|tomato|lettuce|spinach|broccoli/gi) || []).length,
      dairy: (ingredientsText.match(/milk|cheese|cream|yogurt|butter/gi) || []).length,
      fruit: (ingredientsText.match(/apple|banana|berry|orange|lemon|mango/gi) || []).length,
    };

    // Find dominant category
    const maxCount = Math.max(...Object.values(counts));
    if (maxCount === 0) return 'mixed';

    const dominant = Object.entries(counts).find(([_, count]) => count === maxCount);

    switch (dominant?.[0]) {
      case 'protein': return 'protein';
      case 'grain': return 'grain_starch';
      case 'vegetable': return 'vegetable_forward';
      case 'dairy': return 'dairy_based';
      case 'fruit': return 'fruit_based';
      default: return 'mixed';
    }
  }

  /**
   * Get searchable text from recipe
   */
  private getSearchableText(recipe: ParsedRecipe): string {
    return [
      recipe.title,
      recipe.description,
      recipe.course,
      recipe.cuisine,
      ...(recipe.tags || []),
    ].filter(Boolean).join(' ');
  }
}