/**
 * Recipe Generation Prompt Builder
 * Transforms culinary taxonomy into structured AI prompts
 */

import {
  type CulinaryClassification,
  AromaticBases,
  SpiceSignatures,
  getCourseDisplayName,
  getDishFormDisplayName,
  getRegionDisplayName,
} from '@/types/culinary-taxonomy';

interface PromptBuilderOptions {
  classification: CulinaryClassification;
  servings?: number;
  prepTime?: number; // minutes
  difficulty?: 'easy' | 'medium' | 'hard';
  ingredients?: string[]; // specific ingredients to include
  restrictions?: string[]; // ingredients to avoid
  equipment?: string[]; // available cooking equipment
  additionalNotes?: string;
  outputFormat?: 'detailed' | 'simple' | 'structured';
}

export class RecipePromptBuilder {
  private options: PromptBuilderOptions;

  constructor(options: PromptBuilderOptions) {
    this.options = options;
  }

  /**
   * Build the complete prompt for recipe generation
   */
  buildPrompt(): string {
    const sections: string[] = [];

    // Core request
    sections.push(this.buildCoreRequest());

    // Culinary parameters
    sections.push(this.buildCulinaryParameters());

    // Flavor profile
    if (this.hasFlavorProfile()) {
      sections.push(this.buildFlavorProfile());
    }

    // Aromatics and spices
    if (this.hasAromatics()) {
      sections.push(this.buildAromaticsSection());
    }

    // Constraints and requirements
    if (this.hasConstraints()) {
      sections.push(this.buildConstraints());
    }

    // Output format instructions
    sections.push(this.buildOutputInstructions());

    return sections.filter(Boolean).join('\n\n');
  }

  /**
   * Build structured JSON prompt for API usage
   */
  buildStructuredPrompt(): object {
    const { classification } = this.options;

    return {
      task: 'generate_recipe',
      parameters: {
        // Core classification
        course: classification.course,
        dishForm: classification.dishForm,
        region: classification.region,
        cookingMethods: classification.cookingMethod,

        // Flavor profile
        flavorProfile: {
          profiles: classification.flavorProfiles,
          dimensions: classification.flavorDimensions,
        },

        // Aromatics and spices
        aromatics: {
          base: classification.aromaticBase
            ? AromaticBases[classification.aromaticBase]
            : null,
          signature: classification.spiceSignature
            ? SpiceSignatures[classification.spiceSignature]
            : null,
          customSpices: classification.keySpices,
        },

        // Requirements
        dietary: classification.dietaryTags,
        context: classification.contextualTags,

        // Additional parameters
        servings: this.options.servings,
        prepTime: this.options.prepTime,
        difficulty: this.options.difficulty,
        ingredients: this.options.ingredients,
        restrictions: this.options.restrictions,
        equipment: this.options.equipment,
      },
      outputFormat: this.options.outputFormat || 'structured',
    };
  }

  /**
   * Build the core request section
   */
  private buildCoreRequest(): string {
    const { classification } = this.options;
    const parts: string[] = [];

    parts.push('Generate a recipe for:');

    // Primary characteristics
    if (classification.course) {
      parts.push(`- Course: ${getCourseDisplayName(classification.course)}`);
    }

    if (classification.dishForm) {
      parts.push(`- Dish Form: ${getDishFormDisplayName(classification.dishForm)}`);
    }

    if (classification.region && classification.region.length > 0) {
      const regions = classification.region.map(getRegionDisplayName).join(', ');
      parts.push(`- Culinary Tradition: ${regions}`);
    }

    if (classification.ingredientDomain) {
      parts.push(`- Primary Focus: ${this.formatIngredientDomain(classification.ingredientDomain)}`);
    }

    return parts.join('\n');
  }

