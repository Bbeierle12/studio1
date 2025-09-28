# Production Deployment Setup Guide

## ✅ Completed Steps
1. **Environment Variables Set**:
   - ✅ NEXTAUTH_SECRET: `u1pLd+/1cr7KFsJKaii5mOR7VJe46OrImHXDPwg+hyk=`
   - ✅ NEXTAUTH_URL: `https://craic-and-kuche.vercel.app`
   - ✅ OPENAI_API_KEY: `sk-proj-7v8oh...` (configured)
   - ⚠️ DATABASE_URL: Currently set to local SQLite, needs PostgreSQL

## 🔄 Next Steps

### 1. Create PostgreSQL Database
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Navigate to your `studio1` project
3. Click on the **Storage** tab
4. Click **"Create Database"**
5. Select **"Postgres"**
6. Choose a region (e.g., `us-east-1` for fastest performance)
7. After creation, copy the `DATABASE_URL` connection string

### 2. Update DATABASE_URL
Replace the current DATABASE_URL with your PostgreSQL connection string:
```bash
npx vercel env add DATABASE_URL
# Paste your PostgreSQL connection string when prompted
# Select "Production" environment
```

### 3. Deploy Database Schema
Once you have PostgreSQL set up, run these commands:

```bash
# Generate Prisma client for PostgreSQL
npx prisma generate

# Deploy the schema to production database
npx prisma db push

# Optional: Seed the database with initial data
npm run db:seed
```

### 4. Redeploy to Production
After database setup:
```bash
npx vercel --prod
```

## 🎯 Current Status
- ✅ Application successfully deployed to Vercel
- ✅ Environment variables configured
- ⏳ Waiting for PostgreSQL database setup
- ⏳ Database migration pending

## 🔗 Production URLs
- **App**: https://studio1-o13pzbt2o-bbeierle12s-projects.vercel.app
- **Inspect**: https://vercel.com/bbeierle12s-projects/studio1/8cuDVvMWUxjyjxQnkfCQeFzRdsWX

## 📝 Notes
- Current deployment uses SQLite which won't work in production
- All other features (authentication, AI assistant, recipes) should work once database is set up
- No code changes needed - just database configuration