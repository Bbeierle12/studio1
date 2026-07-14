/**
 * Pure helpers for the Web Share Target import flow.
 *
 * The share sheet hands us `url`, `text`, and `title` — but which field holds
 * what varies by platform (Android often puts the URL inside `text`, alone or
 * embedded in a caption). These helpers decide which import path to take and
 * reconcile the two backends' recipe shapes.
 */

export type ShareTarget =
  | { kind: 'url'; url: string }
  | { kind: 'text'; text: string };

export interface ShareParams {
  url?: string | null;
  text?: string | null;
  title?: string | null;
}

/** Shortest caption worth sending to the AI text importer. */
const MIN_TEXT_LENGTH = 10;

const URL_PATTERN = /https?:\/\/[^\s]+/;

export function extractShareTarget({ url, text }: ShareParams): ShareTarget | null {
  const isSocial = (link: string) => /instagram\.com|tiktok\.com|youtube\.com|youtu\.be|facebook\.com|twitter\.com|x\.com|pinterest\.com|insta\.com/i.test(link);
  
  const caption = text?.trim() || '';

  if (url && url.trim()) {
    const trimmedUrl = url.trim();
    if (isSocial(trimmedUrl)) {
      const stripped = caption.replace(trimmedUrl, '').trim();
      if (stripped.length > MIN_TEXT_LENGTH) {
        return { kind: 'text', text: caption };
      }
    }
    return { kind: 'url', url: trimmedUrl };
  }

  if (!caption) return null;

  const match = caption.match(URL_PATTERN);
  if (match) {
    // Trailing sentence punctuation is not part of the URL.
    const cleaned = match[0].replace(/[.,;:!?)\]}'"]+$/, '');
    
    if (isSocial(cleaned)) {
      const stripped = caption.replace(cleaned, '').trim();
      if (stripped.length > MIN_TEXT_LENGTH) {
        return { kind: 'text', text: caption };
      }
    }
    
    return { kind: 'url', url: cleaned };
  }

  if (caption.length > MIN_TEXT_LENGTH) {
    return { kind: 'text', text: caption };
  }

  return null;
}

/**
 * The URL importer returns {item, amount, unit} objects; the AI text importer
 * returns plain strings. Collapse both to the newline-joined strings the
 * recipe form expects.
 */
export function normalizeIngredients(ingredients: unknown): string[] {
  if (!Array.isArray(ingredients)) return [];

  return ingredients
    .map((entry) => {
      if (typeof entry === 'string') return entry.trim();
      if (entry && typeof entry === 'object') {
        const { amount, unit, item } = entry as Record<string, unknown>;
        return [amount, unit, item]
          .filter((part) => typeof part === 'string' && part.trim())
          .join(' ')
          .trim();
      }
      return '';
    })
    .filter((line) => line.length > 0);
}

export function normalizeInstructions(instructions: unknown): string[] {
  if (!Array.isArray(instructions)) return [];

  return instructions
    .map((entry) => {
      if (typeof entry === 'string') return entry.trim();
      if (entry && typeof entry === 'object') {
        const { text, step } = entry as Record<string, unknown>;
        const value = typeof text === 'string' ? text : typeof step === 'string' ? step : '';
        return value.trim();
      }
      return '';
    })
    .filter((line) => line.length > 0);
}
