import { google } from '@ai-sdk/google';

// Single source of truth for the Gemini model used by AI features.
// Override with GEMINI_MODEL when the default is capacity-limited or retired
// (gemini-1.5-flash retired 2026; gemini-2.5-* gated for new API keys).
export const GEMINI_MODEL_ID = process.env.GEMINI_MODEL ?? 'gemini-3.5-flash';

/**
 * The app is Gemini-only. Every AI feature resolves its model here so the
 * provider, model id, and env-var override stay in one place.
 */
export function geminiModel(modelId: string = GEMINI_MODEL_ID) {
  return google(modelId);
}

export function isGeminiConfigured(): boolean {
  return Boolean(process.env.GOOGLE_GENERATIVE_AI_API_KEY);
}

export const GEMINI_NOT_CONFIGURED_ERROR =
  'Gemini API key is not configured. Set GOOGLE_GENERATIVE_AI_API_KEY.';
