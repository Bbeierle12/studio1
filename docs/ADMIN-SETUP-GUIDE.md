# Admin System Setup Guide

## Prerequisites
- Existing Our Family Table application
- PostgreSQL database access
- Admin privileges to make database changes

## Step 1: Database Migration

### 1.1 Review Schema Changes
The following changes have been made to `prisma/schema.prisma`:
- Added `UserRole` enum (USER, SUPPORT_ADMIN, CONTENT_ADMIN, SUPER_ADMIN)
- Added `role`, `isActive`, `lastLogin` fields to User model
- Created `AuditLog` model for tracking admin actions
- Created `SystemSetting` model for application configuration
- Created `FeatureFlag` model for feature toggles

### 1.2 Create and Run Migration

```bash
# Generate Prisma client with new schema
npx prisma generate

# Create migration
npx prisma migrate dev --name add_admin_system

# Apply migration
npx prisma migrate deploy
```

### 1.3 Verify Migration
```bash
# Open Prisma Studio to verify changes
npx prisma studio
```

## Step 2: Create First Super Admin

### Option A: Direct Database Update (Recommended for first admin)

```sql
-- Update an existing user to Super Admin
UPDATE "User"
SET role = 'SUPER_ADMIN'
WHERE email = 'your-email@example.com';
```

### Option B: Using Prisma Studio
1. Open Prisma Studio: `npx prisma studio`
2. Navigate to User table
3. Find your user account
4. Change `role` field to `SUPER_ADMIN`
5. Save changes

### Option C: Create Seed Script

Create `prisma/seed-admin.ts`:
```typescript
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = 'admin@ourfamilytable.com';
  const adminPassword = 'ChangeThisPassword123!';

  const hashedPassword = await bcrypt.hash(adminPassword, 12);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      role: 'SUPER_ADMIN',
    },
    create: {
      email: adminEmail,
      password: hashedPassword,
      name: 'Super Admin',
      role: 'SUPER_ADMIN',
      isActive: true,
    },
  });

  console.log('✅ Super Admin created:', admin.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

Run seed:
```bash
npx tsx prisma/seed-admin.ts
```

## Step 3: Update NextAuth Configuration

### 3.1 Update `src/lib/auth.ts`

Add role to JWT token and session:

```typescript
// In callbacks section
callbacks: {
  async jwt({ token, user }) {
    if (user) {
      token.id = user.id;
      token.role = user.role; // Add this
      token.isActive = user.isActive; // Add this
    }
    return token;
  },
  async session({ session, token }) {
    if (session.user) {
      session.user.id = token.id;
      session.user.role = token.role; // Add this
      session.user.isActive = token.isActive; // Add this
    }
    return session;
  },
},
```

### 3.2 Update NextAuth Types

Create or update `types/next-auth.d.ts`:

```typescript
import NextAuth from 'next-auth';

declare module 'next-auth' {
  interface User {
    id: string;
    role?: 'USER' | 'SUPPORT_ADMIN' | 'CONTENT_ADMIN' | 'SUPER_ADMIN';
    isActive?: boolean;
  }

  interface Session {
    user: User;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role?: 'USER' | 'SUPPORT_ADMIN' | 'CONTENT_ADMIN' | 'SUPER_ADMIN';
    isActive?: boolean;
  }
}
```

## Step 4: Update Middleware

### 4.1 Update `src/middleware.ts`

Add admin route protection:

```typescript
import { withAuth } from 'next-auth/middleware';
import { type NextRequest } from 'next/server';

// Only these routes are public (accessible without login)
const PUBLIC_ROUTES = ['/login', '/register'];
const ADMIN_ROUTES = ['/admin'];

export default withAuth(
  function middleware(request: NextRequest) {
    // This function runs after authentication check
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;
        
        // Allow access to public routes
        if (PUBLIC_ROUTES.includes(pathname)) {
          return true;
        }
        
        // Check if route is admin
        if (pathname.startsWith('/admin')) {
          const role = token?.role as string;
          return ['SUPPORT_ADMIN', 'CONTENT_ADMIN', 'SUPER_ADMIN'].includes(role);
        }
        
        // All other routes require authentication
        return !!token;
      },
    },
    pages: {
      signIn: '/login',
    },
  }
);
```

## Step 5: Verify Installation

### 5.1 Test Admin Access
1. Log in with your super admin account
2. Navigate to `/admin`
3. You should see the admin dashboard

### 5.2 Test Permissions
1. Log out
2. Log in with a regular user account
3. Try accessing `/admin` - should redirect to home
4. Verify no admin options appear

### 5.3 Test Role Hierarchy
Create test accounts for each role and verify:
- **SUPER_ADMIN**: Can access all admin features
- **CONTENT_ADMIN**: Can manage users and recipes
- **SUPPORT_ADMIN**: Can view users and recipes only
- **USER**: Cannot access admin at all

## Step 6: Configure Admin Features

### 6.1 Set Default System Settings (Optional)

```typescript
// Create initial settings
const settings = [
  { key: 'SITE_NAME', value: 'Our Family Table', category: 'General' },
  { key: 'MAX_UPLOAD_SIZE', value: '10485760', category: 'General' }, // 10MB
  { key: 'ENABLE_VOICE_ASSISTANT', value: 'true', category: 'Features' },
];

