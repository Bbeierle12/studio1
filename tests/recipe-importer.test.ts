import { describe, it, expect, vi, beforeEach } from 'vitest';
import { importRecipeFromUrl, extractRecipeContent } from '../src/lib/recipe-importer';
import { generateObject } from 'ai';

vi.mock('dns/promises', () => ({
  lookup: vi.fn(async () => [{ address: '93.184.216.34', family: 4 }]),
}));

vi.mock('@ai-sdk/google', () => ({
  google: vi.fn(() => 'mock-google-model'),
}));

vi.mock('ai', () => ({
  generateObject: vi.fn(),
}));

global.fetch = vi.fn();

const MOCK_RECIPE = {
  title: 'Mocked Chocolate Chip Cookies',
  description: 'Delicious homemade cookies.',
  ingredients: [{ item: 'Flour', amount: '2', unit: 'cups' }],
  instructions: ['Mix ingredients', 'Bake at 350 for 10 minutes'],
  prepTime: 15,
  cookTime: 10,
  servings: 24,
};

function mockPage(html: string) {
  (global.fetch as any).mockResolvedValue({
    ok: true,
    status: 200,
    url: 'https://example.com/cookies',
    headers: new Headers(),
    text: () => Promise.resolve(html),
  });
}

describe('extractRecipeContent', () => {
  it('prefers the JSON-LD Recipe block over page boilerplate', () => {
    const html = `<html><head>${'<style>.a{color:red}</style>'.repeat(50)}
      <script type="application/ld+json">{"@type":"Recipe","name":"Dragon Noodles"}</script>
      </head><body><p>ads</p></body></html>`;

    const content = extractRecipeContent(html);
    expect(content).toContain('"@type":"Recipe"');
    expect(content).toContain('Dragon Noodles');
    expect(content).not.toContain('<style>');
  });

  it('ignores non-Recipe JSON-LD blocks', () => {
    const html = `<html><head>
      <script type="application/ld+json">{"@type":"WebSite","name":"Site"}</script>
      </head><body><h1>Cookies</h1><p>Flour and sugar.</p></body></html>`;

    const content = extractRecipeContent(html);
    expect(content).not.toContain('WebSite');
    expect(content).toContain('Cookies');
  });

  it('strips scripts, styles, and tags when there is no JSON-LD', () => {
    const html = `<html><head><script>track()</script><style>.x{}</style></head>
      <body><h1>Cookies</h1><p>Flour&nbsp;and sugar.</p></body></html>`;

    const content = extractRecipeContent(html);
    expect(content).not.toContain('track()');
    expect(content).not.toContain('.x{}');
    expect(content).toContain('Cookies');
    expect(content).toContain('Flour and sugar.');
  });

  it('preserves meta description tags (for social media recipes)', () => {
    const html = `<html>
      <head>
        <meta property="og:description" content="Social media recipe caption here">
      </head>
      <body><p>Barely anything else</p></body>
    </html>`;

    const content = extractRecipeContent(html);
    expect(content).toContain('Social media recipe caption here');
    expect(content).toContain('Barely anything else');
  });

  it('caps content length to bound prompt cost', () => {
    const html = `<body>${'word '.repeat(20000)}</body>`;
    expect(extractRecipeContent(html).length).toBeLessThanOrEqual(15000);
  });
});

describe('importRecipeFromUrl', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(generateObject as any).mockResolvedValue({ object: MOCK_RECIPE });
  });

  it('imports and parses a recipe from a valid URL', async () => {
    mockPage('<html><body><h1>Chocolate Chip Cookies</h1><p>Ingredients: Flour</p></body></html>');

    const result = await importRecipeFromUrl('https://example.com/cookies');

    expect(result.title).toBe('Mocked Chocolate Chip Cookies');
    expect(result.ingredients.length).toBeGreaterThan(0);
    expect(result.instructions.length).toBeGreaterThan(0);
  });

  it('sends browser-like headers so recipe sites do not 403 the fetch', async () => {
    mockPage('<html><body>ok</body></html>');

    await importRecipeFromUrl('https://example.com/cookies');

    const [, init] = (global.fetch as any).mock.calls[0];
    expect(init.headers['User-Agent']).toContain('Mozilla');
  });

  it('rejects an invalid URL without fetching', async () => {
    await expect(importRecipeFromUrl('not-a-valid-url')).rejects.toThrow('Invalid URL');
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('rejects SSRF attempts against internal addresses without fetching', async () => {
    await expect(importRecipeFromUrl('http://169.254.169.254/latest/meta-data/')).rejects.toThrow(
      'Invalid URL'
    );
    await expect(importRecipeFromUrl('http://127.0.0.1/admin')).rejects.toThrow('Invalid URL');
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('rejects non-http(s) schemes without fetching', async () => {
    await expect(importRecipeFromUrl('file:///etc/passwd')).rejects.toThrow('Invalid URL');
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('throws when the page fetch fails', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      headers: new Headers(),
      text: () => Promise.resolve(''),
    });

    await expect(importRecipeFromUrl('https://example.com/404')).rejects.toThrow(
      'Failed to fetch the URL'
    );
  });

  it('throws a client-safe error when the model fails', async () => {
    mockPage('<html><body>ok</body></html>');
    vi.mocked(generateObject as any).mockRejectedValue(new Error('quota exceeded: internals'));

    await expect(importRecipeFromUrl('https://example.com/cookies')).rejects.toThrow(
      'Failed to parse the recipe using AI'
    );
  });
});
