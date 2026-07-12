import { describe, it, expect, vi, beforeEach } from 'vitest';
import { importRecipeFromUrl } from '../src/lib/recipe-importer';

// Mock fetch
global.fetch = vi.fn();

// Mock the AI generation function
vi.mock('@ai-sdk/openai', () => {
  return {
    openai: vi.fn(),
  };
});

vi.mock('ai', () => {
  return {
    generateObject: vi.fn().mockResolvedValue({
      object: {
        title: 'Mocked Chocolate Chip Cookies',
        description: 'Delicious homemade cookies.',
        ingredients: [{ item: 'Flour', amount: '2', unit: 'cups' }],
        instructions: ['Mix ingredients', 'Bake at 350 for 10 minutes'],
        prepTime: 15,
        cookTime: 10,
        servings: 24,
      }
    }),
  };
});

describe('Recipe Importer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should successfully import and parse a recipe from a valid URL', async () => {
    // Setup fetch mock to return some fake HTML
    (global.fetch as any).mockResolvedValue({
      ok: true,
      text: () => Promise.resolve('<html><body><h1>Chocolate Chip Cookies</h1><p>Ingredients: Flour</p></body></html>'),
    });

    const result = await importRecipeFromUrl('https://example.com/cookies');

    expect(global.fetch).toHaveBeenCalledWith('https://example.com/cookies');
    expect(result).toBeDefined();
    expect(result.title).toBe('Mocked Chocolate Chip Cookies');
    expect(result.ingredients?.length).toBeGreaterThan(0);
    expect(result.instructions?.length).toBeGreaterThan(0);
  });

  it('should throw an error if the URL is invalid', async () => {
    await expect(importRecipeFromUrl('not-a-valid-url')).rejects.toThrow('Invalid URL');
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('should throw an error if fetching the URL fails (e.g. 404)', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    });

    await expect(importRecipeFromUrl('https://example.com/404')).rejects.toThrow('Failed to fetch the URL');
  });
});
