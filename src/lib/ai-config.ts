// Single source of truth for the Gemini model used by AI features.
// Override with GEMINI_MODEL when the default is capacity-limited or retired
// (gemini-1.5-flash retired 2026; gemini-2.5-* gated for new API keys).
export const GEMINI_MODEL_ID = process.env.GEMINI_MODEL ?? 'gemini-3.5-flash';
