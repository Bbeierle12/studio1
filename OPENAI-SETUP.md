# Quick Setup Guide for OpenAI Integration

## ⚠️ Required Configuration

Before using the OpenAI features, you need to set up the following environment variables:

### 1. Create/Update `.env` file

In your project root (`c:\Users\Bbeie\Github\studio1\`), create or update `.env`:

```bash
# Database (Required for all features)
DATABASE_URL="your-postgresql-connection-string"

# OpenAI System Key (Fallback when users don't have their own)
OPENAI_API_KEY="sk-your-openai-api-key-here"

# Encryption Secret (Required to encrypt/decrypt user API keys)
API_KEY_ENCRYPTION_SECRET="your-secure-random-string-here"

# Optional: Override default model
# OPENAI_DEFAULT_MODEL="gpt-3.5-turbo"
```

---

## 🔑 Getting Your OpenAI API Key

1. Go to https://platform.openai.com
2. Sign in or create an account
3. Navigate to API Keys section
4. Click "Create new secret key"
5. Copy the key (starts with `sk-`)
6. Add to your `.env` file

---

## 🔐 Generating Encryption Secret

Run this command to generate a secure random string:

### PowerShell:
```powershell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})
```

### Or use Node:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output and use it as `API_KEY_ENCRYPTION_SECRET`.

---

## 📝 Example `.env` File

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/mydb"

# NextAuth
NEXTAUTH_URL="http://localhost:9002"
NEXTAUTH_SECRET="your-nextauth-secret-here"

# OpenAI
OPENAI_API_KEY="sk-proj-abc123..."
API_KEY_ENCRYPTION_SECRET="a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"

# Optional
OPENAI_DEFAULT_MODEL="gpt-4-turbo"
```

---

## ✅ Verify Configuration

After setting up your `.env`:

```bash
# Test the configuration
npm run test:openai
```

Expected output:
```
✅ System API Key
✅ Encryption Secret
✅ Database connection
✅ API call successful
```

---

## 🚀 Start Development Server

```bash
npm run dev
```

Your app will be available at http://localhost:9002

---

## 👤 Add Your Personal OpenAI Key (Optional)

Once the app is running:

1. Go to http://localhost:9002/settings
2. Scroll to "API Configuration"
3. Enter your personal OpenAI API key
4. Click Save

Your personal key will be encrypted and stored in the database.

---

## 🔍 Current Status

Based on the test output:

| Check | Status |
|-------|--------|
| DATABASE_URL | ❌ Not configured |
| OPENAI_API_KEY | ❌ Not configured |
| API_KEY_ENCRYPTION_SECRET | ❌ Not configured |

**Action Required:** Add all three to your `.env` file.

---

## 💡 Security Tips

1. **Never commit `.env` to git** - It's already in `.gitignore`
2. **Use different keys** for dev/staging/production
3. **Rotate secrets periodically**
4. **Keep backups** of your encryption secret (can't decrypt without it!)
5. **Set billing limits** in OpenAI dashboard

---

## 🆘 Troubleshooting

### "Environment variable not found"
- Make sure `.env` file is in project root
- Restart your terminal/dev server after adding variables
- Check for typos in variable names

### "Invalid API key"
- Verify key starts with `sk-`
- Check key isn't revoked in OpenAI dashboard
- Try generating a new key

### "Cannot decrypt user keys"
- Ensure `API_KEY_ENCRYPTION_SECRET` is set
- If you change the secret, existing keys will be invalid
- Users will need to re-enter their keys

---

## 📞 Need Help?

1. Check `docs/OPENAI-API-GUIDE.md` for detailed documentation
2. Run `npm run test:openai` to diagnose issues
3. Check `docs/API-ASSESSMENT-COMPLETE.md` for full system overview

---

**Next Step:** Configure your `.env` file and run `npm run test:openai` again!
