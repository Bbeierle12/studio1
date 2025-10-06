# API Key Configuration - Troubleshooting Guide

## Error: "Failed to update API keys"

This error can occur for several reasons. Here's how to diagnose and fix it:

### 1. ✅ Encryption Secret Not Configured

**Symptom:** Error message: "API key storage is not configured. Please contact support."

**Fix:**
```bash
# Run the setup script
npx tsx scripts/setup-api-key-encryption.ts

# Or manually add to .env.local:
API_KEY_ENCRYPTION_SECRET=<64-character-hex-string>

# Generate a secret:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2. ✅ Database Migration Not Run

**Symptom:** Error message: "Database migration required. Please contact support."

**Fix:**
```bash
# For local development (SQLite)
npx prisma migrate dev --name add_openai_api_key

# For production (PostgreSQL)
npx prisma migrate deploy
```

### 3. ✅ Invalid API Key Format

**Symptom:** Error message: "Invalid API key format"

**Fix:**
- Ensure the API key is at least 10 characters
- OpenAI keys typically start with "sk-"
- Remove any extra spaces or line breaks
- Copy the key directly from OpenAI platform

### 4. ✅ Environment Variable Not Loaded

**Symptom:** Error occurs even after adding to .env.local

**Fix:**
```bash
# Restart your development server
# Stop current server (Ctrl+C)
npm run dev

# For production deployment
# Re-deploy after adding to Vercel environment variables
```

### 5. ✅ Database Connection Issues

**Symptom:** Generic "Internal server error"

**Fix:**
1. Check DATABASE_URL is set correctly
2. Verify database is running
3. Check database logs for connection errors
4. Ensure database user has write permissions

## Quick Diagnostic Checklist

Run through these steps:

```bash
# 1. Check if encryption secret exists
cat .env.local | grep API_KEY_ENCRYPTION_SECRET

# 2. Check database schema
npx prisma db pull

# 3. Verify Prisma client is up to date
npx prisma generate

# 4. Check for errors in console
# Open browser DevTools → Console tab

# 5. Check server logs
# Look at terminal running npm run dev
```

## Error Messages and Solutions

| Error Message | Cause | Solution |
|--------------|-------|----------|
| "API key storage is not configured" | Missing `API_KEY_ENCRYPTION_SECRET` | Run setup script |
| "Database migration required" | Column doesn't exist in DB | Run migration |
| "Invalid API key format" | Key is too short or invalid | Check key format |
| "Unauthorized" | Not logged in | Log in first |
| "User not found" | Session issue | Log out and log back in |
| "Failed to encrypt API key" | Encryption error | Check secret format |

## Manual Verification Steps

### 1. Test API Endpoint Directly

```bash
# Login first, then get session cookie from browser DevTools
# Replace YOUR_SESSION_TOKEN with actual value

# Test GET
curl http://localhost:3000/api/user/api-keys \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN"

# Test PATCH
curl -X PATCH http://localhost:3000/api/user/api-keys \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"openaiApiKey":"sk-test123"}'
```

### 2. Check Database

```bash
# Open Prisma Studio
npx prisma studio

# Or use SQL directly
npx prisma db execute --stdin < check.sql
```

```sql
-- check.sql
SELECT id, email, 
  CASE 
    WHEN "openaiApiKey" IS NULL THEN 'No key'
    ELSE 'Key exists (length: ' || LENGTH("openaiApiKey") || ')'
  END as key_status
FROM "User";
```

### 3. Check Browser Console

1. Open Settings page
2. Open DevTools (F12)
3. Go to Console tab
4. Try saving an API key
5. Look for error messages

### 4. Check Server Logs

Look for these messages:
- ✅ "API_KEY_ENCRYPTION_SECRET is not configured"
- ✅ "Encryption error:"
- ✅ "Database error:"
- ✅ "Error updating API keys:"

## Development Environment Setup

Complete setup steps:

```bash
# 1. Install dependencies
npm install

# 2. Setup encryption secret
npx tsx scripts/setup-api-key-encryption.ts

# 3. Run migration (if using local SQLite)
# Skip if using Vercel Postgres in development
# npx prisma migrate dev

# 4. Generate Prisma client
npx prisma generate

# 5. Start dev server
npm run dev

# 6. Test the feature
# Navigate to http://localhost:3000/settings
# Click "API Keys" tab
# Enter a test key
# Click "Save API Keys"
```

## Production Deployment

For Vercel:

```bash
# 1. Generate secret locally
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# 2. Add to Vercel
# Go to: Project Settings → Environment Variables
# Name: API_KEY_ENCRYPTION_SECRET
# Value: <generated-secret>
# Environments: Production, Preview, Development

# 3. Deploy
git push origin main

# 4. Run migration (in Vercel dashboard or CLI)
npx prisma migrate deploy
```

## Common Mistakes

### ❌ Mistake 1: Forgetting to Restart Server
After adding environment variables, you MUST restart the dev server.

### ❌ Mistake 2: Wrong Environment File
Make sure it's `.env.local`, not `.env` or `.env.development`

### ❌ Mistake 3: Not Running Migration
The database column must exist before you can save keys.

### ❌ Mistake 4: Committing Secrets
Never commit `.env.local` to Git. It should be in `.gitignore`.

### ❌ Mistake 5: Using Different Secrets
Development and production should use different secrets.

## Still Having Issues?

1. **Check the implementation:**
   - Review `src/app/api/user/api-keys/route.ts`
   - Check browser Network tab for API responses
   - Look at full error stack traces

2. **Reset and try again:**
   ```bash
   # Clear everything and start fresh
   rm -rf node_modules .next
   npm install
   npx prisma generate
   npm run dev
   ```

3. **Check documentation:**
   - `docs/API-KEY-MIGRATION.md` - Full setup guide
   - `docs/API-KEY-SUMMARY.md` - Implementation overview

4. **Get help:**
   - Check application logs
   - Review browser console errors
   - Inspect network requests
   - Verify all steps were completed

## Success Indicators

You know it's working when:
- ✅ No errors in console
- ✅ Success toast appears
- ✅ Key shows as masked after reload (****xyz4)
- ✅ No error logs in server terminal
- ✅ Database shows encrypted value (not plain text)

## Security Reminders

- 🔒 Keep `API_KEY_ENCRYPTION_SECRET` secure
- 🔒 Use different secrets for dev/prod
- 🔒 Never commit secrets to Git
- 🔒 Rotate secrets periodically
- 🔒 Monitor API usage in OpenAI dashboard
