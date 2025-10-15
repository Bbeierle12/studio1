# 🚀 Security Essentials - Migration Instructions

## ⚠️ Important: Run This BEFORE Deploying

All TypeScript errors you see are **expected** and will resolve automatically after running the database migration.

---

## Step-by-Step Migration

### 1. Generate Encryption Key
```bash
# Run this command
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Output will be something like:
# a1b2c3d4e5f6...  (64 hex characters)
```

### 2. Add to Environment Variables

**For local development (.env.local):**
```bash
ENCRYPTION_KEY=<your-generated-key-from-step-1>
```

**For production (Vercel, etc.):**
- Go to your hosting provider's environment variables settings
- Add: `ENCRYPTION_KEY` = `<your-generated-key>`
- Redeploy after migration

### 3. Run Database Migration

```bash
# This generates the Prisma client with new models
npx prisma generate

# This creates and runs the migration
npx prisma migrate dev --name add_security_essentials
```

**Expected Output:**
```
Prisma schema loaded from prisma\schema.prisma
Datasource "db": PostgreSQL database

Prisma Migrate applied the following migration(s):

migrations/
  └─ 20251015XXXXXX_add_security_essentials/
      └─ migration.sql

✔ Generated Prisma Client
```

### 4. Verify Migration Success

```bash
# Check that new tables exist
npx prisma studio

# Should see:
# - AdminIpAllowlist (new)
# - CsrfToken (new)
# - User (with twoFactorSecret, twoFactorEnabled, twoFactorVerifiedAt)
```

### 5. TypeScript Errors Should Be Gone

After running `npx prisma generate`, all TypeScript errors will disappear because Prisma Client will now include:
- `prisma.adminIpAllowlist.*`
- `prisma.csrfToken.*`
- `user.twoFactorSecret`
- `user.twoFactorEnabled`
- `user.twoFactorVerifiedAt`

---

## 🔍 What the Migration Does

### Creates New Table: AdminIpAllowlist
```sql
CREATE TABLE "AdminIpAllowlist" (
  "id" TEXT NOT NULL,
  "ipAddress" TEXT NOT NULL,
  "description" TEXT,
  "addedBy" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "expiresAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AdminIpAllowlist_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AdminIpAllowlist_ipAddress_key" ON "AdminIpAllowlist"("ipAddress");
CREATE INDEX "AdminIpAllowlist_ipAddress_idx" ON "AdminIpAllowlist"("ipAddress");
CREATE INDEX "AdminIpAllowlist_isActive_idx" ON "AdminIpAllowlist"("isActive");
```

### Creates New Table: CsrfToken
```sql
CREATE TABLE "CsrfToken" (
  "id" TEXT NOT NULL,
  "token" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CsrfToken_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CsrfToken_token_key" ON "CsrfToken"("token");
CREATE INDEX "CsrfToken_token_idx" ON "CsrfToken"("token");
CREATE INDEX "CsrfToken_userId_idx" ON "CsrfToken"("userId");
CREATE INDEX "CsrfToken_expiresAt_idx" ON "CsrfToken"("expiresAt");
```

### Alters User Table
```sql
ALTER TABLE "User" ADD COLUMN "twoFactorSecret" TEXT;
ALTER TABLE "User" ADD COLUMN "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN "twoFactorVerifiedAt" TIMESTAMP(3);
```

---

## 🧪 Post-Migration Testing

### 1. Test 2FA Setup
```bash
# From your terminal
curl -X POST http://localhost:9002/api/admin/security/2fa \
  -H "Content-Type: application/json" \
  -H "Cookie: <your-admin-session-cookie>" \
  -d '{"action":"setup"}'

# Should return:
# {
#   "secret": "ABCD1234...",
#   "qrCodeURL": "otpauth://totp/...",
#   "message": "Scan QR code..."
# }
```

### 2. Test IP Allowlist
```bash
curl -X POST http://localhost:9002/api/admin/security/ip-allowlist \
  -H "Content-Type: application/json" \
  -H "Cookie: <your-admin-session-cookie>" \
  -d '{
    "ipAddress": "192.168.1.100",
    "description": "Test IP"
  }'

# Should return:
# { "success": true, "message": "IP added to allowlist successfully" }
```

### 3. Test CSRF Token Generation
```bash
curl http://localhost:9002/api/admin/security/csrf \
  -H "Cookie: <your-admin-session-cookie>"

# Should return:
# { "token": "abc123...", "expiresIn": "1 hour" }
```

---

## 🚨 Troubleshooting

### Error: "DATABASE_URL not found"
**Solution:** Make sure your `.env.local` has `DATABASE_URL` set.
```bash
# Check your .env.local file
cat .env.local | grep DATABASE_URL
```

### Error: "ENCRYPTION_KEY not set"
**Solution:** You forgot step 1 & 2. Add the encryption key to your environment.

### TypeScript errors still showing
**Solution:** Run `npx prisma generate` again and restart your IDE.
```bash
npx prisma generate
# Then restart VS Code
```

### Migration fails with "table already exists"
**Solution:** The migration was already run. You're good!
```bash
# Check migration status
npx prisma migrate status
```

---

## 📋 Rollback (If Needed)

If something goes wrong, you can rollback:

```bash
# Reset the database (⚠️ DELETES ALL DATA)
npx prisma migrate reset

# Or manually rollback
# 1. Delete the migration folder
rm -rf prisma/migrations/[timestamp]_add_security_essentials

# 2. Run prisma migrate dev again
npx prisma migrate dev
```

---

## ✅ Success Checklist

After running the migration, verify:

- [ ] `npx prisma generate` completed successfully
- [ ] No TypeScript errors in security files
- [ ] Can access `/api/admin/security/2fa`
- [ ] Can access `/api/admin/security/ip-allowlist`
- [ ] Can access `/api/admin/security/csrf`
- [ ] Prisma Studio shows new tables
- [ ] ENCRYPTION_KEY is set in environment

---

## 🚀 Ready to Deploy!

Once all checks pass:

1. ✅ Commit the migration files
2. ✅ Push to your repository
3. ✅ Set ENCRYPTION_KEY in production environment
4. ✅ Deploy to production
5. ✅ Run `npx prisma migrate deploy` in production

**Your admin panel is now secured!** 🔒
