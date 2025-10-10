import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/data';
import { z } from 'zod';
import { 
  withErrorHandler, 
  createSuccessResponse, 
  ApiError,
  validateRequestBody 
} from '@/lib/api-utils';

const VoiceAssistantSettingsSchema = z.object({
  model: z.string().min(1),
  temperature: z.number().min(0).max(2),
  maxTokens: z.number().min(50).max(4000),
  topP: z.number().min(0).max(1),
  frequencyPenalty: z.number().min(-2).max(2),
  presencePenalty: z.number().min(-2).max(2),
  systemPrompt: z.string().min(10),
  responseMaxLength: z.number().min(50).max(500),
});

type VoiceAssistantSettings = z.infer<typeof VoiceAssistantSettingsSchema>;

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

async function handleGetSettings(request: NextRequest) {
  // Check authentication and authorization
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    throw ApiError.unauthorized('Authentication required');
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, role: true },
  });

  if (!user || user.role !== 'SUPER_ADMIN') {
    throw ApiError.forbidden('Only Super Admins can access system settings');
  }

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

  const voiceAssistantSettings: Partial<VoiceAssistantSettings> = {};

  if (settingsMap[SETTING_KEYS.MODEL]) {
    voiceAssistantSettings.model = settingsMap[SETTING_KEYS.MODEL];
  }
  if (settingsMap[SETTING_KEYS.TEMPERATURE]) {
    voiceAssistantSettings.temperature = parseFloat(settingsMap[SETTING_KEYS.TEMPERATURE]);
  }
  if (settingsMap[SETTING_KEYS.MAX_TOKENS]) {
    voiceAssistantSettings.maxTokens = parseInt(settingsMap[SETTING_KEYS.MAX_TOKENS]);
  }
  if (settingsMap[SETTING_KEYS.TOP_P]) {
    voiceAssistantSettings.topP = parseFloat(settingsMap[SETTING_KEYS.TOP_P]);
  }
  if (settingsMap[SETTING_KEYS.FREQUENCY_PENALTY]) {
    voiceAssistantSettings.frequencyPenalty = parseFloat(settingsMap[SETTING_KEYS.FREQUENCY_PENALTY]);
  }
  if (settingsMap[SETTING_KEYS.PRESENCE_PENALTY]) {
    voiceAssistantSettings.presencePenalty = parseFloat(settingsMap[SETTING_KEYS.PRESENCE_PENALTY]);
  }
  if (settingsMap[SETTING_KEYS.SYSTEM_PROMPT]) {
    voiceAssistantSettings.systemPrompt = settingsMap[SETTING_KEYS.SYSTEM_PROMPT];
  }
  if (settingsMap[SETTING_KEYS.RESPONSE_MAX_LENGTH]) {
    voiceAssistantSettings.responseMaxLength = parseInt(settingsMap[SETTING_KEYS.RESPONSE_MAX_LENGTH]);
  }

  return createSuccessResponse(voiceAssistantSettings);
}

async function handlePostSettings(request: NextRequest) {
  // Check authentication and authorization
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    throw ApiError.unauthorized('Authentication required');
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, role: true, email: true },
  });

  if (!user || user.role !== 'SUPER_ADMIN') {
    throw ApiError.forbidden('Only Super Admins can modify system settings');
  }

  const body = await request.json();
  const settings = validateRequestBody<VoiceAssistantSettings>(
    VoiceAssistantSettingsSchema,
    body
  );

  // Save each setting to the database
  const updateOperations = [
    {
      key: SETTING_KEYS.MODEL,
      value: settings.model,
      description: 'OpenAI model for voice assistant',
    },
    {
      key: SETTING_KEYS.TEMPERATURE,
      value: settings.temperature.toString(),
      description: 'Temperature parameter for AI responses (0.0-2.0)',
    },
    {
      key: SETTING_KEYS.MAX_TOKENS,
      value: settings.maxTokens.toString(),
      description: 'Maximum tokens for AI responses',
    },
    {
      key: SETTING_KEYS.TOP_P,
      value: settings.topP.toString(),
      description: 'Top P (nucleus sampling) parameter (0.0-1.0)',
    },
    {
      key: SETTING_KEYS.FREQUENCY_PENALTY,
      value: settings.frequencyPenalty.toString(),
      description: 'Frequency penalty to reduce repetition (-2.0 to 2.0)',
    },
    {
      key: SETTING_KEYS.PRESENCE_PENALTY,
      value: settings.presencePenalty.toString(),
      description: 'Presence penalty to encourage new topics (-2.0 to 2.0)',
    },
    {
      key: SETTING_KEYS.SYSTEM_PROMPT,
      value: settings.systemPrompt,
      description: 'System prompt defining assistant behavior',
    },
    {
      key: SETTING_KEYS.RESPONSE_MAX_LENGTH,
      value: settings.responseMaxLength.toString(),
      description: 'Suggested maximum response length in words',
    },
  ];

  // Use transaction to update all settings atomically
  await prisma.$transaction(
    updateOperations.map(({ key, value, description }) =>
      prisma.systemSetting.upsert({
        where: { key },
        update: {
          value,
          updatedBy: user.email,
        },
        create: {
          key,
          value,
          category: 'AI',
          description,
          dataType: key === SETTING_KEYS.SYSTEM_PROMPT ? 'string' : 'number',
          isPublic: false,
          updatedBy: user.email,
        },
      })
    )
  );

  // Log the action
  await prisma.auditLog.create({
    data: {
      action: 'UPDATE',
      entityType: 'VoiceAssistantSettings',
      entityId: 'voice_assistant_config',
      userId: user.id,
      changes: {
        settingsUpdated: Object.keys(SETTING_KEYS).length,
        model: settings.model,
        temperature: settings.temperature,
        maxTokens: settings.maxTokens,
      },
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
    },
  });

  return createSuccessResponse({ message: 'Settings updated successfully' });
}

export const GET = withErrorHandler(handleGetSettings);
export const POST = withErrorHandler(handlePostSettings);
