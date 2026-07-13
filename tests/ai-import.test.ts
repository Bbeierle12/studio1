import { describe, it, expect, vi, beforeEach } from 'vitest';
import { parseRecipeFromText } from '../src/lib/ai-import';
import { generateObject } from 'ai';

vi.mock('@ai-sdk/google', () => ({
  google: vi.fn(() => 'mock-google-model'),
}));

vi.mock('ai', () => ({
  generateObject: vi.fn(),
}));

describe('parseRecipeFromText', () => {
  beforeEach(() => {
    vi.mocked(generateObject as any).mockReset();
  });

  it('parses messy caption text into the shared recipe envelope', async () => {
    vi.mocked(generateObject as any).mockResolvedValue({
      object: {
        title: 'Dragon Noodles',
        summary: 'Spicy quick noodles.',
        ingredients: ['4 oz lo mein noodles', '2 Tbsp butter'],
        instructions: ['Boil noodles.', 'Mix sauce.'],
        prepTime: 15,
        servings: 2,
        tags: ['spicy', 'quick'],
        cuisine: 'Asian',
        course: 'Main',
      },
    });

    const recipe = await parseRecipeFromText('POV: dragon noodles recipe 🔥 4oz noodles, butter...');

    expect(recipe.title).toBe('Dragon Noodles');
    expect(recipe.description).toBe('Spicy quick noodles.');
    expect(recipe.ingredients).toEqual(['4 oz lo mein noodles', '2 Tbsp butter']);
    expect(recipe.instructions).toHaveLength(2);
    expect(recipe.totalTime).toBe(15);
    expect(recipe.servings).toBe(2);
    expect(recipe.tags).toContain('spicy');
    expect(recipe.cuisine).toBe('Asian');
    expect(recipe.course).toBe('Main');
  });

  it('applies safe defaults when the model omits optional fields', async () => {
    vi.mocked(generateObject as any).mockResolvedValue({
      object: {
        title: '',
        ingredients: [],
        instructions: [],
      },
    });

    const recipe = await parseRecipeFromText('some text with no recipe');

    expect(recipe.title).toBe('Imported AI Recipe');
    expect(recipe.description).toBe('');
    expect(recipe.ingredients).toEqual([]);
    expect(recipe.instructions).toEqual([]);
    expect(recipe.tags).toEqual([]);
    expect(recipe.cuisine).toBe('');
    expect(recipe.course).toBe('');
  });

  it('rejects empty or whitespace-only input without calling the model', async () => {
    await expect(parseRecipeFromText('')).rejects.toThrow('No text');
    await expect(parseRecipeFromText('   \n ')).rejects.toThrow('No text');
    expect(generateObject).not.toHaveBeenCalled();
  });

  it('wraps model failures in a client-safe error', async () => {
    vi.mocked(generateObject as any).mockRejectedValue(new Error('quota exceeded: internal details'));

    await expect(parseRecipeFromText('valid recipe text')).rejects.toThrow(
      'Failed to process recipe with AI'
    );
  });
});
