/**
 * Script to add OpenAI API key to an admin user's account
 * Usage: npx tsx scripts/add-admin-api-key.ts <email> <api-key>
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

// Encryption configuration (must match route.ts)
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;

function getEncryptionKey(): Buffer {
  const key = process.env.API_KEY_ENCRYPTION_SECRET;
  if (!key) {
    throw new Error('API_KEY_ENCRYPTION_SECRET is not set in environment');
  }
  return crypto.pbkdf2Sync(key, 'salt', 100000, 32, 'sha256');
}

function encryptApiKey(text: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return iv.toString('hex') + authTag.toString('hex') + encrypted;
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length !== 2) {
    console.error('Usage: npx tsx scripts/add-admin-api-key.ts <admin-email> <api-key>');
    console.error('Example: npx tsx scripts/add-admin-api-key.ts admin@example.com sk-...');
    process.exit(1);
  }

  const [email, apiKey] = args;

  console.log('🔐 Adding API Key to Admin Account');
  console.log('===================================\n');

  // Validate API key format
  if (!apiKey || apiKey.length < 10) {
    console.error('❌ Error: API key must be at least 10 characters');
    process.exit(1);
  }

  if (!apiKey.startsWith('sk-')) {
    console.warn('⚠️  Warning: OpenAI API keys typically start with "sk-"');
  }

  try {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, role: true, name: true }
    });

    if (!user) {
      console.error(`❌ Error: User with email "${email}" not found`);
      process.exit(1);
    }

    // Check if user is admin
    if (!user.role || user.role === 'USER') {
      console.error(`❌ Error: User "${email}" is not an admin`);
      console.error(`   Current role: ${user.role || 'USER'}`);
      console.error('\n   To make this user an admin, run:');
      console.error(`   npx tsx scripts/create-admin.ts`);
      process.exit(1);
    }

    console.log(`✓ Found admin user: ${user.name || user.email}`);
    console.log(`  Role: ${user.role}\n`);

    // Encrypt the API key
    console.log('🔒 Encrypting API key...');
    const encryptedKey = encryptApiKey(apiKey);
    console.log('✓ API key encrypted\n');

    // Update user with encrypted key
    console.log('💾 Saving to database...');
    await prisma.user.update({
      where: { id: user.id },
      data: { openaiApiKey: encryptedKey } as any
    });

    console.log('✅ Success! API key has been added to the admin account\n');
    console.log('Next steps:');
    console.log('1. Restart your development server if running');
    console.log('2. Log in as the admin user');
    console.log('3. Go to Settings → API Keys tab');
    console.log('4. You should see the masked key (****...)\n');

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    if (error.code === 'P2022') {
      console.error('\n⚠️  Database migration required!');
      console.error('   Run: npx prisma migrate dev\n');
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