  /**
   * Build culinary parameters section
   */
  private buildCulinaryParameters(): string {
    const { classification, servings, prepTime, difficulty } = this.options;
    const parts: string[] = ['Recipe Parameters:'];

    // Cooking methods
    if (classification.cookingMethod && classification.cookingMethod.length > 0) {
      const methods = classification.cookingMethod
        .map(m => m.replace(/_/g, ' '))
        .join(', ');
      parts.push(`- Cooking Methods: ${methods}`);
    }

    // Serving details
    if (servings) {
      parts.push(`- Servings: ${servings}`);
    }

    if (prepTime) {
      parts.push(`- Maximum Prep Time: ${prepTime} minutes`);
    }

    if (difficulty) {
      parts.push(`- Difficulty Level: ${difficulty}`);
    }

    // Temperature and texture
    if (classification.temperature) {
      parts.push(`- Serving Temperature: ${classification.temperature}`);
    }

    if (classification.texture) {
      parts.push(`- Primary Texture: ${classification.texture}`);
    }

    if (classification.seasonality) {
      parts.push(`- Seasonality: ${classification.seasonality}`);
    }

    return parts.join('\n');
  }

  /**
   * Build flavor profile section
   */
  private buildFlavorProfile(): string {
    const { classification } = this.options;
    const parts: string[] = ['Flavor Profile:'];

    // Named profiles
    if (classification.flavorProfiles && classification.flavorProfiles.length > 0) {
      const profiles = classification.flavorProfiles
        .map(p => p.replace(/_/g, '-'))
        .join(', ');
      parts.push(`- Flavor Characteristics: ${profiles}`);
    }

    // Dimensional profile
    if (classification.flavorDimensions) {
      const dims = classification.flavorDimensions;
      const dimensionDescriptions: string[] = [];

      if (dims.spice > 0) dimensionDescriptions.push(`Spice Level: ${dims.spice}/5`);
      if (dims.acid > 0) dimensionDescriptions.push(`Acidity: ${dims.acid}/5`);
      if (dims.fat > 0) dimensionDescriptions.push(`Richness: ${dims.fat}/5`);
      if (dims.umami > 0) dimensionDescriptions.push(`Umami: ${dims.umami}/5`);
      if (dims.sweet > 0) dimensionDescriptions.push(`Sweetness: ${dims.sweet}/5`);
      if (dims.bitter > 0) dimensionDescriptions.push(`Bitterness: ${dims.bitter}/5`);

      if (dimensionDescriptions.length > 0) {
        parts.push(`- Flavor Dimensions: ${dimensionDescriptions.join(', ')}`);
      }
    }

    return parts.join('\n');
  }

  /**
   * Build aromatics and spices section
   */
  private buildAromaticsSection(): string {
    const { classification } = this.options;
    const parts: string[] = ['Aromatic Foundation & Spices:'];

    // Aromatic base
    if (classification.aromaticBase) {
      const base = AromaticBases[classification.aromaticBase];
      parts.push(`- Aromatic Base: ${base.name} (${base.ingredients.join(', ')})`);
      parts.push(`  ${base.description}`);
    }

    // Spice signature
    if (classification.spiceSignature) {
      const sig = SpiceSignatures[classification.spiceSignature];
      parts.push(`- Spice Blend: ${sig.name}`);
      parts.push(`  Includes: ${sig.spices.join(', ')}`);
      parts.push(`  Heat Level: ${sig.heatLevel}/5`);
    }

    // Custom spices
    if (classification.keySpices && classification.keySpices.length > 0) {
      parts.push(`- Key Spices/Herbs: ${classification.keySpices.join(', ')}`);
    }

    return parts.join('\n');
  }

  /**
   * Build constraints section
   */
  private buildConstraints(): string {
    const { classification, ingredients, restrictions, equipment } = this.options;
    const parts: string[] = ['Requirements & Constraints:'];

    // Dietary requirements
    if (classification.dietaryTags && classification.dietaryTags.length > 0) {
      const tags = classification.dietaryTags
        .map(t => t.replace(/_/g, ' '))
        .join(', ');
      parts.push(`- Dietary Requirements: ${tags}`);
    }

    // Context tags
    if (classification.contextualTags && classification.contextualTags.length > 0) {
      const tags = classification.contextualTags
        .map(t => t.replace(/_/g, ' '))
        .join(', ');
      parts.push(`- Context: ${tags}`);
    }

    // Specific ingredients
    if (ingredients && ingredients.length > 0) {
      parts.push(`- Must Include: ${ingredients.join(', ')}`);
    }

    if (restrictions && restrictions.length > 0) {
      parts.push(`- Must Avoid: ${restrictions.join(', ')}`);
    }

    // Equipment
    if (equipment && equipment.length > 0) {
      parts.push(`- Available Equipment: ${equipment.join(', ')}`);
    }

    return parts.join('\n');
  }

