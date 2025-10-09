# OpenAI API Key Security Guide

## 🔒 Security Measures Implemented

### 1. **Environment Variable Protection** ✅
- API key stored in `.env.local`
- File excluded from Git via `.gitignore` (`.env*`)
- Never committed to repository
- Not accessible from client-side code

### 2. **Authentication Required** ✅
- All AI endpoints require user authentication
- Uses NextAuth session validation
- Prevents anonymous abuse

### 3. **Rate Limiting** ✅ NEW
- **Voice/Cooking Assistant**: 20 requests per minute per user
- **Recipe Generation**: 5 requests per 5 minutes per user
- Prevents API key abuse and excessive costs
- Based on user ID (or IP for anonymous)

### 4. **Input Validation** ✅
- Questions limited to 500 characters
- Schema validation with Zod
- Prevents excessive token usage

### 5. **Server-Side Only** ✅
- API key only used in backend `/api` routes
- Never exposed to browser/client
- Not included in client bundle

### 6. **Error Handling** ✅
- Retry logic with exponential backoff
- Rate limit detection (429 errors)
- Invalid key detection (401/403 errors)
- Graceful fallback responses

### 7. **Encrypted Storage** ✅
- User-specific keys encrypted with AES-256-GCM
- Uses `API_KEY_ENCRYPTION_SECRET` for encryption
- Industry-standard encryption

---

## 💰 Cost Control Recommendations

### Set OpenAI Usage Limits:
1. Go to https://platform.openai.com/account/billing/limits
2. Set **Hard Limit** (e.g., $10/month)
3. Set **Soft Limit** for email alerts (e.g., $5/month)

### Estimate Costs:
- **GPT-4 Turbo**: ~$0.01 per 1,000 input tokens, ~$0.03 per 1,000 output tokens
- Average voice question: ~100 tokens input, ~150 tokens output
- **Cost per question**: ~$0.0055 (about half a cent)
- **20 requests/minute**: ~$0.11/minute if maxed out
- **Realistic usage**: ~$1-5/month for small user base

---

## 🛡️ Additional Recommendations

### 1. Monitor Usage
Check your OpenAI dashboard regularly:
- https://platform.openai.com/usage

### 2. Production Environment
When deploying to Vercel/production:
```bash
# Add to Vercel environment variables:
OPENAI_API_KEY=sk-proj-your-key
API_KEY_ENCRYPTION_SECRET=your-secret

# Use Vercel's encrypted secrets feature
vercel env add OPENAI_API_KEY production
```

### 3. Rotate Keys Regularly
- Generate new API keys quarterly
- Revoke old keys after rotation
- Update `.env.local` with new key

### 4. Enable Logging (Optional)
Implement usage tracking in `openai-utils.ts`:
```typescript
await prisma.openAIUsage.create({
  data: {
    userId,
    model,
    inputTokens,
    outputTokens,
    cost,
    endpoint: 'cooking-assistant'
  }
});
```

### 5. IP-Based Rate Limiting (Production)
For production, consider:
- Redis for distributed rate limiting
- CloudFlare for DDoS protection
- Vercel rate limiting middleware

---

## 🚨 What to Do If Key is Compromised

If you accidentally expose your API key:

### Immediate Actions:
1. **Revoke the key**: https://platform.openai.com/api-keys
2. **Generate new key**
3. **Update `.env.local`**
4. **Restart server**
5. **Check billing for unexpected usage**

### Prevention:
- ✅ Never log API keys
- ✅ Never commit `.env.local`
- ✅ Don't share screenshots with keys visible
- ✅ Use environment variables, not hardcoded values

---

## ✅ Current Security Status

| Security Measure | Status | Notes |
|-----------------|--------|-------|
| `.gitignore` Protection | ✅ Active | `.env*` excluded |
| Authentication Required | ✅ Active | NextAuth sessions |
| Rate Limiting | ✅ Active | 20/min per user |
| Input Validation | ✅ Active | 500 char limit |
| Server-Side Only | ✅ Active | Never exposed to client |
| Error Handling | ✅ Active | Retry + fallback |
| Encrypted Storage | ✅ Active | AES-256-GCM |
| Usage Monitoring | ⚠️ Manual | Check OpenAI dashboard |
| Spending Limits | ⚠️ Manual | Set in OpenAI account |
| Key Rotation | ⚠️ Manual | Quarterly recommended |

---

## 📝 Quick Reference

### Check if key is loaded:
```powershell
node -e "require('dotenv').config({ path: '.env.local' }); console.log('Key loaded:', !!process.env.OPENAI_API_KEY);"
```

### Test rate limiting:
Make 21 requests within 1 minute - the 21st should be blocked.

### View current rate limits:
- Voice Assistant: 20/min
- Recipe Generation: 5/5min  
- General API: 100/min

### Update rate limits:
Edit `src/lib/rate-limit.ts` and adjust `RATE_LIMITS` object.

---

## 🎯 Summary

Your OpenAI API key is now protected by:
1. Git exclusion (not committed)
2. Server-side only usage
3. Authentication requirement
4. Rate limiting (NEW)
5. Input validation
6. Error handling
7. Encryption for user keys

**Next steps:**
1. ✅ Set spending limits in OpenAI dashboard
2. ✅ Monitor usage weekly
3. ✅ Rotate key quarterly
4. ✅ Restart your dev server to activate rate limiting

**You're secure!** 🔒✨
