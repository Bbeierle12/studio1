# 🔒 Advanced Security Architecture - Visual Guide

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     ADVANCED SECURITY FEATURES                          │
│                          Recipe Hub v2.0                                │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│  1️⃣  PASSWORD HISTORY TRACKING                                          │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   User Changes Password                                                 │
│         │                                                                │
│         ▼                                                                │
│   ┌─────────────────────┐                                               │
│   │ Check if password   │──── Compare against last 5 passwords          │
│   │ was used before?    │                                               │
│   └─────────┬───────────┘                                               │
│             │                                                            │
│        ✅ New Password              ❌ Reused Password                   │
│             │                              │                             │
│             ▼                              ▼                             │
│   ┌──────────────────┐          ┌──────────────────┐                    │
│   │ Hash password    │          │ Reject change    │                    │
│   │ Add to history   │          │ Show error       │                    │
│   │ Cleanup old ones │          └──────────────────┘                    │
│   └──────────────────┘                                                  │
│                                                                          │
│   📊 Database: PasswordHistory                                          │
│       • userId                                                           │
│       • passwordHash (bcrypt)                                            │
│       • createdAt                                                        │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│  2️⃣  ENHANCED SECURITY HEADERS                                          │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   Every HTTP Response                                                   │
│         │                                                                │
│         ▼                                                                │
│   ┌──────────────────────────────────────────────────┐                  │
│   │  Strict-Transport-Security: max-age=31536000     │◄── Force HTTPS   │
│   ├──────────────────────────────────────────────────┤                  │
│   │  Content-Security-Policy:                        │◄── Prevent XSS   │
│   │    default-src 'self'                            │                  │
│   │    script-src 'self' 'unsafe-eval'               │                  │
│   │    img-src 'self' data: https:                   │                  │
│   ├──────────────────────────────────────────────────┤                  │
│   │  X-Frame-Options: DENY                           │◄── No iframes    │
│   ├──────────────────────────────────────────────────┤                  │
│   │  X-Content-Type-Options: nosniff                 │◄── MIME protect  │
│   ├──────────────────────────────────────────────────┤                  │
│   │  Referrer-Policy: strict-origin-when-cross-origin│◄── Privacy      │
│   └──────────────────────────────────────────────────┘                  │
│                                                                          │
│   ✅ Applied to ALL routes automatically                                │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│  3️⃣  LOGIN ANOMALY DETECTION                                            │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   User Attempts Login                                                   │
│         │                                                                │
│         ▼                                                                │
│   ┌──────────────────┐                                                  │
│   │ Extract IP       │                                                  │
│   │ Extract Device   │                                                  │
│   │ Extract Location │                                                  │
│   └────────┬─────────┘                                                  │
│            │                                                             │
│            ▼                                                             │
│   ┌──────────────────────────────────────────┐                          │
│   │  RISK SCORE CALCULATOR (0-100)           │                          │
│   ├──────────────────────────────────────────┤                          │
│   │  ✓ 5+ failed attempts? ........... +40   │                          │
│   │  ✓ New IP address? ............... +20   │                          │
│   │  ✓ New device? ................... +15   │                          │
│   │  ✓ Impossible travel? ............ +25   │                          │
│   │  ✓ Multiple accounts from IP? .... +30   │                          │
│   └────────┬─────────────────────────────────┘                          │
│            │                                                             │
│       ┌────┴─────┐                                                      │
│       ▼          ▼                                                       │
│   Score < 70   Score >= 70                                              │
│       │            │                                                     │
│   ✅ Allow      ❌ Block                                                 │
│   + Log event  + Log event                                              │
│   + Send alert + Lock account                                           │
│                + Send alert                                              │
│                                                                          │
│   📊 Database: LoginAttempt                                             │
│       • email, ipAddress, userAgent                                      │
│       • successful, failureReason                                        │
│       • deviceInfo, location                                             │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│  4️⃣  WEBAUTHN PASSWORDLESS AUTH                                         │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   REGISTRATION FLOW                  │   AUTHENTICATION FLOW            │
│   ──────────────────                 │   ─────────────────              │
│                                      │                                   │
│   1. User clicks "Add Security Key"  │   1. User enters email           │
│         │                            │         │                         │
│         ▼                            │         ▼                         │
│   2. GET /api/auth/webauthn/register │   2. GET /api/auth/webauthn/     │
│         │                            │      authenticate?email=...       │
│         ▼                            │         │                         │
│   3. Server generates challenge      │   3. Server generates challenge  │
│      (random 32 bytes)               │      (random 32 bytes)            │
│         │                            │         │                         │
│         ▼                            │         ▼                         │
│   4. Browser shows biometric prompt  │   4. Browser shows biometric     │
│      "Touch sensor / Face ID"        │      prompt "Touch sensor"        │
│         │                            │         │                         │
│         ▼                            │         ▼                         │
│   5. Device signs challenge          │   5. Device signs challenge      │
│      with private key                │      with private key             │
│         │                            │         │                         │
│         ▼                            │         ▼                         │
│   6. POST credential to server       │   6. POST signature to server    │
│         │                            │         │                         │
│         ▼                            │         ▼                         │
│   7. Store credential + public key   │   7. Verify signature            │
│         │                            │      Update counter               │
│         ▼                            │         │                         │
│   ✅ Registration complete            │   ✅ Login successful             │
│                                      │                                   │
│   📊 Database: WebAuthnCredential    │   📊 Database: WebAuthnChallenge │
│       • credentialId, publicKey      │       • challenge, expiresAt     │
│       • counter, transports          │       • userId                    │
│       • deviceName, lastUsedAt       │                                   │
│                                      │                                   │
│   Supported Devices:                 │                                   │
│   ✅ Face ID / Touch ID              │                                   │
│   ✅ Windows Hello                   │                                   │
│   ✅ YubiKey / Titan Key             │                                   │
│   ✅ Android Fingerprint             │                                   │
│                                      │                                   │
└──────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│  5️⃣  SECURITY EVENT WEBHOOKS                                            │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   Security Event Occurs                                                 │
│   (password change, login anomaly, etc.)                                │
│         │                                                                │
│         ▼                                                                │
│   ┌──────────────────────┐                                              │
│   │ createSecurityEvent()│                                              │
│   └──────────┬───────────┘                                              │
│              │                                                           │
│              ▼                                                           │
│   ┌─────────────────────────────────────────┐                           │
│   │  1. Store in SecurityEvent table        │                           │
│   │     • eventType, severity               │                           │
│   │     • description, metadata             │                           │
│   │     • userId, ipAddress                 │                           │
│   └──────────┬──────────────────────────────┘                           │
│              │                                                           │
│              ▼                                                           │
│   ┌─────────────────────────────────────────┐                           │
│   │  2. Find active webhooks                │                           │
│   │     • Match event type                  │                           │
│   │     • isActive = true                   │                           │
│   └──────────┬──────────────────────────────┘                           │
│              │                                                           │
│              ▼                                                           │
│   ┌─────────────────────────────────────────┐                           │
│   │  3. Build webhook payload               │                           │
│   │     {                                   │                           │
│   │       eventId, eventType, severity,     │                           │
│   │       description, timestamp,           │                           │
│   │       user: { id, email, name },        │                           │
│   │       metadata, ipAddress               │                           │
│   │     }                                   │                           │
│   └──────────┬──────────────────────────────┘                           │
│              │                                                           │
│              ▼                                                           │
│   ┌─────────────────────────────────────────┐                           │
│   │  4. Sign with HMAC-SHA256 (if secret)   │                           │
│   │     X-Webhook-Signature: sha256=...     │                           │
│   └──────────┬──────────────────────────────┘                           │
│              │                                                           │
│              ▼                                                           │
│   ┌─────────────────────────────────────────┐                           │
│   │  5. POST to webhook URL                 │                           │
│   │     • 10 second timeout                 │                           │
│   │     • Retry on failure                  │                           │
│   └──────────┬──────────────────────────────┘                           │
│              │                                                           │
│         ┌────┴────┐                                                     │
│         ▼         ▼                                                      │
│     Success    Failure                                                   │
│         │         │                                                      │
│         │         ▼                                                      │
│         │    Increment failureCount                                     │
│         │         │                                                      │
│         │    If count >= 10                                             │
│         │         │                                                      │
│         │         ▼                                                      │
│         │    Disable webhook                                            │
│         │                                                                │
│         ▼                                                                │
│   Mark event as notified                                                │
│                                                                          │
│   📊 Integrations:                                                      │
│       ✅ Slack                                                           │
│       ✅ Discord                                                         │
│       ✅ Email (via webhook services)                                   │
│       ✅ Custom endpoints                                                │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│  🔄 COMPLETE AUTHENTICATION FLOW                                        │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   User Attempts Login                                                   │
│         │                                                                │
│         ▼                                                                │
│   ┌─────────────────┐                                                   │
│   │ 1. Extract IP,  │                                                   │
│   │    User-Agent   │                                                   │
│   └────────┬────────┘                                                   │
│            │                                                             │
│            ▼                                                             │
│   ┌──────────────────────────────────┐                                  │
│   │ 2. Check Failed Attempts         │                                  │
│   │    >= 5 in last 15 min?          │                                  │
│   └────────┬─────────────────────────┘                                  │
│            │                                                             │
│       Yes  │  No                                                         │
│       ┌────┴────┐                                                       │
│       ▼         ▼                                                        │
│   Block     Continue                                                     │
│   Account       │                                                        │
│       │         ▼                                                        │
│       │   ┌──────────────────┐                                          │
│       │   │ 3. Verify Creds  │                                          │
│       │   └────────┬─────────┘                                          │
│       │            │                                                     │
│       │       ┌────┴────┐                                               │
│       │       ▼         ▼                                                │
│       │   Invalid    Valid                                              │
│       │       │         │                                                │
│       │       │         ▼                                                │
│       │       │   ┌───────────────────┐                                 │
│       │       │   │ 4. Check Anomaly  │                                 │
│       │       │   │    Risk Score?    │                                 │
│       │       │   └────────┬──────────┘                                 │
│       │       │            │                                             │
│       │       │       ┌────┴────┐                                       │
│       │       │       ▼         ▼                                        │
│       │       │   High Risk  Low Risk                                   │
│       │       │       │         │                                        │
│       ├───────┼───────┘         │                                       │
│       │       │                 ▼                                        │
│       │       │           ┌──────────────┐                              │
│       │       │           │ 5. Check 2FA │                              │
│       │       │           │    (if enabled)│                            │
│       │       │           └──────┬───────┘                              │
│       │       │                  │                                       │
│       │       │             ┌────┴────┐                                 │
│       │       │             ▼         ▼                                  │
│       │       │          Valid    Invalid                               │
│       │       │             │         │                                  │
│       ▼       ▼             ▼         │                                  │
│   ┌──────────────────┐  ┌────────────┴─┐                               │
│   │ Log Failed Login │  │ Log Success  │                               │
│   │ Create Event     │  │ Create Event │                               │
│   │ Send Webhook     │  │ Send Webhook │                               │
│   └──────────────────┘  └──────────────┘                               │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│  📊 DATABASE SCHEMA OVERVIEW                                            │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   User (existing)                                                       │
│   ├── PasswordHistory ──► Tracks last 5 password hashes                 │
│   ├── LoginAttempt ──────► All login attempts (success/fail)            │
│   ├── WebAuthnCredential ► Biometric/key credentials                    │
│   ├── SecurityEvent ─────► Security audit log                           │
│   └── WebAuthnChallenge ─► Temporary auth challenges                    │
│                                                                          │
│   AuditWebhook (existing)                                               │
│   └── Triggers on SecurityEvent creation                                │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│  🎯 SECURITY COVERAGE                                                   │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   Attack Vector              │ Protection                               │
│   ─────────────────────────  │ ─────────────────────────────────────   │
│   Password Reuse             │ ✅ Password History (last 5)             │
│   Brute Force                │ ✅ Account Lockout (5 attempts)          │
│   Credential Stuffing        │ ✅ Anomaly Detection                     │
│   Account Takeover           │ ✅ Login Anomaly + Webhooks              │
│   XSS Attacks                │ ✅ Content-Security-Policy               │
│   Clickjacking               │ ✅ X-Frame-Options: DENY                 │
│   MITM Attacks               │ ✅ HSTS (Force HTTPS)                    │
│   MIME Sniffing              │ ✅ X-Content-Type-Options                │
│   Phishing                   │ ✅ WebAuthn (Phishing-resistant)         │
│   Session Hijacking          │ ✅ Secure Cookies + HTTPS                │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│  🚀 QUICK START                                                         │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   1. npx prisma migrate dev --name add-security-features                │
│   2. npx prisma generate                                                │
│   3. npm run dev                                                        │
│   4. Test features (see ADVANCED-SECURITY-QUICK-REFERENCE.md)           │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

**Visual Guide Version:** 1.0  
**Last Updated:** October 15, 2025
