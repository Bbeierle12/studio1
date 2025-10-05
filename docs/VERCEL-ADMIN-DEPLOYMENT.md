# Deploy Admin System to craicnkuche.com (Vercel)

## Quick Start - 3 Steps

### Step 1: Push Code to GitHub
```bash
# Commit all admin changes
git add .
git commit -m "Add admin system with role-based access control"
git push origin main
```

Vercel will automatically deploy, but the admin won't work yet because:
- Migration hasn't run on production database
- Admin account doesn't exist in production

### Step 2: Check Your Production Database

Go to [Vercel Dashboard](https://vercel.com/dashboard):
1. Select your project (studio1 or craicnkuche)
2. Click "Storage" tab
3. Check if you have a Postgres database

**If YES (you have Vercel Postgres):**
- Note the database name
- Continue to Step 3

**If NO (no database yet):**
- Click "Create Database"
- Select "Postgres"
- Choose a region close to your users
- Wait for provisioning (~2 minutes)
- Database will auto-connect to your project

### Step 3: Run Migration on Production

#### Option A: Using Vercel CLI (Recommended)

```powershell
# Install Vercel CLI if not installed
npm i -g vercel

# Login to Vercel
vercel login

# Link to your project
vercel link

# Pull environment variables (includes DATABASE_URL)
vercel env pull .env.vercel

# Run migration using production DATABASE_URL
# Replace with actual connection string from Vercel dashboard
$env:DATABASE_URL="postgres://default:xxxxx@xxxxx-pooler.us-east-1.postgres.vercel-storage.vercel.app:5432/verceldb"

# Apply migration
npx prisma migrate deploy

# Create admin account
npx tsx scripts/create-admin.ts admin@craicnkuche.com "YourSecurePassword!" "Admin Name"
```

#### Option B: Using Vercel Dashboard (Web UI)

1. **Get Connection String:**
   - Vercel Dashboard → Your Project → Storage → Postgres
   - Click "Connect" → Copy connection string
   - Should start with `postgres://default:`

2. **Run Migration Locally:**
   ```powershell
   # Use production connection string
   $env:DATABASE_URL="paste-connection-string-here"
   
   # Apply migration
   npx prisma migrate deploy
   
   # Create admin
   npx tsx scripts/create-admin.ts your-email@craicnkuche.com "SecurePass123!" "Your Name"
   ```

3. **Verify:**
   ```powershell
   # Check database with Prisma Studio
   $env:DATABASE_URL="paste-connection-string-here"
   npx prisma studio
   # Look for your user with role=SUPER_ADMIN
   ```

## Complete Step-by-Step Guide

### 1. Ensure Code is Deployed

```bash
# Check your current branch
git branch

# Make sure you're on main
git checkout main

# Commit any pending changes
git status
git add .
git commit -m "Add admin system"

# Push to GitHub (triggers Vercel deployment)
git push origin main
```

### 2. Wait for Vercel Deployment

- Go to https://vercel.com/dashboard
- Watch the deployment progress
- Wait for "Ready" status
- Note: Admin won't work yet - that's expected!

### 3. Access Production Database

**Method 1: Via Vercel Dashboard**
1. Vercel Dashboard → Your Project
2. Click "Storage" tab
3. Select your Postgres database
4. Click ".env.local" tab
5. Copy the `POSTGRES_URL` value

**Method 2: Via Vercel CLI**
```bash
vercel env pull .env.production
# Opens .env.production with DATABASE_URL
```

### 4. Apply Database Migration

```powershell
# Set production database URL
$env:DATABASE_URL="postgres://your-vercel-postgres-url"

# Show what will be applied
npx prisma migrate status

# Apply migrations
npx prisma migrate deploy

# Expected output:
# ✓ Applied migration: 20250919065500_init
# ✓ Applied migration: 20250919072553_add_meal_tags_support
# ✓ Applied migration: 20250928041102_add_indexes_and_constraints
# ✓ Applied migration: 20251005002954_add_admin_system
```

### 5. Create Production Admin Account

```powershell
# Still using production DATABASE_URL from step 4
$env:DATABASE_URL="postgres://your-vercel-postgres-url"

# Option 1: Default admin
npx tsx scripts/create-admin.ts

# Option 2: Custom credentials
npx tsx scripts/create-admin.ts "your-email@craicnkuche.com" "YourPassword123!" "Your Name"
```

### 6. Verify Admin Account Exists

```powershell
# Open Prisma Studio connected to production
$env:DATABASE_URL="postgres://your-vercel-postgres-url"
npx prisma studio

# In Prisma Studio:
# 1. Click "User" table
# 2. Find your admin account
# 3. Verify "role" = "SUPER_ADMIN"
# 4. Verify "isActive" = true
```

### 7. Test on Production Site

1. Go to https://craicnkuche.com
2. Click "Sign In"
3. Enter your admin credentials
4. After login, check for orange "Admin" link in header
5. Click "Admin" to access dashboard

## Environment Variables Checklist

Make sure these are set in Vercel:

Go to: Vercel Dashboard → Your Project → Settings → Environment Variables

Required variables:
- ✅ `DATABASE_URL` - Auto-set by Vercel Postgres
- ✅ `NEXTAUTH_URL` - Set to `https://craicnkuche.com`
- ✅ `NEXTAUTH_SECRET` - Generate secure random string
- ✅ `OPENAI_API_KEY` - Your OpenAI key (for voice assistant)

**To set/update:**
1. Go to Environment Variables
2. Add new or edit existing
3. Set for "Production" environment
4. Save
5. Redeploy application

**Generate NEXTAUTH_SECRET:**
```bash
# Generate secure random string
openssl rand -base64 32

# Or use this PowerShell command:
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }) -as [byte[]])
```

## Quick Troubleshooting

### Issue: "Environment variable not found: DATABASE_URL"
**Solution**: Vercel Postgres auto-sets this. Make sure:
- Database is created in Vercel Dashboard
- Database is linked to your project
- Redeploy application after creating database

### Issue: Admin link doesn't appear after login
**Checklist:**
- [ ] Code deployed to Vercel (check latest commit)
- [ ] Migration applied to production database
- [ ] Admin account exists with role=SUPER_ADMIN
- [ ] Logged in with correct credentials
- [ ] Browser cache cleared
- [ ] Hard refresh (Ctrl+Shift+R)

### Issue: Can't connect to production database from local
**Solution**: Check connection string format
```
# Correct format:
postgres://user:password@host:5432/database

# Common issues:
- Missing postgres:// prefix
- Wrong port (should be 5432)
- Special characters in password not URL-encoded
```

### Issue: Migration already applied but showing as pending
**Solution**:
```bash
$env:DATABASE_URL="your-production-url"
npx prisma migrate resolve --applied "20251005002954_add_admin_system"
```

## Security Best Practices

### 1. Strong Password
Don't use `Admin123!` in production!
```bash
# Generate strong password
openssl rand -base64 16
```

### 2. Different Secrets
Use different `NEXTAUTH_SECRET` for:
- Development (.env.local)
- Production (Vercel environment variables)

### 3. Limit Admin Accounts
- Only create admin accounts for trusted users
- Use SUPPORT_ADMIN or CONTENT_ADMIN for most staff
- Reserve SUPER_ADMIN for 1-2 people

### 4. Monitor Admin Activity
- Review audit logs regularly (once implemented)
- Check for suspicious admin logins
- Use lastLogin field to track activity

## Vercel Postgres Tips

### View Database
```bash
# Connect with Prisma Studio
vercel env pull
$env:DATABASE_URL="paste-url-from-pulled-env"
npx prisma studio
```

### Backup Database
Vercel Postgres has automatic backups, but you can also:
```bash
# Export data
npx prisma db pull
npx prisma db push --preview-feature
```

### Monitor Usage
- Vercel Dashboard → Storage → Your Database
- Check rows, storage, and query usage
- Free tier has limits - upgrade if needed

## Testing Checklist

After deployment, test these:

- [ ] Can access https://craicnkuche.com
- [ ] Can log in with admin credentials
- [ ] Admin link (Shield icon) appears in header
- [ ] Can access /admin dashboard
- [ ] Stats cards show correct numbers
- [ ] Regular users can't access /admin
- [ ] Non-admin accounts don't see admin link

## Next Steps After Deployment

1. **Change Admin Password**
   - Log in to production site
   - Update password via profile (or Prisma Studio)

2. **Create Additional Admins**
   ```bash
   $env:DATABASE_URL="production-url"
   npx tsx scripts/create-admin.ts "email@example.com" "password" "Name"
   ```

3. **Test Role Permissions**
   - Create test accounts with different roles
   - Verify access levels work correctly

4. **Monitor Production**
   - Check Vercel logs for errors
   - Monitor database performance
   - Review user activity

## Need Help?

If admin still doesn't work after following these steps:

1. **Check Vercel Logs:**
   - Dashboard → Your Project → Logs
   - Look for errors during login

2. **Verify Database:**
   ```bash
   $env:DATABASE_URL="production-url"
   npx prisma studio
   # Check User table for admin account
   ```

3. **Check Browser Console:**
   - F12 → Console tab
   - Look for error messages

4. **Redeploy:**
   ```bash
   # Sometimes helps
   git commit --allow-empty -m "Trigger redeploy"
   git push origin main
   ```

---

**Summary: 3 Commands to Deploy Admin**

```powershell
# 1. Deploy code
git push origin main

# 2. Apply migration (use your actual Vercel Postgres URL)
$env:DATABASE_URL="postgres://default:xxx@xxx.vercel-storage.vercel.app:5432/verceldb"
npx prisma migrate deploy

# 3. Create admin
npx tsx scripts/create-admin.ts "your-email@craicnkuche.com" "SecurePassword!" "Your Name"
```

Then test at https://craicnkuche.com/admin 🎉
