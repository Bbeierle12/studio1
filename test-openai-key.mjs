import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, '.env.local') });

const apiKey = process.env.OPENAI_API_KEY;

console.log('🔑 Testing OpenAI API Key...');
console.log(`Key starts with: ${apiKey?.substring(0, 10)}...`);
console.log(`Key length: ${apiKey?.length}`);

if (!apiKey) {
  console.error('❌ No API key found in .env.local');
  process.exit(1);
}

// Test the API key with a simple request
async function testApiKey() {
  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ API Key is VALID!');
      console.log(`📊 You have access to ${data.data?.length || 0} models`);
      
      // Check for specific models
      const models = data.data?.map(m => m.id) || [];
      const hasGPT4 = models.some(m => m.includes('gpt-4'));
      const hasGPT4Turbo = models.some(m => m.includes('gpt-4-turbo'));
      
      console.log(`🤖 GPT-4 access: ${hasGPT4 ? '✅ Yes' : '❌ No'}`);
      console.log(`🚀 GPT-4-Turbo access: ${hasGPT4Turbo ? '✅ Yes' : '❌ No'}`);
      
      if (!hasGPT4Turbo) {
        console.warn('⚠️  You may need to use gpt-4 or gpt-3.5-turbo instead');
      }
    } else {
      const errorData = await response.json();
      console.error('❌ API Key is INVALID or has issues:');
      console.error(`Status: ${response.status}`);
      console.error(`Error:`, errorData);
      
      if (response.status === 401) {
        console.error('\n💡 Possible issues:');
        console.error('   1. The API key has been revoked');
        console.error('   2. The API key is incorrect');
        console.error('   3. You need to regenerate a new key from https://platform.openai.com/api-keys');
      } else if (response.status === 429) {
        console.error('\n💡 Rate limit or quota exceeded');
        console.error('   Check your billing at https://platform.openai.com/account/billing');
      }
    }
  } catch (error) {
    console.error('❌ Network error:', error.message);
  }
}

testApiKey();
