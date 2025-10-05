# Deploying Admin System to Production (craicnkuche.com)

## Current Situation
- ✅ Admin system works locally (localhost:9002)
- ❌ Admin credentials don't work on craicnkuche.com
- **Reason**: Database migration and admin account only exist in local dev.db

## Production Deployment Steps

### Step 1: Check Your Production Database

First, identify what database your production site uses:

```bash
# Check your deployment platform
# Vercel, Firebase, or other hosting?
```

Look for:
- Database provider (PostgreSQL, MySQL, etc.)
- Connection string
- Admin access

### Step 2: Get Production Database Credentials

#### If using Vercel/PostgreSQL:
1. Go to Vercel Dashboard → Your Project → Storage/Database
2. Copy the `DATABASE_URL` connection string
3. Should look like: `postgresql://user:pass@host:port/database`

#### If using Firebase/Firestore:
- You'll need to set up a relational database (PostgreSQL recommended)
- Consider using Vercel Postgres, Supabase, or Neon

#### If using other hosting:
- Locate your database connection string
- Ensure you have migration access

### Step 3: Apply Migration to Production

**IMPORTANT: Backup your production database first!**

```bash
# Set production DATABASE_URL
$env:DATABASE_URL="your-production-database-url-here"

# Generate Prisma client
npx prisma generate

# Apply migration to production
npx prisma migrate deploy

# Or use push if you want to sync without migration files
npx prisma db push
```

### Step 4: Create Admin Account on Production

#### Option A: Using the Script
```bash
# Set production DATABASE_URL
$env:DATABASE_URL="your-production-database-url-here"

# Create admin account
npx tsx scripts/create-admin.ts admin@craicnkuche.com YourSecurePassword! "Admin Name"
```

#### Option B: Using Prisma Studio (Safer)
```bash
# Connect to production database
$env:DATABASE_URL="your-production-database-url-here"
npx prisma studio

# In Prisma Studio:
# 1. Open User table
# 2. Find your existing user account
# 3. Change 'role' field to 'SUPER_ADMIN'
# 4. Save
```

#### Option C: Direct SQL Update
```sql
-- Connect to your production database
-- Update existing user to admin
UPDATE "User"
SET role = 'SUPER_ADMIN', 
    "isActive" = true
WHERE email = 'your-email@craicnkuche.com';
```

### Step 5: Deploy Application Code

Your code changes need to be deployed to production:

```bash
# Commit changes
git add .
git commit -m "Add admin system with role-based access control"

# Push to production
git push origin main

# If using Vercel, it will auto-deploy
# If using other hosting, trigger deployment
```

### Step 6: Set Environment Variables

Ensure your production environment has all required variables:

**Required for Vercel/Production:**
- `DATABASE_URL` - Your production database connection
- `NEXTAUTH_URL` - https://craicnkuche.com
- `NEXTAUTH_SECRET` - Secure random string (different from dev!)
- `OPENAI_API_KEY` - Your OpenAI API key

**To set in Vercel:**
1. Go to Project Settings → Environment Variables
2. Add each variable
3. Redeploy application

### Step 7: Verify Production Deployment

1. Visit https://craicnkuche.com
2. Log in with your admin credentials
3. Look for "Admin" link in header (Shield icon)
4. Click to access `/admin` dashboard

## Specific Instructions by Hosting Platform

### For Vercel Deployment:

1. **Add Vercel Postgres** (if not already):
   ```bash
   # In Vercel Dashboard
   # Storage → Create Database → Postgres
   # Copy connection string
   ```

2. **Set Environment Variables**:
   ```
   DATABASE_URL=postgresql://...
   NEXTAUTH_URL=https://craicnkuche.com
   NEXTAUTH_SECRET=generate-random-string-here
   OPENAI_API_KEY=sk-...
   ```

3. **Run Migration**:
   ```bash
   # Connect to Vercel Postgres
   $env:DATABASE_URL="postgresql://vercel-connection-string"
   npx prisma migrate deploy
   ```

4. **Create Admin via Vercel CLI**:
   ```bash
   vercel env pull .env.production
   # Edit .env.production with DATABASE_URL
   $env:DATABASE_URL="your-vercel-postgres-url"
   npx tsx scripts/create-admin.ts admin@craicnkuche.com SecurePass123!
   ```

5. **Deploy**:
   ```bash
   git push origin main
   # Vercel auto-deploys
   ```

### For Firebase Hosting:

If using Firebase, you'll need to:
1. Set up Cloud SQL (PostgreSQL)
2. Update connection in Firebase Functions
3. Run migrations
4. Deploy functions and hosting

### For Other Platforms:

1. Locate database connection string
2. Run migration: `npx prisma migrate deploy`
3. Create admin account
4. Deploy application code
5. Set environment variables

## Quick Production Setup Script

Create a file `scripts/setup-production-admin.ts`:

```typescript
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const prodEmail = process.env.ADMIN_EMAIL || 'admin@craicnkuche.com';
  const prodPassword = process.env.ADMIN_PASSWORD || 'ChangeThisPassword123!';
  const prodName = process.env.ADMIN_NAME || 'Admin';

  console.log('🚀 Setting up production admin...');
  console.log(`📧 Email: ${prodEmail}`);

  const hashedPassword = await bcrypt.hash(prodPassword, 12);

  const admin = await prisma.user.upsert({
    where: { email: prodEmail },
    update: {
      role: 'SUPER_ADMIN',
      isActive: true,
    },
    create: {
      email: prodEmail,
      password: hashedPassword,
      name: prodName,
      role: 'SUPER_ADMIN',
      isActive: true,
      lastLogin: new Date(),
    },
  });

  console.log('✅ Production admin ready!');
  console.log(`   ID: ${admin.id}`);
  console.log(`   Email: ${admin.email}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

Run with:
```bash
$env:DATABASE_URL="production-db-url"
$env:ADMIN_EMAIL="your-email@craicnkuche.com"
$env:ADMIN_PASSWORD="YourSecurePassword"
npx tsx scripts/setup-production-admin.ts
```

## Security Checklist

Before going to production:

- [ ] Use STRONG password (not Admin123!)
- [ ] Different NEXTAUTH_SECRET than dev
- [ ] HTTPS enabled (should be via Vercel/hosting)
- [ ] Database backups enabled
- [ ] Environment variables set correctly
- [ ] Test admin login on production
- [ ] Verify regular users can't access /admin

## Troubleshooting

### Issue: Migration fails on production
**Solution**: Check if production database schema differs from local
```bash
npx prisma db pull # Pull current production schema
npx prisma migrate resolve --applied "migration-name" # Mark as applied if needed
```

### Issue: Admin link doesn't appear
**Solution**: 
1. Clear browser cache
2. Log out and log in again
3. Check role in database
4. Verify code deployed

### Issue: Can't connect to production database
**Solution**:
1. Check DATABASE_URL format
2. Verify IP whitelist (some DBs restrict IPs)
3. Check SSL requirements
4. Test connection with: `npx prisma db pull`

## Need Help?

Check your hosting platform documentation:
- **Vercel**: https://vercel.com/docs/storage/vercel-postgres
- **Firebase**: https://firebase.google.com/docs/hosting
- **Railway**: https://docs.railway.app/databases/postgresql
- **Render**: https://render.com/docs/databases

---

**Important**: Production database setup varies by hosting platform. Let me know which platform you're using for specific instructions!
