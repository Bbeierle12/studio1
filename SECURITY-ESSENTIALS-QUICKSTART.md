# Security Essentials - Quick Setup Guide

## 🚀 Quick Start (5 Minutes)

### 1. Run Migration
```bash
npx prisma generate
npx prisma migrate dev --name add_security_essentials
```

### 2. Set Encryption Key
```bash
# Generate key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Add to .env.local
ENCRYPTION_KEY=<your-generated-key>
```

### 3. Setup 2FA (Super Admin)
```typescript
// Call API endpoint
POST /api/admin/security/2fa
{ "action": "setup" }

// Scan QR code with Google Authenticator/Authy

// Enable with code
POST /api/admin/security/2fa
{ "action": "enable", "code": "123456" }
```

### 4. Add Your IP to Allowlist
```typescript
POST /api/admin/security/ip-allowlist
{
  "ipAddress": "YOUR.IP.ADDRESS.HERE",
  "description": "My primary IP",
  "expiresInDays": 90
}
```

### 5. Protect Your Routes
```typescript
import { checkAdminSecurity, createSecurityErrorResponse } from '@/lib/admin-security';

export async function DELETE(request: NextRequest) {
  const security = await checkAdminSecurity(request, {
    requireSuperAdmin: true,
    require2FA: true,
    requireIPAllowlist: true,
    requireCSRF: true,
    rateLimit: 'sensitive'
  });

  if (!security.allowed) {
    return createSecurityErrorResponse(security);
  }

  // Your code here
}
```

## 📋 Security Levels at a Glance

| Operation | Super Admin | 2FA | IP List | CSRF | Rate Limit |
|-----------|-------------|-----|---------|------|------------|
| View Users | ❌ | ❌ | ❌ | ❌ | General (100/min) |
| Edit Users | ❌ | ❌ | ❌ | ✅ | Mutations (10/min) |
| Delete Users | ✅ | ✅ | ✅ | ✅ | Sensitive (5/min) |
| Change Roles | ✅ | ✅ | ✅ | ✅ | Sensitive (5/min) |

## 🔧 Files Created

| File | Purpose |
|------|---------|
| `src/lib/two-factor.ts` | 2FA utilities |
| `src/lib/ip-allowlist.ts` | IP management |
| `src/lib/csrf.ts` | CSRF protection |
| `src/lib/admin-security.ts` | Combined middleware |
| `src/app/api/admin/security/2fa/route.ts` | 2FA API |
| `src/app/api/admin/security/ip-allowlist/route.ts` | IP API |
| `src/app/api/admin/security/csrf/route.ts` | CSRF API |

## 📖 Full Documentation

See [SECURITY-ESSENTIALS-COMPLETE.md](./SECURITY-ESSENTIALS-COMPLETE.md) for detailed documentation.