for (const setting of settings) {
  await prisma.systemSetting.create({
    data: {
      ...setting,
      updatedBy: adminUserId,
    },
  });
}
```

### 6.2 Create Initial Feature Flags (Optional)

```typescript
const flags = [
  { name: 'voice_assistant', enabled: true, description: 'AI Voice Assistant' },
  { name: 'weather_integration', enabled: true, description: 'Weather-based recommendations' },
  { name: 'recipe_sharing', enabled: false, description: 'Public recipe sharing' },
];

for (const flag of flags) {
  await prisma.featureFlag.create({ data: flag });
}
```

## Admin Routes Created

- `/admin` - Main dashboard
- `/admin/users` - User management (to be implemented)
- `/admin/recipes` - Recipe management (to be implemented)
- `/admin/analytics` - Analytics dashboard (to be implemented)
- `/admin/audit` - Audit logs (to be implemented)
- `/admin/settings` - System settings (to be implemented)
- `/admin/features` - Feature flags (to be implemented)
- `/admin/database` - Database tools (to be implemented)

## API Endpoints Created

- `GET /api/admin/stats` - Dashboard statistics

## Security Features

### 1. Role-Based Access Control (RBAC)
- Middleware protects all `/admin` routes
- Component-level permission checks
- API endpoint authorization

### 2. Audit Logging
- All admin actions are logged
- Tracks who, what, when, where
- Immutable audit trail

### 3. Session Management
- Admin actions require valid session
- Role verified on every request
- Automatic session validation

## Troubleshooting

### Issue: "Property 'role' does not exist"
**Solution**: Run `npx prisma generate` to regenerate Prisma client

### Issue: Migration fails
**Solution**: 
1. Check database connection
2. Ensure no conflicting migrations
3. Try `npx prisma migrate reset` (WARNING: Deletes data)

### Issue: Can't access admin even as SUPER_ADMIN
**Solution**:
1. Clear browser cache/cookies
2. Log out and log in again
3. Verify role in database
4. Check middleware configuration

### Issue: TypeScript errors after migration
**Solution**:
1. Restart TypeScript server in VS Code
2. Run `npx prisma generate`
3. Restart dev server

## Next Steps

### Phase 1 (Immediate)
1. ✅ Database schema updated
2. ✅ Admin dashboard created
3. ✅ Basic stats API
4. ⏳ Create super admin account
5. ⏳ Update NextAuth configuration
6. ⏳ Run migration

### Phase 2 (Short-term)
1. Implement user management page
2. Implement recipe management page
3. Add audit logging to actions
4. Create analytics dashboard

### Phase 3 (Medium-term)
1. System settings interface
2. Feature flags interface
3. Database tools
4. Bulk operations

## Security Best Practices

1. **Change default admin password immediately**
2. **Use strong passwords for all admin accounts**
3. **Limit number of SUPER_ADMIN accounts**
4. **Review audit logs regularly**
5. **Keep admin sessions short (30 min)**
6. **Enable 2FA for admin accounts (future)**
7. **Restrict admin access by IP (future)**

## Monitoring Admin Activity

```typescript
// Example: Get recent admin actions
const recentActions = await prisma.auditLog.findMany({
  where: {
    user: {
      role: {
        in: ['SUPPORT_ADMIN', 'CONTENT_ADMIN', 'SUPER_ADMIN']
      }
    }
  },
  include: {
    user: {
      select: {
        name: true,
        email: true,
        role: true,
      }
    }
  },
  orderBy: {
    createdAt: 'desc'
  },
  take: 50
});
```

---

**Status**: Ready for migration
**Estimated Setup Time**: 15-30 minutes
**Breaking Changes**: None (adds new features only)
