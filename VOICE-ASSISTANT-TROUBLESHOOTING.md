# Voice Assistant Troubleshooting Guide

## Problem: Voice Assistant Giving Pre-programmed Responses

Your voice assistant is returning fallback responses instead of using OpenAI's GPT-4 to generate intelligent answers.

## ✅ What We've Verified

1. **OpenAI API Key is Valid** ✅
   - Your key starts with `sk-proj-4S...`
   - Key length: 164 characters
   - Has access to 96 models including GPT-4 and GPT-4-Turbo
   - Key works when tested directly with OpenAI API

2. **Code Changes Made** ✅
   - Added better error logging to API endpoint
   - Added fallback detection in voice assistant
   - Created diagnostic endpoint

## 🔍 Next Steps to Fix

### Step 1: Restart Your Development Server

**This is the most common issue!** Environment variables are only loaded when the server starts.

```powershell
# Stop the current dev server (Ctrl+C)
# Then restart it:
npm run dev
```

### Step 2: Test the OpenAI Integration

Once your dev server is running, open your browser and navigate to:

```
http://localhost:9002/api/test-openai
```

This will show you detailed diagnostic information about:
- Whether the API key is being read
- Whether the OpenAI client can be created
- Whether a test API call succeeds

### Step 3: Check Browser Console

1. Open your app in the browser
2. Open Developer Tools (F12)
3. Go to the Console tab
4. Try using the voice assistant
5. Look for these messages:

**If working correctly:**
```
🔑 Creating OpenAI client for user: [user-id]
🤖 Using model: gpt-4-turbo
✅ OpenAI response received successfully
```

**If using fallbacks:**
```
⚠️ Voice Assistant: Received fallback response
```

**If there are errors:**
```
❌ OpenAI API error: [error details]
```

### Step 4: Check Server Terminal

Look at your terminal where the dev server is running. You should see log messages when the voice assistant makes API calls:

```
🔑 Creating OpenAI client for user: ...
🤖 Using model: gpt-4-turbo
✅ OpenAI response received successfully
```

If you see errors there, they will tell you exactly what's wrong.

## 🐛 Common Issues & Solutions

### Issue 1: Server Not Restarted After .env.local Changes
**Solution:** Always restart `npm run dev` after modifying `.env.local`

### Issue 2: Wrong Environment File
**Solution:** Make sure it's `.env.local` not `.env` (Next.js prioritizes `.env.local`)

### Issue 3: API Key Has Spaces or Line Breaks
**Solution:** Ensure the key is on one line:
```bash
OPENAI_API_KEY=sk-proj-your-key-here-no-spaces
```

### Issue 4: User Has Personal API Key That's Invalid
**Solution:** 
1. Go to Settings in the app
2. Clear your personal API key if you set one
3. The app will fall back to the system key (which works)

### Issue 5: Rate Limiting
**Solution:** Check your OpenAI usage at https://platform.openai.com/usage

## 📊 What to Look For

### In Browser Console:
- ⚠️ Warning messages about fallback responses
- ❌ Error messages with details
- Console logs from the voice assistant

### In Server Terminal:
- 🔑 "Creating OpenAI client" messages
- ✅ "OpenAI response received successfully" messages
- ❌ Any error stack traces

## 🎯 Quick Test Commands

Test a simple voice command like:
- "How do I dice an onion?"
- "What temperature should chicken be cooked to?"
- "Can I substitute butter with oil?"

These should trigger OpenAI API calls and return intelligent, contextual responses (not pre-programmed fallbacks).

## 📝 Expected Behavior

**With AI Working:**
- Responses are contextual and varied
- Answers are detailed and helpful
- Each response is unique based on your question

**With Fallbacks (Not Working):**
- Responses are generic
- Same responses for similar questions
- Limited information

## 🔧 Advanced Debugging

If the basic steps don't work, check:

1. **Database Connection**: Make sure your DATABASE_URL is working
2. **NextAuth Session**: Make sure you're logged in
3. **API Route Errors**: Check `src/app/api/cooking-assistant/route.ts` logs
4. **Network Tab**: In DevTools, check the `/api/cooking-assistant` requests

## 📞 Need Help?

If you've tried all these steps and it's still not working, provide:
1. Screenshot of browser console errors
2. Server terminal output when using voice assistant
3. Output from http://localhost:9002/api/test-openai
4. Any error messages you see

---

**Most Likely Fix:** Just restart your dev server! 🔄
