# 🔒 Security Essentials - Visual Guide

## 🛡️ Security Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     ADMIN REQUEST INCOMING                       │
│                  (DELETE /api/admin/users/123)                  │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
         ┌─────────────────────────────────────┐
         │  checkAdminSecurity(request, {      │
         │    requireSuperAdmin: true,         │
         │    require2FA: true,                │
         │    requireIPAllowlist: true,        │
         │    requireCSRF: true,               │
         │    rateLimit: 'sensitive'           │
         │  })                                 │
         └─────────────┬───────────────────────┘
                       │
        ┌──────────────▼──────────────┐
        │  1. CHECK AUTHENTICATION    │
        │  ✓ Valid session?           │
        │  ✓ User exists?             │
        │  ✓ Account active?          │
        └──────────────┬──────────────┘
                       │ ✅ Pass
        ┌──────────────▼──────────────┐
        │  2. CHECK ROLE              │
        │  ✓ Is admin?                │
        │  ✓ Is SUPER_ADMIN? (if req) │
        └──────────────┬──────────────┘
                       │ ✅ Pass
        ┌──────────────▼──────────────┐
        │  3. CHECK IP ALLOWLIST      │
        │  ✓ Get client IP            │
        │  ✓ IP in allowlist?         │
        │  ✓ Not expired?             │
        └──────────────┬──────────────┘
                       │ ✅ Pass
        ┌──────────────▼──────────────┐
        │  4. CHECK 2FA               │
        │  ✓ 2FA enabled?             │
        │  ✓ Verified in last 5 min?  │
        │  ✓ Code in header valid?    │
        └──────────────┬──────────────┘
                       │ ✅ Pass
        ┌──────────────▼──────────────┐
        │  5. CHECK CSRF TOKEN        │
        │  ✓ Token in request?        │
        │  ✓ Token valid?             │
        │  ✓ Token not expired?       │
        │  ✓ Delete token (one-use)   │
        └──────────────┬──────────────┘
                       │ ✅ Pass
        ┌──────────────▼──────────────┐
        │  6. CHECK RATE LIMIT        │
        │  ✓ Under sensitive limit?   │
        │  (5 requests per minute)    │
        └──────────────┬──────────────┘
                       │ ✅ Pass
        ┌──────────────▼──────────────┐
        │  ✅ ALL CHECKS PASSED        │
        │  Proceed with operation     │
        └─────────────────────────────┘
                       │
        ┌──────────────▼──────────────┐
        │  DELETE USER                │
        │  Create audit log           │
        └─────────────────────────────┘

                  ❌ Fail at any step
                       │
        ┌──────────────▼──────────────┐
        │  REJECT REQUEST             │
        │  - Log failed attempt       │
        │  - Return error response    │
        │  - Increment attempt counter│
        └─────────────────────────────┘
```

---

## 🎯 Security Levels Comparison

### Level 1: Read Operations (GET)
```
┌─────────────┐
│ Viewer      │
│ (Any Admin) │
└──────┬──────┘
       │
       ▼
┌─────────────────────┐
│ ✓ Authentication    │
│ ✓ Admin Role        │
│ ✓ General Rate Limit│
│ ✗ No CSRF           │
│ ✗ No 2FA            │
│ ✗ No IP Check       │
└─────────────────────┘
       │
       ▼
   Success ✅
```

### Level 2: Mutations (POST/PUT/PATCH)
```
┌─────────────┐
│ Editor      │
│ (Admin+)    │
└──────┬──────┘
       │
       ▼
┌─────────────────────┐
│ ✓ Authentication    │
│ ✓ Admin Role        │
│ ✓ CSRF Token        │
│ ✓ Mutation Limit    │
│ ✗ No 2FA            │
│ ✗ No IP Check       │
└─────────────────────┘
       │
       ▼
   Success ✅
```

### Level 3: Sensitive (DELETE/ROLE CHANGE)
```
┌─────────────┐
│ Super Admin │
│ (Highest)   │
└──────┬──────┘
       │
       ▼
