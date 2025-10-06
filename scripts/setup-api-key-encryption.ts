/**
 * Script to generate and set up the API_KEY_ENCRYPTION_SECRET
 * Run this before using the API key storage feature
 */

import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

function generateEncryptionSecret(): string {
  return crypto.randomBytes(32).toString('hex');
}

function main() {
  console.log('🔐 API Key Encryption Setup');
  console.log('============================\n');

  // Generate a secure random secret
  const secret = generateEncryptionSecret();

  console.log('Generated encryption secret (64 characters):');
  console.log('---');
  console.log(secret);
  console.log('---\n');

  // Check if .env.local exists
  const envPath = path.join(process.cwd(), '.env.local');
  const envExists = fs.existsSync(envPath);

  if (envExists) {
    console.log('📄 Found .env.local file');
    
    // Read existing content
    const envContent = fs.readFileSync(envPath, 'utf-8');
    
    // Check if API_KEY_ENCRYPTION_SECRET already exists
    if (envContent.includes('API_KEY_ENCRYPTION_SECRET')) {
      console.log('⚠️  API_KEY_ENCRYPTION_SECRET already exists in .env.local');
      console.log('   If you want to rotate the secret, manually replace it with the one above.');
      console.log('   WARNING: Rotating the secret will make existing encrypted keys unreadable!\n');
    } else {
      // Append to .env.local
      const newLine = envContent.endsWith('\n') ? '' : '\n';
      fs.appendFileSync(
        envPath,
        `${newLine}\n# API Key Encryption Secret (for storing user API keys)\nAPI_KEY_ENCRYPTION_SECRET=${secret}\n`
      );
      console.log('✅ Added API_KEY_ENCRYPTION_SECRET to .env.local\n');
    }
  } else {
    console.log('📝 Creating .env.local file...');
    const envContent = `# API Key Encryption Secret (for storing user API keys)
API_KEY_ENCRYPTION_SECRET=${secret}
`;
    fs.writeFileSync(envPath, envContent);
    console.log('✅ Created .env.local with API_KEY_ENCRYPTION_SECRET\n');
  }

  console.log('Next steps:');
  console.log('1. ✅ Encryption secret configured');
  console.log('2. 📊 Run database migration: npx prisma migrate dev');
  console.log('3. 🔄 Restart your development server');
  console.log('4. 🎉 API key storage is ready to use!\n');

  console.log('For production deployment:');
  console.log('1. Add the secret to your Vercel environment variables');
  console.log('2. Run: npx prisma migrate deploy');
  console.log('3. Deploy your application\n');

  console.log('⚠️  IMPORTANT: Keep this secret secure and never commit it to version control!');
}

main();
