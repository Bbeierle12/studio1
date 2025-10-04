# Vercel Production Deployment Guide

## Pre-Deployment Checklist

### Step 1: Update Prisma Schema for Production ✅

Before deploying, we need to switch back to PostgreSQL:

**File: `prisma/schema.prisma`**

Change:
```prisma
datasource db {
  provider = "sqlite"    // ❌ Remove this
  url      = env("DATABASE_URL")
}
```

To:
```prisma
datasource db {
  provider = "postgresql"  // ✅ Use this for production
  url      = env("DATABASE_URL")
}
```

### Step 2: Set Up Vercel Postgres Database

1. Go to your Vercel Dashboard: https://vercel.com/dashboard
2. Select your project (or import from GitHub if not connected)
3. Go to **Storage** tab
4. Click **Create Database** → **Postgres**
5. Choose a name (e.g., `family-recipes-db`)
6. Select a region (preferably same as your function region: `iad1`)
7. Click **Create**
8. Copy the connection string that appears

### Step 3: Configure Environment Variables in Vercel

Go to **Project Settings** → **Environment Variables** and add:

#### Required Variables:

**DATABASE_URL**
```
<paste-your-vercel-postgres-connection-string>
```

**NEXTAUTH_URL**
```
https://your-project-name.vercel.app
```
(Replace with your actual Vercel domain - you can update this after first deploy)

**NEXTAUTH_SECRET**
Generate a secure secret:
```bash
openssl rand -base64 32
```
Then paste the output as the value.

**OPENAI_API_KEY** (if using AI features)
```
<your-openai-api-key>
```

**Important:** Make sure to set these for **Production** environment!

### Step 4: Update Your Code for Production

Make sure these files are committed:

✅ `src/lib/auth.ts` - Using shared Prisma client
✅ `src/components/glassmorphism-login.tsx` - Using /api/register
✅ `next.config.ts` - No secret inlining
✅ `prisma/schema.prisma` - Set to postgresql (not sqlite!)

### Step 5: Deploy to Vercel

#### Option A: Deploy via GitHub (Recommended)

1. Commit and push your changes:
```bash
git add .
git commit -m "Fix authentication and prepare for production"
git push origin main
```

2. Vercel will automatically deploy when you push (if connected)

#### Option B: Deploy via Vercel CLI

1. Install Vercel CLI (if not installed):
```bash
npm i -g vercel
```

2. Login to Vercel:
```bash
vercel login
```

3. Deploy:
```bash
vercel --prod
```

### Step 6: Run Database Migrations on Vercel

After deploying, you need to set up the database. You have two options:

#### Option A: Use Vercel CLI
```bash
# Connect to your project
vercel link

# Set up env vars locally for migration
vercel env pull .env.production

# Run migrations
DATABASE_URL="<your-vercel-postgres-url>" npx prisma migrate deploy

# Seed the database
DATABASE_URL="<your-vercel-postgres-url>" npm run db:seed
```

#### Option B: Add Build Commands in Vercel

Go to **Project Settings** → **General** → **Build & Development Settings**

Add this to **Build Command**:
```bash
npx prisma generate && npx prisma migrate deploy && npm run build
```

Then add a separate script to seed (run once manually via Vercel CLI):
```bash
vercel env pull .env.production && npm run db:seed
```

### Step 7: Verify Deployment

1. Visit your deployed URL
2. Try to sign up with a new account
3. Try to log in with demo credentials:
   - Email: `demo@familyrecipes.com`
   - Password: `password123`
   - (Note: Demo users won't exist until you seed the production database)

## Post-Deployment

### Update NEXTAUTH_URL (if needed)
If you're using a custom domain, update the `NEXTAUTH_URL` environment variable in Vercel to match your custom domain.

### Monitor Logs
Check Vercel logs for any errors:
- Go to your project → **Deployments**
- Click on the latest deployment
- Check **Functions** logs

### Database Management

To view/edit your production database:
```bash
# Pull environment variables
vercel env pull .env.production

# Open Prisma Studio
npx prisma studio
```

## Common Issues & Solutions

### Issue: "Cannot create account" error persists

**Solution:** Make sure:
1. ✅ DATABASE_URL is correctly set in Vercel
2. ✅ Migrations have been run on production database
3. ✅ Prisma schema uses "postgresql" provider
4. ✅ NEXTAUTH_URL matches your deployed domain

### Issue: "Invalid credentials" when logging in

**Solution:** 
- Seed the production database with demo users
- Or create a new account via signup

### Issue: Environment variables not loading

**Solution:**
- Redeploy after adding environment variables
- Ensure variables are set for "Production" environment
- Check variable names match exactly (no typos)

## Quick Commands Reference

```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Seed database
npm run db:seed

# Deploy to Vercel
vercel --prod

# Pull production env vars
vercel env pull

# View production logs
vercel logs
```

---

## Your Current Status

- ✅ Local development working
- ✅ Code fixes applied
- ⏳ Ready to deploy to Vercel
- ⏳ Need to configure Vercel Postgres
- ⏳ Need to set environment variables
- ⏳ Need to run production migrations

**Next Action:** Follow Steps 1-7 above to deploy! 🚀
