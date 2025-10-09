import { z } from 'zod'
import type { CulinaryClassification } from '@/types/culinary-taxonomy'

// Schema for parsed recipe data
export const ParsedRecipeSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  ingredients: z.array(z.string()),
  instructions: z.array(z.string()),
  prepTime: z.number().optional(),
  cookTime: z.number().optional(),
  totalTime: z.number().optional(),
  servings: z.number().optional(),
  cuisine: z.string().optional(),
  course: z.string().optional(),
  difficulty: z.string().optional(),
  imageUrl: z.string().optional(),
  sourceUrl: z.string().optional(),
  author: z.string().optional(),
  nutrition: z.object({
    calories: z.number().optional(),
    protein: z.number().optional(),
    carbs: z.number().optional(),
    fat: z.number().optional(),
    fiber: z.number().optional(),
    sugar: z.number().optional(),
    sodium: z.number().optional(),
  }).optional(),
  tags: z.array(z.string()).optional(),
  // New: Culinary classification
  classification: z.custom<CulinaryClassification>().optional(),
})

export type ParsedRecipe = z.infer<typeof ParsedRecipeSchema>

// Site-specific parsers configuration
const SITE_PARSERS: Record<string, {
  patterns: RegExp[]
  jsonLdPath?: string
  customParser?: (html: string) => Partial<ParsedRecipe>
}> = {
  allrecipes: {
    patterns: [/allrecipes\.com/],
    jsonLdPath: 'Recipe',
  },
  foodnetwork: {
    patterns: [/foodnetwork\.com/],
    jsonLdPath: 'Recipe',
  },
  seriouseats: {
    patterns: [/seriouseats\.com/],
    jsonLdPath: 'Recipe',
  },
  bonappetit: {
    patterns: [/bonappetit\.com/],
    jsonLdPath: 'Recipe',
  },
  epicurious: {
    patterns: [/epicurious\.com/],
    jsonLdPath: 'Recipe',
  },
  nytcooking: {
    patterns: [/cooking\.nytimes\.com/],
    jsonLdPath: 'Recipe',
  },
  bbcgoodfood: {
    patterns: [/bbcgoodfood\.com/],
    jsonLdPath: 'Recipe',
  },
  tasty: {
    patterns: [/tasty\.co/],
    jsonLdPath: 'Recipe',
  },
  simplyrecipes: {
    patterns: [/simplyrecipes\.com/],
    jsonLdPath: 'Recipe',
  },
  budgetbytes: {
    patterns: [/budgetbytes\.com/],
    jsonLdPath: 'Recipe',
  },
  skinnytaste: {
    patterns: [/skinnytaste\.com/],
    jsonLdPath: 'Recipe',
  },
  delish: {
    patterns: [/delish\.com/],
    jsonLdPath: 'Recipe',
  },
  recipetineats: {
    patterns: [/recipetineats\.com/],
    jsonLdPath: 'Recipe',
  },
  cookieandkate: {
    patterns: [/cookieandkate\.com/],
    jsonLdPath: 'Recipe',
  },
  minimalistbaker: {
    patterns: [/minimalistbaker\.com/],
    jsonLdPath: 'Recipe',
  },
}