  /**
   * Build output format instructions
   */
  private buildOutputInstructions(): string {
    const { outputFormat = 'structured', additionalNotes } = this.options;

    const formats = {
      detailed: `Please provide a detailed recipe including:
- Recipe name and description
- Complete ingredient list with measurements
- Step-by-step instructions
- Cooking tips and variations
- Nutritional information (estimated)
- Wine/beverage pairing suggestions`,

      simple: `Please provide a simple recipe format:
- Recipe name
- Ingredients list
- Basic step-by-step instructions
- Prep and cook time`,

      structured: `Please provide a structured recipe in JSON format:
{
  "name": "Recipe Name",
  "description": "Brief description",
  "servings": number,
  "prepTime": "X minutes",
  "cookTime": "Y minutes",
  "ingredients": [
    { "item": "ingredient", "amount": "quantity", "unit": "measurement" }
  ],
  "instructions": [
    "Step 1...",
    "Step 2..."
  ],
  "nutrition": {
    "calories": number,
    "protein": "Xg",
    "carbs": "Yg",
    "fat": "Zg"
  },
  "tags": ["tag1", "tag2"]
}`,
    };

    let output = formats[outputFormat];

    if (additionalNotes) {
      output += `\n\nAdditional Notes: ${additionalNotes}`;
    }

    return output;
  }

  /**
   * Helper methods
   */
  private hasFlavorProfile(): boolean {
    const { classification } = this.options;
    return !!(
      classification.flavorProfiles?.length ||
      classification.flavorDimensions
    );
  }

  private hasAromatics(): boolean {
    const { classification } = this.options;
    return !!(
      classification.aromaticBase ||
      classification.spiceSignature ||
      classification.keySpices?.length
    );
  }

  private hasConstraints(): boolean {
    const { classification, ingredients, restrictions, equipment } = this.options;
    return !!(
      classification.dietaryTags?.length ||
      classification.contextualTags?.length ||
      ingredients?.length ||
      restrictions?.length ||
      equipment?.length
    );
  }

  private formatIngredientDomain(domain: string): string {
    const formats: Record<string, string> = {
      grain_starch: 'Grain/Starch-based',
      protein: 'Protein-focused',
      vegetable_forward: 'Vegetable-forward',
      egg_based: 'Egg-based',
      dairy_based: 'Dairy-based',
      fruit_based: 'Fruit-based',
      mixed: 'Mixed/Balanced',
    };
    return formats[domain] || domain;
  }
}

/**
 * Generate a recipe prompt from classification
 */
export function generateRecipePrompt(
  classification: CulinaryClassification,
  options?: Partial<PromptBuilderOptions>
): string {
  const builder = new RecipePromptBuilder({
    classification,
    ...options,
  });
  return builder.buildPrompt();
}

/**
 * Generate structured prompt for API
 */
export function generateStructuredPrompt(
  classification: CulinaryClassification,
  options?: Partial<PromptBuilderOptions>
): object {
  const builder = new RecipePromptBuilder({
    classification,
    ...options,
  });
  return builder.buildStructuredPrompt();
}

/**
 * Extract classification from a recipe description
 */
export function extractClassification(
  recipeText: string
): Partial<CulinaryClassification> {
  // This would use NLP or pattern matching to extract classification
  // For now, returning a placeholder
  return {
    // TODO: Implement extraction logic
  };
}

/**
 * Validate classification completeness
 */
export function validateClassification(
  classification: CulinaryClassification
): { valid: boolean; missing: string[] } {
  const missing: string[] = [];

  // Check for essential fields
  if (!classification.course) missing.push('course');
  if (!classification.dishForm) missing.push('dish form');
  if (!classification.cookingMethod?.length) missing.push('cooking method');

  return {
    valid: missing.length === 0,
    missing,
  };
}