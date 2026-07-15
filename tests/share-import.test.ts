import { describe, it, expect } from 'vitest';
import {
  extractShareTarget,
  normalizeIngredients,
  normalizeInstructions,
} from '../src/lib/share-import';

describe('extractShareTarget', () => {
  it('prefers the url param when present', () => {
    expect(extractShareTarget({ url: 'https://a.com/r', text: 'ignore me' })).toEqual({
      kind: 'url',
      url: 'https://a.com/r',
    });
  });

  it('treats a bare URL in the text param as a url share (Android)', () => {
    expect(extractShareTarget({ text: 'https://tiktok.com/@x/video/1' })).toEqual({
      kind: 'url',
      url: 'https://tiktok.com/@x/video/1',
    });
  });

  it('extracts a URL embedded in caption text', () => {
    expect(
      extractShareTarget({ text: 'Check this out https://example.com/p/abc it slaps' })
    ).toEqual({ kind: 'url', url: 'https://example.com/p/abc' });
  });

  it('strips trailing punctuation from an embedded URL', () => {
    expect(extractShareTarget({ text: 'see https://a.com/r.' })).toEqual({
      kind: 'url',
      url: 'https://a.com/r',
    });
  });

  it('falls back to text for a social media URL if the caption is substantial', () => {
    const caption = 'Here is the recipe for cookies: 1 cup flour... https://instagram.com/p/xyz';
    expect(extractShareTarget({ text: caption })).toEqual({ kind: 'text', text: caption });
  });

  it('falls back to AI text extraction for a caption with no URL', () => {
    const caption = 'Garlic butter pasta: 8oz spaghetti, 4 tbsp butter. Boil, toss, serve.';
    expect(extractShareTarget({ text: caption })).toEqual({ kind: 'text', text: caption });
  });

  it('returns null for empty or too-short shares', () => {
    expect(extractShareTarget({})).toBeNull();
    expect(extractShareTarget({ text: '   ' })).toBeNull();
    expect(extractShareTarget({ text: 'yum' })).toBeNull();
  });

  it('ignores a title-only share', () => {
    expect(extractShareTarget({ title: 'Some Recipe' })).toBeNull();
  });
});

describe('normalizeIngredients', () => {
  it('passes through plain string ingredients (AI text route)', () => {
    expect(normalizeIngredients(['1 cup flour', '2 eggs'])).toEqual(['1 cup flour', '2 eggs']);
  });

  it('flattens {item, amount, unit} objects (URL import route)', () => {
    expect(
      normalizeIngredients([
        { item: 'Flour', amount: '2', unit: 'cups' },
        { item: 'Eggs', amount: '2' },
        { item: 'Salt' },
      ])
    ).toEqual(['2 cups Flour', '2 Eggs', 'Salt']);
  });

  it('drops empty entries and trims whitespace', () => {
    expect(normalizeIngredients(['  1 cup flour  ', '', { item: '' }, null])).toEqual([
      '1 cup flour',
    ]);
  });

  it('returns an empty array for missing or non-array input', () => {
    expect(normalizeIngredients(undefined)).toEqual([]);
    expect(normalizeIngredients(null)).toEqual([]);
    expect(normalizeIngredients('flour' as any)).toEqual([]);
  });
});

describe('normalizeInstructions', () => {
  it('passes through string steps', () => {
    expect(normalizeInstructions(['Mix.', 'Bake.'])).toEqual(['Mix.', 'Bake.']);
  });

  it('unwraps {text}/{step} objects and drops blanks', () => {
    expect(normalizeInstructions([{ text: 'Mix.' }, { step: 'Bake.' }, '', null])).toEqual([
      'Mix.',
      'Bake.',
    ]);
  });

  it('returns an empty array for missing input', () => {
    expect(normalizeInstructions(undefined)).toEqual([]);
  });
});
