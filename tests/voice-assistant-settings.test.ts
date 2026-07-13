import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/data', () => ({ prisma: {} }));

import { sanitizeModel } from '../src/lib/voice-assistant-settings';

describe('sanitizeModel', () => {
  it('keeps a stored Gemini model id', () => {
    expect(sanitizeModel('gemini-3.1-flash-lite')).toBe('gemini-3.1-flash-lite');
  });

  it('replaces a legacy OpenAI model id left in the settings table', () => {
    expect(sanitizeModel('gpt-4-turbo')).toMatch(/^gemini-/);
    expect(sanitizeModel('gpt-3.5-turbo')).toMatch(/^gemini-/);
  });

  it('falls back to the default when unset', () => {
    expect(sanitizeModel(undefined)).toMatch(/^gemini-/);
    expect(sanitizeModel(null)).toMatch(/^gemini-/);
    expect(sanitizeModel('')).toMatch(/^gemini-/);
  });
});
