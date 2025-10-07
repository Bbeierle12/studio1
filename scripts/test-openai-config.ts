#!/usr/bin/env tsx
/**
 * OpenAI API Configuration Test
 * Tests user and system OpenAI API keys
 */

import { prisma } from '../src/lib/data';
import { 
  getUserOpenAIKey, 
  hasValidOpenAIKey, 
  isValidOpenAIKeyFormat,
  createUserOpenAI 
} from '../src/lib/openai-utils';
import { generateText } from 'ai';

async function testOpenAIConfiguration() {
  console.log('🔍 Testing OpenAI API Configuration\n');
  
  // Test 1: Check environment variable
  console.log('1️⃣  Checking System API Key...');
  const systemKey = process.env.OPENAI_API_KEY;
  if (systemKey) {
    console.log(`   ✅ System key found: ****${systemKey.slice(-4)}`);
    if (!isValidOpenAIKeyFormat(systemKey)) {
      console.log('   ⚠️  Warning: System key format looks invalid');
    }
  } else {
    console.log('   ⚠️  No system key configured');
  }
  
  // Test 2: Check encryption secret
  console.log('\n2️⃣  Checking Encryption Secret...');
  const encryptionSecret = process.env.API_KEY_ENCRYPTION_SECRET;
  if (encryptionSecret) {
    console.log('   ✅ Encryption secret configured');
  } else {
    console.log('   ❌ API_KEY_ENCRYPTION_SECRET not configured');
    console.log('      User keys cannot be decrypted!');
  }
  
  // Test 3: Find users with API keys
  console.log('\n3️⃣  Checking User API Keys...');
  try {
    const usersWithKeys = await prisma.user.findMany({
      where: {
        openaiApiKey: {
          not: null
        }
      },
      select: {
        id: true,
        email: true,
        role: true,
        openaiApiKey: true
      }
    });
    
    if (usersWithKeys.length === 0) {
      console.log('   ℹ️  No users have configured API keys yet');
    } else {
      console.log(`   ✅ Found ${usersWithKeys.length} user(s) with API keys:`);
      
      for (const user of usersWithKeys) {
        console.log(`\n   User: ${user.email} (${user.role})`);
        
        try {
          const hasKey = await hasValidOpenAIKey(user.id);
          if (hasKey) {
            console.log('      ✅ Valid key format');
            
            // Try to decrypt and show last 4 chars
            try {
              const decryptedKey = await getUserOpenAIKey(user.id);
              if (decryptedKey) {
                console.log(`      ✅ Successfully decrypted: ****${decryptedKey.slice(-4)}`);
              }
            } catch (error: any) {
              console.log('      ❌ Decryption failed:', error.message);
            }
          } else {
            console.log('      ❌ Invalid key format');
          }
        } catch (error: any) {
          console.log('      ❌ Error checking key:', error.message);
        }
      }
    }
  } catch (error: any) {
    console.log('   ❌ Error querying database:', error.message);
  }
  
  // Test 4: Try to make an actual API call
  console.log('\n4️⃣  Testing Live API Call...');
  
  try {
    // Find a user to test with
    const testUser = await prisma.user.findFirst({
      where: {
        openaiApiKey: {
          not: null
        }
      }
    });
    
    const userId = testUser?.id || (await prisma.user.findFirst())?.id;
    
    if (!userId) {
      console.log('   ⚠️  No users found to test with');
    } else {
      const email = testUser?.email || 'system fallback';
      console.log(`   Testing with user: ${email}`);
      
      try {
        const openaiClient = await createUserOpenAI(userId);
        
        console.log('   📡 Making test API call to OpenAI...');
        const result = await generateText({
          model: openaiClient('gpt-3.5-turbo'),
          prompt: 'Say "API test successful" and nothing else.',
        });
        
        console.log(`   ✅ API call successful!`);
        console.log(`   Response: "${result.text}"`);
        console.log(`   Tokens used: ${result.usage?.totalTokens || 'unknown'}`);
        
      } catch (error: any) {
        console.log('   ❌ API call failed:', error.message);
        
        if (error.message?.includes('API key')) {
          console.log('      💡 Check that your API key is valid in OpenAI dashboard');
        }
        if (error.message?.includes('quota')) {
          console.log('      💡 You may have exceeded your OpenAI quota');
        }
      }
    }
  } catch (error: any) {
    console.log('   ❌ Test failed:', error.message);
  }
  
  // Test 5: Check model availability
  console.log('\n5️⃣  Checking Model Configuration...');
  const defaultModel = process.env.OPENAI_DEFAULT_MODEL;
  if (defaultModel) {
    console.log(`   ℹ️  Default model override: ${defaultModel}`);
  } else {
    console.log('   ℹ️  Using application defaults (gpt-4-turbo)');
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 SUMMARY');
  console.log('='.repeat(60));
  
  const checks = {
    'System API Key': !!systemKey,
    'Encryption Secret': !!encryptionSecret,
    'User Keys Found': (await prisma.user.count({ where: { openaiApiKey: { not: null } } })) > 0,
  };
  
  for (const [check, passed] of Object.entries(checks)) {
    console.log(`${passed ? '✅' : '❌'} ${check}`);
  }
  
  console.log('\n💡 RECOMMENDATIONS:');
  if (!systemKey) {
    console.log('   - Set OPENAI_API_KEY in .env for system fallback');
  }
  if (!encryptionSecret) {
    console.log('   - Set API_KEY_ENCRYPTION_SECRET in .env (required!)');
  }
  
  const userKeyCount = await prisma.user.count({ where: { openaiApiKey: { not: null } } });
  if (userKeyCount === 0) {
    console.log('   - Users should add their API keys in Settings');
  }
  
  console.log('\n✨ Configuration test complete!\n');
}

// Run the test
testOpenAIConfiguration()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
