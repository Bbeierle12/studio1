import { prisma } from '@/lib/data';

export interface VoiceAssistantSettings {
  model: string;
  temperature: number;
  maxTokens: number;
  topP: number;
  frequencyPenalty: number;
  presencePenalty: number;
  systemPrompt: string;
  responseMaxLength: number;
}

const DEFAULT_SETTINGS: VoiceAssistantSettings = {
  model: 'gpt-4-turbo',
  temperature: 0.7,
  maxTokens: 500,
  topP: 1.0,
  frequencyPenalty: 0.0,
  presencePenalty: 0.0,
  systemPrompt: `You are Chef Assistant, a helpful AI cooking companion designed to help people while they cook. 

You are especially helpful when someone has dirty hands and needs voice assistance. Keep responses concise but informative - ideal for speaking aloud.

You can help with:
- Cooking techniques and tips
- Ingredient substitutions
- Recipe modifications
- Food safety advice
- Timing and temperature guidance
- Kitchen equipment questions
- Dietary restrictions and alternatives

Keep responses under 100 words when possible, and always prioritize food safety. Be encouraging and friendly.`,
  responseMaxLength: 100,
};

const SETTING_KEYS = {
  MODEL: 'voice_assistant_model',
  TEMPERATURE: 'voice_assistant_temperature',
  MAX_TOKENS: 'voice_assistant_max_tokens',
  TOP_P: 'voice_assistant_top_p',
  FREQUENCY_PENALTY: 'voice_assistant_frequency_penalty',
  PRESENCE_PENALTY: 'voice_assistant_presence_penalty',
  SYSTEM_PROMPT: 'voice_assistant_system_prompt',
  RESPONSE_MAX_LENGTH: 'voice_assistant_response_max_length',
};

// Cache settings for 5 minutes to reduce database queries
let cachedSettings: VoiceAssistantSettings | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch voice assistant settings from the database with caching
 */
export async function getVoiceAssistantSettings(): Promise<VoiceAssistantSettings> {
  const now = Date.now();
  
  // Return cached settings if still valid
  if (cachedSettings && (now - cacheTimestamp) < CACHE_DURATION) {
    return cachedSettings;
  }

  try {
    // Fetch all voice assistant settings
    const settings = await prisma.systemSetting.findMany({
      where: {
        key: {
          in: Object.values(SETTING_KEYS),
        },
      },
    });

    // Convert to settings object
    const settingsMap = settings.reduce((acc, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {} as Record<string, string>);

    // Build settings object with defaults for missing values
    const voiceAssistantSettings: VoiceAssistantSettings = {
      model: settingsMap[SETTING_KEYS.MODEL] || DEFAULT_SETTINGS.model,
      temperature: settingsMap[SETTING_KEYS.TEMPERATURE] 
        ? parseFloat(settingsMap[SETTING_KEYS.TEMPERATURE]) 
        : DEFAULT_SETTINGS.temperature,
      maxTokens: settingsMap[SETTING_KEYS.MAX_TOKENS]
        ? parseInt(settingsMap[SETTING_KEYS.MAX_TOKENS])
        : DEFAULT_SETTINGS.maxTokens,
      topP: settingsMap[SETTING_KEYS.TOP_P]
        ? parseFloat(settingsMap[SETTING_KEYS.TOP_P])
        : DEFAULT_SETTINGS.topP,
      frequencyPenalty: settingsMap[SETTING_KEYS.FREQUENCY_PENALTY]
        ? parseFloat(settingsMap[SETTING_KEYS.FREQUENCY_PENALTY])
        : DEFAULT_SETTINGS.frequencyPenalty,
      presencePenalty: settingsMap[SETTING_KEYS.PRESENCE_PENALTY]
        ? parseFloat(settingsMap[SETTING_KEYS.PRESENCE_PENALTY])
        : DEFAULT_SETTINGS.presencePenalty,
      systemPrompt: settingsMap[SETTING_KEYS.SYSTEM_PROMPT] || DEFAULT_SETTINGS.systemPrompt,
      responseMaxLength: settingsMap[SETTING_KEYS.RESPONSE_MAX_LENGTH]
        ? parseInt(settingsMap[SETTING_KEYS.RESPONSE_MAX_LENGTH])
        : DEFAULT_SETTINGS.responseMaxLength,
    };

    // Update cache
    cachedSettings = voiceAssistantSettings;
    cacheTimestamp = now;

    return voiceAssistantSettings;
  } catch (error) {
    console.error('Failed to fetch voice assistant settings, using defaults:', error);
    return DEFAULT_SETTINGS;
  }
}

/**
 * Clear the settings cache (useful after updates)
 */
export function clearVoiceAssistantSettingsCache(): void {
  cachedSettings = null;
  cacheTimestamp = 0;
}

/**
 * Get the default settings
 */
export function getDefaultVoiceAssistantSettings(): VoiceAssistantSettings {
  return { ...DEFAULT_SETTINGS };
}