┌─────────────────────┐
│ ✓ Authentication    │
│ ✓ SUPER_ADMIN Role  │
│ ✓ CSRF Token        │
│ ✓ 2FA Verification  │
│ ✓ IP Allowlist      │
│ ✓ Sensitive Limit   │
└─────────────────────┘
       │
       ▼
   Success ✅
```

---

## 🔐 2FA Setup Flow

```
┌──────────────────┐
│ Super Admin      │
│ Wants to Enable  │
│ 2FA              │
└────────┬─────────┘
         │
         ▼
┌─────────────────────────┐
│ 1. POST /2fa            │
│    { action: 'setup' }  │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│ 2. Server Generates     │
│    - Random Secret      │
│    - QR Code URL        │
│    - Saves encrypted    │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│ 3. User Scans QR Code   │
│    with Authenticator   │
│    App (Google Auth,    │
│    Authy, etc.)         │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│ 4. App Generates Code   │
│    (6 digits, changes   │
│    every 30 seconds)    │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│ 5. POST /2fa            │
│    { action: 'enable',  │
│      code: '123456' }   │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│ 6. Server Verifies Code │
│    - Decrypt secret     │
│    - Generate expected  │
│    - Compare codes      │
│    - Mark as enabled    │
└────────┬────────────────┘
         │
         ▼
    ✅ 2FA Enabled

    Future Sensitive Ops:
         │
         ▼
┌─────────────────────────┐
│ Include code in header: │
│ x-2fa-code: '123456'    │
└─────────────────────────┘
```

---

## 🌐 IP Allowlist Flow

```
┌──────────────────┐
│ Super Admin      │
│ From Office IP   │
│ 203.0.113.10     │
└────────┬─────────┘
         │
         ▼
┌─────────────────────────────┐
│ 1. POST /ip-allowlist       │
│    {                        │
│      ipAddress: '203.0.113.10'│
│      description: 'Office'  │
│      expiresInDays: 90      │
│    }                        │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│ 2. Server Saves to DB       │
│    ┌─────────────────────┐  │
│    │ AdminIpAllowlist    │  │
│    │ - IP: 203.0.113.10  │  │
│    │ - Active: true      │  │
│    │ - Expires: +90 days │  │
│    └─────────────────────┘  │
└────────┬────────────────────┘
         │
         ▼
    ✅ IP Allowed

    Future Request from Same IP:
         │
         ▼
┌─────────────────────────────┐
│ 1. Extract client IP        │
│    getClientIP(request)     │
│    → 203.0.113.10           │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│ 2. Check Database           │
│    SELECT * FROM allowlist  │
│    WHERE ip = '203.0.113.10'│
│    AND active = true        │
│    AND expires > NOW()      │
└────────┬────────────────────┘
         │
    ✅ Found → Allow
    ❌ Not Found → Block
```

---

## 🎫 CSRF Protection Flow

```
┌──────────────────┐
│ Client Needs to  │
│ Make POST Request│
└────────┬─────────┘
         │
         ▼
┌─────────────────────────┐
│ 1. GET /csrf            │
│    (Get Token)          │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│ 2. Server Generates     │
│    - Random 32 bytes    │
│    - Hash to hex        │
│    - Save to DB         │
│    - Set expiry 1hr     │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│ 3. Return Token         │
│    { token: 'abc123...' }│
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│ 4. Client Includes in   │
│    Next Request         │
│    Header:              │
│    x-csrf-token: abc123 │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│ 5. Server Validates     │
│    - Find token in DB   │
│    - Check not expired  │
│    - Check user match   │
│    - Delete token       │
└────────┬────────────────┘
         │
    ✅ Valid → Allow
    ❌ Invalid → Block (403)
    
    Token is ONE-TIME USE
    Must get new token for
    next request
```

---

## ⏱️ Rate Limiting Visualization

```
Time Window: 60 seconds (1 minute)

