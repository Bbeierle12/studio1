# API Key Configuration Migration Guide

## Overview
This migration adds API key storage functionality to the settings page, allowing users to securely store their OpenAI API keys for AI-powered features.

## Changes Made

### 1. Database Schema Update
- Added `openaiApiKey` field to the `User` model in `prisma/schema.prisma`
- Field is optional (nullable) and stores encrypted API keys

### 2. New API Endpoint
Created `/api/user/api-keys` endpoint with:
- **GET**: Retrieve masked API keys (shows only last 4 characters)
- **PATCH**: Update API keys (encrypts before storage)

### 3. Settings Page Enhancement
- Added new "API Keys" tab in settings
- Secure input field with show/hide toggle
- Encryption notice and security information
- Link to OpenAI platform for key generation

### 4. Security Features
- **AES-256-GCM encryption** for API key storage
- **Environment-based encryption key** (API_KEY_ENCRYPTION_SECRET)
- **Masked display** of existing keys (****XXXX format)
- **Per-user isolation** - keys only accessible to their owner

## Deployment Steps

### Step 1: Set Environment Variable
Add the encryption secret to your environment (Vercel, .env.local, etc.):

```bash
API_KEY_ENCRYPTION_SECRET=<generate-a-secure-random-string-at-least-32-chars>
```

To generate a secure secret:
```bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Or using OpenSSL
openssl rand -hex 32
```

### Step 2: Run Database Migration
The migration has been created at:
`prisma/migrations/20251005000000_add_openai_api_key/migration.sql`

**For Vercel Postgres:**
```bash
# Option 1: Using Prisma CLI (if DATABASE_URL is set)
npx prisma migrate deploy

# Option 2: Manual SQL execution in Vercel Dashboard
# Copy the SQL from the migration file and run it in the Vercel Postgres SQL editor
```

**For local development:**
```bash
npx prisma migrate dev
```

### Step 3: Generate Prisma Client
```bash
npx prisma generate
```

### Step 4: Build and Deploy
```bash
npm run build
# Deploy to your hosting platform (Vercel, etc.)
```

## Testing

### 1. Access Settings Page
- Log in to your account
- Navigate to Settings
- Click on the "API Keys" tab

### 2. Add API Key
- Enter a test OpenAI API key (or use format: sk-test...)
- Click "Save API Keys"
- Verify success message appears

### 3. Verify Encryption
- Refresh the page
- Check that the key is displayed masked (e.g., ****key4)

### 4. Test API Key Retrieval
```bash
# Using curl (replace with your session cookie)
curl -X GET http://localhost:3000/api/user/api-keys \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN"
```

### 5. Verify Database
```sql
-- Check that the key is encrypted in the database
SELECT id, email, openaiApiKey FROM "User" WHERE openaiApiKey IS NOT NULL;
-- The openaiApiKey should be a long encrypted string, not the raw key
```

## Security Considerations

### ✅ What's Secure
- API keys are encrypted using AES-256-GCM before storage
- Encryption key is stored in environment variables, not in code
- Keys are masked in the UI (only last 4 chars visible)
- Keys are only accessible to the authenticated user
- HTTPS encryption in transit

### ⚠️ Important Notes
1. **Never commit** `API_KEY_ENCRYPTION_SECRET` to version control
2. **Use different secrets** for development and production
3. **Rotate encryption secrets** periodically (requires re-encryption of existing keys)
4. **Monitor API key usage** through OpenAI dashboard
5. Users should **revoke compromised keys** immediately from OpenAI platform

## Rollback Plan

If issues occur, you can rollback:

### 1. Rollback Database
```sql
ALTER TABLE "User" DROP COLUMN "openaiApiKey";
```

### 2. Rollback Code
```bash
git revert <commit-hash>
```

### 3. Remove Environment Variable
Remove `API_KEY_ENCRYPTION_SECRET` from your environment

## Future Enhancements

Potential improvements for the API key system:
1. Support for multiple AI providers (Anthropic, Google, etc.)
2. API key validation before storage
3. Usage tracking and limits
4. Key rotation reminders
5. Backup encryption key system
6. Admin key management interface

## Support

If users encounter issues:
1. Check browser console for errors
2. Verify `API_KEY_ENCRYPTION_SECRET` is set
3. Confirm database migration completed successfully
4. Check application logs for encryption errors
5. Test with a fresh API key from OpenAI

## Files Modified

### New Files:
- `src/app/api/user/api-keys/route.ts` - API endpoint
- `prisma/migrations/20251005000000_add_openai_api_key/migration.sql` - Migration
- `docs/API-KEY-MIGRATION.md` - This file

### Modified Files:
- `src/app/settings/page.tsx` - Added API Keys tab
- `prisma/schema.prisma` - Added openaiApiKey field

## Environment Variables Required

```bash
# Existing
DATABASE_URL=<your-database-url>
NEXTAUTH_SECRET=<your-nextauth-secret>
NEXTAUTH_URL=<your-app-url>

# New - Required for API key encryption
API_KEY_ENCRYPTION_SECRET=<your-encryption-secret>
```

## Monitoring

After deployment, monitor for:
- Successful key saves (check application logs)
- Encryption/decryption errors
- User feedback on the feature
- OpenAI API usage patterns
