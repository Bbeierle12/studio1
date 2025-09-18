import {googleAI} from '@genkit-ai/googleai';
import {genkit} from 'genkit';

// By not initializing genkit globally and exporting the plugin,
// we can avoid having genkit bundled in the middleware.
export const googleAiPlugin = googleAI();

export const ai = genkit({
  plugins: [googleAI()],
  model: 'googleai/gemini-2.5-flash',
});
