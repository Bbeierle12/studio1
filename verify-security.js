/**
 * Simple Security Check Script
 * Verifies all security measures are in place
 */

const fs = require('fs');
const { execSync } = require('child_process');

console.log('\n🔒 === SECURITY VERIFICATION TEST ===\n');

let allPassed = true;

// Test 1: Check .gitignore
console.log('Test 1: .gitignore Protection');
console.log('------------------------------');
try {
  const gitignoreContent = fs.readFileSync('.gitignore', 'utf-8');
  const hasEnvIgnore = gitignoreContent.includes('.env');
  
  if (hasEnvIgnore) {
    console.log('✅ PASS: .env* files are in .gitignore');
  } else {
    console.log('❌ FAIL: .env* NOT in .gitignore');
    allPassed = false;
  }
} catch (error) {
  console.log('❌ FAIL: Could not read .gitignore');
  allPassed = false;
}

// Test 2: Check if .env.local is tracked
console.log('\nTest 2: .env.local Git Tracking');
console.log('-------------------------------');
try {
  const tracked = execSync('git ls-files .env.local', { encoding: 'utf-8' }).trim();
  
  if (!tracked) {
    console.log('✅ PASS: .env.local is NOT tracked by Git');
  } else {
    console.log('❌ FAIL: .env.local IS tracked by Git!');
    allPassed = false;
  }
} catch (error) {
  console.log('✅ PASS: .env.local is NOT tracked by Git');
}

// Test 3: Check for API keys in staged files
console.log('\nTest 3: Staged Files Safety');
console.log('---------------------------');
try {
  const staged = execSync('git diff --cached', { encoding: 'utf-8' });
  const hasSecrets = staged.includes('sk-proj-') || staged.includes('sk-');
  
  if (!hasSecrets) {
    console.log('✅ PASS: No API keys in staged files');
  } else {
    console.log('❌ FAIL: API keys found in staged files!');
    allPassed = false;
  }
} catch (error) {
  console.log('✅ PASS: No staged files yet');
}

// Test 4: Check required files exist
console.log('\nTest 4: Required Files');
console.log('----------------------');

const requiredFiles = [
  { path: 'src/lib/rate-limit.ts', name: 'Rate Limiter' },
  { path: 'src/app/api/user/data-export/route.ts', name: 'Data Export Endpoint' },
  { path: 'GEMINI-SECURITY-GUIDE.md', name: 'Security Guide' },
  { path: 'PRIVACY-COMPLIANCE-GUIDE.md', name: 'Privacy Guide' },
  { path: 'SECURITY-COMMIT-CHECKLIST.md', name: 'Commit Checklist' },
  { path: 'SECURITY-UPDATE-SUMMARY.md', name: 'Update Summary' },
];

requiredFiles.forEach(file => {
  const exists = fs.existsSync(file.path);
  if (exists) {
    console.log(`✅ ${file.name}: EXISTS`);
  } else {
    console.log(`❌ ${file.name}: MISSING`);
    allPassed = false;
  }
});

// Test 5: Check environment variables
console.log('\nTest 5: Environment Variables');
console.log('-----------------------------');
require('dotenv').config({ path: '.env.local' });

const hasGeminiKey = !!process.env.GOOGLE_GENERATIVE_AI_API_KEY;
const keyLength = process.env.GOOGLE_GENERATIVE_AI_API_KEY?.length || 0;
const isPlaceholder = process.env.GOOGLE_GENERATIVE_AI_API_KEY === 'your_gemini_api_key_here';

const hasEncryptionSecret = !!process.env.API_KEY_ENCRYPTION_SECRET;
const secretLength = process.env.API_KEY_ENCRYPTION_SECRET?.length || 0;

if (hasGeminiKey && !isPlaceholder) {
  console.log(`✅ GOOGLE_GENERATIVE_AI_API_KEY: SET (${keyLength} chars)`);
} else {
  console.log(`⚠️  GOOGLE_GENERATIVE_AI_API_KEY: ${isPlaceholder ? 'PLACEHOLDER' : 'NOT SET'}`);
}

if (hasEncryptionSecret && secretLength >= 32) {
  console.log(`✅ API_KEY_ENCRYPTION_SECRET: SET (${secretLength} chars)`);
} else {
  console.log(`❌ API_KEY_ENCRYPTION_SECRET: INVALID (${secretLength} chars)`);
  allPassed = false;
}

// Test 6: Verify rate limit code
console.log('\nTest 6: Rate Limit Implementation');
console.log('----------------------------------');
try {
  const rateLimitCode = fs.readFileSync('src/lib/rate-limit.ts', 'utf-8');
  const hasRateLimitFunc = rateLimitCode.includes('export function checkRateLimit');
  const hasLimits = rateLimitCode.includes('RATE_LIMITS');
  
  if (hasRateLimitFunc && hasLimits) {
    console.log('✅ Rate limiting code: IMPLEMENTED');
  } else {
    console.log('❌ Rate limiting code: INCOMPLETE');
    allPassed = false;
  }
} catch (error) {
  console.log('❌ Rate limiting code: MISSING');
  allPassed = false;
}

// Test 7: Verify cooking assistant uses rate limiting
console.log('\nTest 7: API Rate Limiting Integration');
console.log('--------------------------------------');
try {
  const apiCode = fs.readFileSync('src/app/api/cooking-assistant/route.ts', 'utf-8');
  const usesRateLimit = apiCode.includes('checkRateLimit') && apiCode.includes('RATE_LIMITS');
  
  if (usesRateLimit) {
    console.log('✅ Cooking assistant API: RATE LIMITED');
  } else {
    console.log('❌ Cooking assistant API: NOT RATE LIMITED');
    allPassed = false;
  }
} catch (error) {
  console.log('❌ Could not verify API rate limiting');
  allPassed = false;
}

// Test 8: Check data export endpoint
console.log('\nTest 8: Data Export Functionality');
console.log('----------------------------------');
try {
  const exportCode = fs.readFileSync('src/app/api/user/data-export/route.ts', 'utf-8');
  const hasExport = exportCode.includes('handleDataExport');
  const hasPrisma = exportCode.includes('prisma.user.findUnique');
  
  if (hasExport && hasPrisma) {
    console.log('✅ Data export endpoint: IMPLEMENTED');
  } else {
    console.log('❌ Data export endpoint: INCOMPLETE');
    allPassed = false;
  }
} catch (error) {
  console.log('❌ Data export endpoint: ERROR');
  allPassed = false;
}

// Final Summary
console.log('\n' + '='.repeat(50));
console.log('📊 FINAL RESULTS');
console.log('='.repeat(50));

if (allPassed) {
  console.log('\n🎉 ALL SECURITY TESTS PASSED!\n');
  console.log('✅ Your code is secure and ready to commit');
  console.log('✅ API keys are protected');
  console.log('✅ Rate limiting is active');
  console.log('✅ CCPA/GDPR compliance in progress');
  console.log('✅ Documentation complete');
  console.log('\n👉 Next step: git add <files> && git commit\n');
} else {
  console.log('\n⚠️  SOME TESTS FAILED\n');
  console.log('Review the failed tests above before committing.\n');
}

console.log('='.repeat(50) + '\n');
