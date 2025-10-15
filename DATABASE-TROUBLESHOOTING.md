# Database Tools - Troubleshooting Guide

## Error: "Failed to fetch database statistics"

### Common Causes & Solutions

---

## 1. Database Not Configured

**Error Message:**
```
Database not configured. Please set DATABASE_URL environment variable.
```

**Solution:**
1. Check if `.env.local` exists:
   ```powershell
   Test-Path .env.local
   ```

2. Verify DATABASE_URL is set:
   ```powershell
   Get-Content .env.local | Select-String "DATABASE_URL"
   ```

3. If missing, create `.env.local`:
   ```env
   DATABASE_URL="postgresql://user:password@host:5432/database?sslmode=require"
   ```

4. **Restart Next.js dev server** (environment variables only load on startup):
   ```powershell
   # Stop server (Ctrl+C)
   npm run dev
   ```

---

## 2. Database Connection Failed

**Error Message:**
```
Cannot connect to database. Please check DATABASE_URL.
Database connection failed. Please check your database is running.
```

**Possible Causes:**
- Database server is not running
- Incorrect connection string
- Network/firewall issues
- Database credentials are wrong

**Solutions:**

### A. Test Database Connection
```powershell
npx prisma db push
```
If this fails, your database isn't accessible.

### B. Check Database Provider
- **Neon/Supabase/PlanetScale:** Verify dashboard shows database is active
- **Local PostgreSQL:** Ensure PostgreSQL service is running
- **Railway/Render:** Check deployment status

### C. Verify Connection String Format
```
postgresql://username:password@host:port/database?options
```

Example (Neon):
```
postgresql://user:pass@ep-something.neon.tech/db?sslmode=require
```

---

## 3. Tables Don't Exist (Migrations Not Run)

**Error Message:**
```
Database table does not exist. Please run migrations.
```

**Solution:**
Run Prisma migrations to create tables:

```powershell
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Or push schema directly (dev only)
npx prisma db push
```

**Note:** If you've added the FeatureFlag model recently, you MUST run migrations:
```powershell
npx prisma migrate dev --name add_feature_flags
```

---

## 4. Next.js Server Not Running

**Error Message:**
```
Failed to fetch (network error)
```

**Solution:**
Start the development server:
```powershell
npm run dev
```

Visit: `http://localhost:3000/admin/database`

---

## 5. Authentication Issues

**Error Message:**
```
Unauthorized. Only Super Admins can view database statistics.
```

**Solution:**
1. Verify you're logged in as SUPER_ADMIN
2. Check user role in database:
   ```powershell
   npx prisma studio
   ```
   Navigate to User table and verify your role is `SUPER_ADMIN`

3. If role is wrong, update it in Prisma Studio or run:
   ```sql
   UPDATE "User" SET role = 'SUPER_ADMIN' WHERE email = 'your@email.com';
   ```

---

## 6. Prisma Client Not Generated

**Error Message:**
```
PrismaClient is unable to be run in the browser.
Cannot find module '@prisma/client'
```

**Solution:**
Generate Prisma Client:
```powershell
npx prisma generate
```

Then restart the dev server.

---

## Quick Diagnostic Checklist

Run these commands in order:

```powershell
# 1. Check environment
Get-Content .env.local | Select-String "DATABASE_URL"

# 2. Generate Prisma Client
npx prisma generate

# 3. Test database connection
npx prisma db push

# 4. Run migrations
npx prisma migrate dev

# 5. Restart Next.js
# Press Ctrl+C to stop
npm run dev
```

---

## Still Having Issues?

### Check Browser Console
1. Open DevTools (F12)
2. Go to Console tab
3. Look for error messages
4. Go to Network tab
5. Find the failed `/api/admin/database/stats` request
6. Check the response

### Check Server Logs
Look at your terminal where `npm run dev` is running:
- Red error messages?
- Database connection errors?
- Missing environment variables?

### Common Error Codes

| Code | Meaning | Fix |
|------|---------|-----|
| P1001 | Can't reach database | Check connection string, database is running |
| P1002 | Database timeout | Database overloaded or network slow |
| P1003 | Database doesn't exist | Create database or fix connection string |
| P2021 | Table doesn't exist | Run `npx prisma migrate dev` |
| P2025 | Record not found | Expected - some tables may be empty |

---

## Fresh Start (Nuclear Option)

If nothing works, reset everything:

```powershell
# 1. Stop dev server (Ctrl+C)

# 2. Delete node_modules and reinstall
Remove-Item -Recurse -Force node_modules
npm install

# 3. Generate Prisma Client
npx prisma generate

# 4. Reset database (WARNING: Deletes all data!)
npx prisma migrate reset

# 5. Restart server
npm run dev
```

---

## For Production Deployment

### Vercel/Netlify
1. Add DATABASE_URL to environment variables in dashboard
2. Redeploy

### Railway/Render
1. DATABASE_URL should auto-populate
2. Ensure PostgreSQL plugin is connected
3. Check build logs for migration errors

### Manual Deployment
1. Set DATABASE_URL on server
2. Run migrations:
   ```bash
   npx prisma migrate deploy
   ```
3. Restart application

---

## Need More Help?

1. Check Prisma docs: https://www.prisma.io/docs
2. Check Next.js docs: https://nextjs.org/docs
3. Verify your database provider's status page
4. Check if DATABASE_URL is actually accessible from your network

---

**Most Common Fix:** Restart the dev server after setting environment variables! 🔄