GENERAL (100 requests/min):
├────┬────┬────┬────┬────┬────┬────┬────┬────┬────┤
│ 10 │ 20 │ 30 │ 40 │ 50 │ 60 │ 70 │ 80 │ 90 │100 │ ✅ OK
└────┴────┴────┴────┴────┴────┴────┴────┴────┴────┘
                                                │101│ ❌ BLOCKED
                                                └───┘

MUTATIONS (10 requests/min):
├────┬────┬────┬────┬────┬────┬────┬────┬────┬────┤
│ 1  │ 2  │ 3  │ 4  │ 5  │ 6  │ 7  │ 8  │ 9  │ 10 │ ✅ OK
└────┴────┴────┴────┴────┴────┴────┴────┴────┴────┘
                                                │ 11│ ❌ BLOCKED
                                                └───┘

SENSITIVE (5 requests/min):
├────┬────┬────┬────┬────┤
│ 1  │ 2  │ 3  │ 4  │ 5  │ ✅ OK
└────┴────┴────┴────┴────┘
                      │ 6 │ ❌ BLOCKED
                      └───┘

Rate Limit Response:
{
  "error": "Too many requests",
  "resetIn": 45000,  // milliseconds until reset
  "remaining": 0
}

Wait 45 seconds, then try again ✅
```

---

## 📊 Security Check Matrix

```
┌────────────────┬──────┬──────┬────────┬──────┬────────┐
│ Route Type     │ Auth │ Role │ CSRF   │ 2FA  │ IP     │
├────────────────┼──────┼──────┼────────┼──────┼────────┤
│ GET /users     │  ✓   │ Any  │   -    │  -   │   -    │
│ POST /users    │  ✓   │ Cont │   ✓    │  -   │   -    │
│ PATCH /users   │  ✓   │ Cont │   ✓    │  -   │   -    │
│ DELETE /users  │  ✓   │ Supr │   ✓    │  ✓   │   ✓    │
│ PATCH /roles   │  ✓   │ Supr │   ✓    │  ✓   │   ✓    │
│ POST /features │  ✓   │ Supr │   ✓    │  ✓   │   ✓    │
│ DELETE /db     │  ✓   │ Supr │   ✓    │  ✓   │   ✓    │
└────────────────┴──────┴──────┴────────┴──────┴────────┘

Legend:
Auth = Authentication required
Role = Admin level: Any/Cont(ent)/Supr(Super)
CSRF = CSRF token required
2FA  = Two-factor auth required
IP   = IP allowlist check
```

---

## 🎨 Security Feature Icons

```
🔐 2FA
    └─ TOTP (Time-based One-Time Password)
    └─ QR Code Setup
    └─ 5-minute verification window

🌐 IP Allowlist
    └─ Per-IP access control
    └─ Auto-expiration
    └─ Localhost auto-allowed

⏱️ Rate Limiting
    └─ In-memory tracking
    └─ Sliding window
    └─ Auto cleanup

🎫 CSRF Protection
    └─ One-time tokens
    └─ 1-hour expiration
    └─ Header-based validation
```

---

## ✅ Complete Security Stack

```
┌────────────────────────────────────────────────┐
│          🛡️ ADMIN SECURITY LAYERS            │
├────────────────────────────────────────────────┤
│                                                │
│  Layer 6: 📊 Audit Logging                    │
│           └─ All actions logged                │
│                                                │
│  Layer 5: ⏱️ Rate Limiting                     │
│           └─ 5-100 req/min based on type       │
│                                                │
│  Layer 4: 🎫 CSRF Protection                   │
│           └─ One-time tokens, 1hr expiry       │
│                                                │
│  Layer 3: 🔐 2FA Verification                  │
│           └─ TOTP codes, 5min window           │
│                                                │
│  Layer 2: 🌐 IP Allowlist                      │
│           └─ Super Admin IP restriction        │
│                                                │
│  Layer 1: 🔑 Authentication & Authorization    │
│           └─ Session + Role check              │
│                                                │
└────────────────────────────────────────────────┘
```

All layers working together = 🏰 Fort Knox Security!
