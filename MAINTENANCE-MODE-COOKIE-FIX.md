# Maintenance Mode Fix

## Issue
The maintenance screen is displayed even though maintenance mode is turned off.

## Root Cause
The middleware checks for a `maintenance_mode` cookie in the browser. Even after turning off maintenance mode, the cookie persists in your browser.

## Solution Options

### Option 1: Clear the Cookie via Browser (Quick Fix)

**Chrome/Edge:**
1. Press `F12` to open DevTools
2. Go to **Application** tab
3. Expand **Cookies** in left sidebar
4. Click on your site URL (e.g., `http://localhost:3000`)
5. Find `maintenance_mode` cookie
6. Right-click → **Delete**
7. Refresh the page

**Firefox:**
1. Press `F12` to open DevTools
2. Go to **Storage** tab
3. Expand **Cookies**
4. Click on your site URL
5. Find `maintenance_mode` cookie
6. Right-click → **Delete**
7. Refresh the page

---

### Option 2: Add Cookie Clear Script (Automated)

Create a utility page to clear the cookie:

**File:** `src/app/clear-maintenance/page.tsx`
```tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';

export default function ClearMaintenancePage() {
  const router = useRouter();

  useEffect(() => {
    // Clear the maintenance_mode cookie
    document.cookie = 'maintenance_mode=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    
    // Redirect to home after 2 seconds
    setTimeout(() => {
      router.push('/');
    }, 2000);
  }, [router]);

  return (
    <div className="flex h-screen items-center justify-center">
      <Card className="w-96">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Maintenance Mode Cleared
          </CardTitle>
          <CardDescription>
            The maintenance mode cookie has been cleared. Redirecting...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            You will be redirected to the home page shortly.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
```

Then visit: `http://localhost:3000/clear-maintenance`

---

### Option 3: Update Middleware to Check Database (Recommended)

Instead of relying solely on cookies, check the actual database status:

**Update:** `src/middleware.ts`

```typescript
// Check maintenance mode from database via API
const maintenanceCookie = request.cookies.get('maintenance_mode')?.value === 'true';

// Fetch actual status from API (server-side)
let actualMaintenanceMode = maintenanceCookie;

try {
  // Only fetch if cookie says maintenance is on
  if (maintenanceCookie) {
    const response = await fetch(new URL('/api/maintenance', request.url));
    if (response.ok) {
      const data = await response.json();
      actualMaintenanceMode = data.isEnabled;
      
      // Update cookie to match actual status
      if (!data.isEnabled) {
        const response = NextResponse.next();
        response.cookies.set('maintenance_mode', 'false', { path: '/' });
        return response;
      }
    }
  }
} catch (error) {
  // Fallback to cookie value
  actualMaintenanceMode = maintenanceCookie;
}

// Use actualMaintenanceMode instead of maintenanceMode
if (actualMaintenanceMode && !isAdmin && pathname !== '/maintenance') {
  const maintenanceUrl = new URL('/maintenance', request.url);
  return NextResponse.redirect(maintenanceUrl);
}
```

---

### Option 4: Clear All Cookies (Nuclear Option)

Open browser console (`F12` → Console) and run:
```javascript
document.cookie.split(";").forEach(function(c) { 
  document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
});
location.reload();
```

**⚠️ Warning:** This will log you out!

---

## Quick Fix (Recommended)

**Just visit this URL to clear the cookie:**
```
http://localhost:3000/clear-maintenance
```

Or manually clear cookies via DevTools (Option 1).

---

## Prevention

To prevent this in the future, update the maintenance API to also clear the cookie when turning off maintenance mode:

**File:** `src/app/api/maintenance/route.ts`

```typescript
export async function POST(request: Request) {
  // ... existing code ...
  
  const response = NextResponse.json({ 
    message: 'Maintenance mode updated',
    isEnabled 
  });
  
  // Set or clear cookie when toggling
  response.cookies.set('maintenance_mode', isEnabled ? 'true' : 'false', {
    path: '/',
    httpOnly: false,
    sameSite: 'lax',
  });
  
  return response;
}
```

This ensures the cookie is cleared when you turn off maintenance mode via the admin panel.