export class RecipeParser {
  /**
   * Parse a recipe from a URL
   */
  async parseFromUrl(url: string, enrichWithClassification = false): Promise<ParsedRecipe> {
    try {
      // Fetch the HTML content
      const response = await fetch(`/api/recipe-import/fetch?url=${encodeURIComponent(url)}`)

      if (!response.ok) {
        throw new Error(`Failed to fetch recipe from URL: ${response.statusText}`)
      }

      const { html, finalUrl } = await response.json()

      // Parse the HTML
      const recipe = this.parseFromHtml(html, finalUrl || url)

      // Optionally enrich with classification
      if (enrichWithClassification) {
        recipe.classification = await this.inferClassification(recipe)
      }

      return recipe
    } catch (error) {
      console.error('Failed to parse recipe from URL:', error)
      throw new Error(`Failed to parse recipe from URL: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Parse a recipe from HTML content
   */
  parseFromHtml(html: string, sourceUrl?: string): ParsedRecipe {
    let recipe: Partial<ParsedRecipe> = { sourceUrl }

    // Try to extract JSON-LD structured data first
    const jsonLdRecipe = this.extractJsonLd(html)
    if (jsonLdRecipe) {
      recipe = { ...recipe, ...jsonLdRecipe }
    }

    // Try microdata extraction
    const microdataRecipe = this.extractMicrodata(html)
    if (microdataRecipe) {
      recipe = { ...recipe, ...microdataRecipe }
    }

    // Try site-specific parser if available
    if (sourceUrl) {
      const siteSpecific = this.applySiteSpecificParser(html, sourceUrl)
      if (siteSpecific) {
        recipe = { ...recipe, ...siteSpecific }
      }
    }

    // Fallback to generic parsing if needed
    if (!recipe.title || !recipe.ingredients || recipe.ingredients.length === 0) {
      const genericRecipe = this.genericParse(html)
      recipe = { ...recipe, ...genericRecipe }
    }

    // Clean and validate the recipe data
    const cleanedRecipe = this.cleanRecipeData(recipe)

    // Validate with schema
    const result = ParsedRecipeSchema.safeParse(cleanedRecipe)
    if (!result.success) {
      throw new Error(`Invalid recipe data: ${result.error.message}`)
    }

    return result.data
  }

  /**
   * Extract JSON-LD structured data
   */
  private extractJsonLd(html: string): Partial<ParsedRecipe> | null {
    const jsonLdRegex = /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi
    const matches = html.matchAll(jsonLdRegex)

    for (const match of matches) {
      try {
        const jsonData = JSON.parse(match[1])
        const recipe = this.findRecipeInJsonLd(jsonData)

        if (recipe) {
          return this.convertJsonLdToRecipe(recipe)
        }
      } catch (error) {
        console.warn('Failed to parse JSON-LD:', error)
      }
    }

    return null
  }

  /**
   * Find Recipe object in JSON-LD data
   */
  private findRecipeInJsonLd(data: any): any {
    if (!data) return null

    // Direct Recipe type
    if (data['@type'] === 'Recipe') {
      return data
    }

    // Array of items
    if (Array.isArray(data)) {
      for (const item of data) {
        const recipe = this.findRecipeInJsonLd(item)
        if (recipe) return recipe
      }
    }

    // Graph structure
    if (data['@graph'] && Array.isArray(data['@graph'])) {
      return this.findRecipeInJsonLd(data['@graph'])
    }

    // Nested object
    if (typeof data === 'object') {
      for (const key in data) {
        if (key !== '@context' && key !== '@id') {
          const recipe = this.findRecipeInJsonLd(data[key])
          if (recipe) return recipe
        }
      }
    }

    return null
  }

  /**
   * Convert JSON-LD Recipe to ParsedRecipe
   */
  private convertJsonLdToRecipe(jsonLd: any): Partial<ParsedRecipe> {
    const recipe: Partial<ParsedRecipe> = {}

    // Title
    recipe.title = jsonLd.name || ''

    // Description
    recipe.description = jsonLd.description || ''

    // Ingredients
    if (jsonLd.recipeIngredient) {
      recipe.ingredients = Array.isArray(jsonLd.recipeIngredient)
        ? jsonLd.recipeIngredient.map((i: any) => String(i).trim())
        : [String(jsonLd.recipeIngredient).trim()]
    }

    // Instructions
    if (jsonLd.recipeInstructions) {
      recipe.instructions = this.parseInstructions(jsonLd.recipeInstructions)
    }

    // Times
    recipe.prepTime = this.parseDuration(jsonLd.prepTime)
    recipe.cookTime = this.parseDuration(jsonLd.cookTime)
    recipe.totalTime = this.parseDuration(jsonLd.totalTime)

    // Servings
    if (jsonLd.recipeYield) {
      const servings = parseInt(String(jsonLd.recipeYield).replace(/\D/g, ''))
      if (!isNaN(servings)) {
        recipe.servings = servings
      }
    }

    // Categories
    recipe.cuisine = jsonLd.recipeCuisine
    recipe.course = jsonLd.recipeCategory

    // Image
    if (jsonLd.image) {
      if (typeof jsonLd.image === 'string') {
        recipe.imageUrl = jsonLd.image
      } else if (jsonLd.image.url) {
        recipe.imageUrl = jsonLd.image.url
      } else if (jsonLd.image['@id']) {
        recipe.imageUrl = jsonLd.image['@id']
      } else if (Array.isArray(jsonLd.image) && jsonLd.image.length > 0) {
        recipe.imageUrl = typeof jsonLd.image[0] === 'string' ? jsonLd.image[0] : jsonLd.image[0].url
      }
    }

    // Author
    if (jsonLd.author) {
      if (typeof jsonLd.author === 'string') {
        recipe.author = jsonLd.author
      } else if (jsonLd.author.name) {
        recipe.author = jsonLd.author.name
      }
    }

    // Nutrition
    if (jsonLd.nutrition) {
      recipe.nutrition = {
        calories: this.parseNutritionValue(jsonLd.nutrition.calories),
        protein: this.parseNutritionValue(jsonLd.nutrition.proteinContent),
        carbs: this.parseNutritionValue(jsonLd.nutrition.carbohydrateContent),
        fat: this.parseNutritionValue(jsonLd.nutrition.fatContent),
        fiber: this.parseNutritionValue(jsonLd.nutrition.fiberContent),
        sugar: this.parseNutritionValue(jsonLd.nutrition.sugarContent),
        sodium: this.parseNutritionValue(jsonLd.nutrition.sodiumContent),
      }
    }

    // Tags/Keywords
    if (jsonLd.keywords) {
      recipe.tags = typeof jsonLd.keywords === 'string'
        ? jsonLd.keywords.split(',').map((k: string) => k.trim())
        : Array.isArray(jsonLd.keywords) ? jsonLd.keywords : []
    }

    return recipe
  }

  /**
   * Parse instructions from various formats
   */
  private parseInstructions(instructions: any): string[] {
    if (!instructions) return []

    if (typeof instructions === 'string') {
      return instructions.split(/\n+/).filter(i => i.trim())
    }

    if (Array.isArray(instructions)) {
      return instructions.map(instruction => {
        if (typeof instruction === 'string') {
          return instruction
        }
        if (instruction.text) {
          return instruction.text
        }
        if (instruction.name) {
          return instruction.name
        }
        return String(instruction)
      }).filter(i => i.trim())
    }

    return []
  }

  /**
   * Parse ISO 8601 duration to minutes
   */
  private parseDuration(duration: string | undefined): number | undefined {
    if (!duration) return undefined

    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/)
    if (!match) return undefined

    const hours = parseInt(match[1] || '0')
    const minutes = parseInt(match[2] || '0')

    return hours * 60 + minutes
  }

  /**
   * Parse nutrition value from various formats
   */
  private parseNutritionValue(value: any): number | undefined {
    if (!value) return undefined

    const num = parseFloat(String(value).replace(/[^\d.]/g, ''))
    return isNaN(num) ? undefined : num
  }

  /**
   * Extract recipe from microdata
   */
  private extractMicrodata(html: string): Partial<ParsedRecipe> | null {
    // This is a simplified microdata parser
    // In production, you'd want to use a proper HTML parser
    const recipe: Partial<ParsedRecipe> = {}

    // Extract title from itemProp="name"
    const titleMatch = html.match(/itemprop="name"[^>]*>([^<]+)</i)
    if (titleMatch) {
      recipe.title = this.cleanText(titleMatch[1])
    }

    // Extract ingredients
    const ingredientMatches = html.matchAll(/itemprop="recipeIngredient"[^>]*>([^<]+)</gi)
    const ingredients = []
    for (const match of ingredientMatches) {
      ingredients.push(this.cleanText(match[1]))
    }
    if (ingredients.length > 0) {
      recipe.ingredients = ingredients
    }

    // Extract instructions
    const instructionMatches = html.matchAll(/itemprop="recipeInstructions"[^>]*>([^<]+)</gi)
    const instructions = []
    for (const match of instructionMatches) {
      instructions.push(this.cleanText(match[1]))
    }
    if (instructions.length > 0) {
      recipe.instructions = instructions
    }

    return Object.keys(recipe).length > 0 ? recipe : null
  }

  /**
   * Apply site-specific parser
   */
  private applySiteSpecificParser(html: string, url: string): Partial<ParsedRecipe> | null {
    for (const [siteName, config] of Object.entries(SITE_PARSERS)) {
      const matches = config.patterns.some(pattern => pattern.test(url))
      if (matches && config.customParser) {
        try {
          return config.customParser(html)
        } catch (error) {
          console.warn(`Site-specific parser failed for ${siteName}:`, error)
        }
      }
    }
    return null
  }

  /**
   * Generic recipe parsing fallback
   */
  private genericParse(html: string): Partial<ParsedRecipe> {
    const recipe: Partial<ParsedRecipe> = {}

    // Try to extract title from <h1> or <title>
    const h1Match = html.match(/<h1[^>]*>([^<]+)</i)
    const titleMatch = html.match(/<title[^>]*>([^<]+)</i)
    recipe.title = h1Match ? this.cleanText(h1Match[1]) :
                   titleMatch ? this.cleanText(titleMatch[1]).split('|')[0].split('-')[0] : ''

    // Look for common ingredient patterns
    const ingredientPatterns = [
      /<li[^>]*class="[^"]*ingredient[^"]*"[^>]*>([^<]+)</gi,
      /<span[^>]*class="[^"]*ingredient[^"]*"[^>]*>([^<]+)</gi,
      /<p[^>]*class="[^"]*ingredient[^"]*"[^>]*>([^<]+)</gi,
    ]

    const ingredients: string[] = []
    for (const pattern of ingredientPatterns) {
      const matches = html.matchAll(pattern)
      for (const match of matches) {
        const ingredient = this.cleanText(match[1])
        if (ingredient && ingredient.length > 2) {
          ingredients.push(ingredient)
        }
      }
    }
    if (ingredients.length > 0) {
      recipe.ingredients = ingredients
    }

    // Look for common instruction patterns
    const instructionPatterns = [
      /<li[^>]*class="[^"]*instruction[^"]*"[^>]*>([^<]+)</gi,
      /<div[^>]*class="[^"]*direction[^"]*"[^>]*>([^<]+)</gi,
      /<p[^>]*class="[^"]*step[^"]*"[^>]*>([^<]+)</gi,
    ]

    const instructions: string[] = []
    for (const pattern of instructionPatterns) {
      const matches = html.matchAll(pattern)
      for (const match of matches) {
        const instruction = this.cleanText(match[1])
        if (instruction && instruction.length > 10) {
          instructions.push(instruction)
        }
      }
    }
    if (instructions.length > 0) {
      recipe.instructions = instructions
    }

    // Extract image
    const imgPatterns = [
      /<meta[^>]*property="og:image"[^>]*content="([^"]+)"/i,
      /<img[^>]*class="[^"]*recipe[^"]*"[^>]*src="([^"]+)"/i,
    ]
    for (const pattern of imgPatterns) {
      const match = html.match(pattern)
      if (match) {
        recipe.imageUrl = match[1]
        break
      }
    }

    return recipe
  }

  /**
   * Clean and validate recipe data
   */
  private cleanRecipeData(recipe: Partial<ParsedRecipe>): Partial<ParsedRecipe> {
    const cleaned: Partial<ParsedRecipe> = { ...recipe }

    // Clean title
    if (cleaned.title) {
      cleaned.title = this.cleanText(cleaned.title)
    }

    // Clean description
    if (cleaned.description) {
      cleaned.description = this.cleanText(cleaned.description)
    }

    // Clean ingredients
    if (cleaned.ingredients) {
      cleaned.ingredients = cleaned.ingredients
        .map(i => this.cleanText(i))
        .filter(i => i.length > 2)
    }

    // Clean instructions
    if (cleaned.instructions) {
      cleaned.instructions = cleaned.instructions
        .map(i => this.cleanText(i))
        .filter(i => i.length > 10)
    }

    // Ensure image URL is absolute
    if (cleaned.imageUrl && cleaned.sourceUrl) {
      try {
        const base = new URL(cleaned.sourceUrl)
        const imageUrl = new URL(cleaned.imageUrl, base)
        cleaned.imageUrl = imageUrl.href
      } catch {
        // Keep relative URL if parsing fails
      }
    }

    // Clean tags
    if (cleaned.tags) {
      cleaned.tags = cleaned.tags
        .map(t => this.cleanText(t))
        .filter(t => t.length > 0)
    }

    return cleaned
  }

  /**
   * Clean text helper
   */
  private cleanText(text: string): string {
    return text
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&nbsp;/g, ' ') // Replace non-breaking spaces
      .replace(/&amp;/g, '&') // Decode ampersands
      .replace(/&lt;/g, '<') // Decode less than
      .replace(/&gt;/g, '>') // Decode greater than
      .replace(/&quot;/g, '"') // Decode quotes
      .replace(/&#39;/g, "'") // Decode apostrophes
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim()
  }

  /**
   * Validate if a URL is supported
   */
  static isSupportedUrl(url: string): boolean {
    for (const config of Object.values(SITE_PARSERS)) {
      if (config.patterns.some(pattern => pattern.test(url))) {
        return true
      }
    }
    // Allow any URL as we have generic parsing
    return true
  }

  /**
   * Get list of supported sites
   */
  static getSupportedSites(): string[] {
    return [
      'AllRecipes',
      'Food Network',
      'Serious Eats',
      'Bon Appétit',
      'Epicurious',
      'NYT Cooking',
      'BBC Good Food',
      'Tasty',
      'Simply Recipes',
      'Budget Bytes',
      'Skinnytaste',
      'Delish',
      'RecipeTin Eats',
      'Cookie and Kate',
      'Minimalist Baker',
      'And many more...'
    ]
  }

  /**
   * Infer culinary classification from parsed recipe
   */
  async inferClassification(recipe: ParsedRecipe): Promise<CulinaryClassification> {
    const { CulinaryClassifier } = await import('./culinary/classification-engine')
    const { analyticsTracker } = await import('./culinary/analytics-tracker')
    
    const classifier = new CulinaryClassifier()
    const classification = classifier.classifyRecipe(recipe)
    
    // Track the classification for analytics
    if (classification && Object.keys(classification).length > 0) {
      analyticsTracker.trackClassification(classification, {
        prepTime: recipe.prepTime,
        cookTime: recipe.cookTime,
        ingredients: recipe.ingredients,
      })
    }
    
    return classification
  }
}