# 🔐 Advanced Security Features - Complete Implementation Guide

## Overview

This document covers the implementation of five advanced security features:

1. **Password History Tracking** - Prevents password reuse
2. **Enhanced Security Headers** - CSP, HSTS, and more
3. **Login Anomaly Detection** - Identifies suspicious login patterns
4. **WebAuthn Support** - Passwordless authentication with biometrics
5. **Security Event Webhooks** - Real-time security notifications

---

## 🔑 1. Password History Tracking

### What It Does
- Tracks the last 5 passwords used by each user
- Prevents users from reusing recent passwords
- Automatically cleans up old password history

### Database Schema

```prisma
model PasswordHistory {
  id           String   @id @default(cuid())
  userId       String
  passwordHash String   // Hashed password for comparison
  createdAt    DateTime @default(now())
  
  @@index([userId])
  @@index([createdAt])
}
```

### API Usage

**Check if password was used recently:**
```typescript
import { isPasswordReused } from '@/lib/password-history';

const isReused = await isPasswordReused(userId, newPassword);
if (isReused) {
  // Reject password change
}
```

**Add password to history:**
```typescript
import { addPasswordToHistory } from '@/lib/password-history';

await addPasswordToHistory(userId, newPassword);
```

### Integration Points

✅ **Integrated in `/api/user/password`** - Password change endpoint
✅ **Integrated in `/api/register`** - User registration

### Configuration

```typescript
// In src/lib/password-history.ts
const PASSWORD_HISTORY_COUNT = 5; // Number of previous passwords to track
```

---

## 🛡️ 2. Enhanced Security Headers

### Headers Implemented

| Header | Value | Purpose |
|--------|-------|---------|
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains; preload` | Force HTTPS for 1 year |
| `Content-Security-Policy` | See below | Prevent XSS attacks |
| `X-Frame-Options` | `DENY` | Prevent clickjacking |
| `X-Content-Type-Options` | `nosniff` | Prevent MIME sniffing |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Control referrer info |
| `Permissions-Policy` | `camera=(), microphone=(self)` | Control browser features |

### Content Security Policy (CSP)

```javascript
// next.config.ts
{
  key: 'Content-Security-Policy',
  value: [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://va.vercel-scripts.com",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https: blob:",
    "font-src 'self' data:",
    "connect-src 'self' https://api.openai.com https://api.openweathermap.org",
    "media-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join('; '),
}
```

### Testing Security Headers

```bash
# Check headers with curl
curl -I https://your-domain.com

# Or use online tools
https://securityheaders.com
https://observatory.mozilla.org
```

---

## 🚨 3. Login Anomaly Detection

### What It Detects

1. **Too many failed login attempts** (5+ in 15 minutes)
2. **Login from new IP address**
3. **Login from new device/browser**
4. **Impossible travel** (rapid location changes)
5. **Multiple accounts from same IP**

### Database Schema

```prisma
model LoginAttempt {
  id            String   @id @default(cuid())
  userId        String?  // Null if user not found
  email         String
  ipAddress     String
  userAgent     String?
  successful    Boolean
  failureReason String?  // "invalid_password", "account_locked", etc.
  location      Json?    // { country, city, lat, lng }
  deviceInfo    Json?    // { browser, os, device }
  createdAt     DateTime @default(now())
  
  @@index([userId])
  @@index([email])
  @@index([ipAddress])
  @@index([createdAt])
}
```

### Risk Scoring

The system assigns a risk score (0-100):

- **0-30**: Normal login
- **31-69**: Medium risk (log event, allow login)
- **70+**: High risk (block login, require additional verification)

### API Usage

```typescript
import { checkLoginAnomaly, logLoginAttempt } from '@/lib/login-anomaly';

// Check for anomalies
const anomaly = await checkLoginAnomaly(email, ipAddress, userAgent);

if (anomaly.shouldBlock) {
  // Block high-risk logins
  throw new Error('Suspicious login detected');
}

// Log the attempt
await logLoginAttempt({
  email,
  ipAddress,
  userAgent,
  successful: true,
  userId: user.id,
});
```

### Integration Points

✅ **Integrated in `/lib/auth.ts`** - NextAuth authorize callback
✅ **Integrated in `/api/register`** - User registration
✅ **Integrated in `/api/user/password`** - Password changes

### Configuration

```typescript
// In src/lib/login-anomaly.ts
const MAX_FAILED_ATTEMPTS = 5;
const FAILED_ATTEMPT_WINDOW = 15 * 60 * 1000; // 15 minutes
const HIGH_RISK_THRESHOLD = 70; // Block if risk score >= 70
```

### Cleanup

Old login attempts are automatically cleaned up:

```typescript
import { cleanupOldLoginAttempts } from '@/lib/login-anomaly';

// Run periodically (e.g., daily cron job)
await cleanupOldLoginAttempts(90); // Delete attempts older than 90 days
```

---

## 🔐 4. WebAuthn (Passwordless Authentication)

### What It Enables

- **Biometric authentication** (Face ID, Touch ID, Windows Hello)
- **Security key support** (YubiKey, Titan Key)
- **Platform authenticators** (built-in device security)
- **Multi-device credentials**

### Database Schema

```prisma
model WebAuthnCredential {
  id            String   @id @default(cuid())
  userId        String
  credentialId  String   @unique
  publicKey     String
  counter       BigInt   @default(0)
  transports    String[] // ["usb", "nfc", "ble", "internal"]
  deviceName    String?
  createdAt     DateTime @default(now())
  lastUsedAt    DateTime?
  
  @@index([userId])
}

model WebAuthnChallenge {
  id        String   @id @default(cuid())
  userId    String?
  challenge String   @unique
  expiresAt DateTime
  createdAt DateTime @default(now())
  
  @@index([challenge])
  @@index([userId])
}
```

### Registration Flow

```typescript
// 1. Generate registration options
const response = await fetch('/api/auth/webauthn/register');
const { options } = await response.json();

// 2. Call WebAuthn API
const credential = await navigator.credentials.create({
  publicKey: options
});

// 3. Send credential to server
await fetch('/api/auth/webauthn/register', {
  method: 'POST',
  body: JSON.stringify({
    credentialId: credential.id,
    publicKey: credential.response.publicKey,
    transports: credential.response.getTransports(),
    deviceName: 'My iPhone'
  })
});
```

### Authentication Flow

```typescript
// 1. Generate authentication options
const response = await fetch('/api/auth/webauthn/authenticate?email=user@example.com');
const { options } = await response.json();

// 2. Call WebAuthn API
const assertion = await navigator.credentials.get({
  publicKey: options
});

// 3. Verify signature
await fetch('/api/auth/webauthn/authenticate', {
  method: 'POST',
  body: JSON.stringify({
    email: 'user@example.com',
    credentialId: assertion.id,
    signature: assertion.response.signature,
    counter: assertion.response.counter
  })
});
```

### API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/auth/webauthn/register` | GET | Get registration options |
| `/api/auth/webauthn/register` | POST | Register new credential |
| `/api/auth/webauthn/register` | DELETE | Remove credential |
| `/api/auth/webauthn/authenticate` | GET | Get authentication options |
| `/api/auth/webauthn/authenticate` | POST | Verify authentication |

### Security Features

- ✅ **Replay protection** via signature counter
- ✅ **Challenge-based** authentication
- ✅ **5-minute challenge expiration**
- ✅ **One-time use challenges**
- ✅ **User verification** required

---

## 📡 5. Security Event Webhooks

### What It Does

- Sends real-time notifications for security events
- Supports multiple webhook endpoints
- Automatic retry with exponential backoff
- HMAC signature verification
- Event filtering

### Database Schema

```prisma
model SecurityEvent {
  id          String   @id @default(cuid())
  userId      String?
  eventType   String   // "password_changed", "2fa_enabled", etc.
  severity    String   // "low", "medium", "high", "critical"
  description String
  metadata    Json?
  ipAddress   String?
  userAgent   String?
  notified    Boolean  @default(false)
  createdAt   DateTime @default(now())
  
  @@index([userId])
  @@index([eventType])
  @@index([severity])
}

model AuditWebhook {
  id           String   @id @default(cuid())
  name         String
  url          String
  secret       String?  // For HMAC signing
  events       String[] // Event types to listen for
  isActive     Boolean  @default(true)
  lastTrigger  DateTime?
  failureCount Int      @default(0)
  createdAt    DateTime @default(now())
  
  @@index([isActive])
}
```

### Event Types

```typescript
type SecurityEventType =
  | 'password_changed'
  | 'password_reset_requested'
  | '2fa_enabled'
  | '2fa_disabled'
  | 'login_success'
  | 'login_failed'
  | 'login_anomaly'
  | 'account_locked'
  | 'account_unlocked'
  | 'webauthn_added'
  | 'webauthn_removed'
  | 'role_changed'
  | 'account_deleted'
  | 'suspicious_activity';
```

### Creating Webhooks

```typescript
// POST /api/security/webhooks
await fetch('/api/security/webhooks', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: 'Slack Notifications',
    url: 'https://hooks.slack.com/services/YOUR/WEBHOOK/URL',
    secret: 'your-signing-secret', // Optional
    events: ['login_anomaly', 'account_locked', 'password_changed']
  })
});
```

### Triggering Events

```typescript
import { createSecurityEvent } from '@/lib/security-webhooks';

await createSecurityEvent({
  userId: user.id,
  eventType: 'password_changed',
  severity: 'medium',
  description: 'User password was changed',
  metadata: { changedBy: 'user' },
  ipAddress: '192.168.1.1',
  userAgent: 'Mozilla/5.0...'
});
```

### Webhook Payload

```json
{
  "eventId": "clx123...",
  "eventType": "login_anomaly",
  "severity": "high",
  "description": "Suspicious login activity detected",
  "timestamp": "2025-10-15T10:30:00Z",
  "user": {
    "id": "user123",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "USER"
  },
  "metadata": {
    "reasons": ["Login from new IP", "New device detected"],
    "riskScore": 75
  },
  "ipAddress": "203.0.113.42",
  "userAgent": "Mozilla/5.0..."
}
```

### Verifying Webhook Signatures

```typescript
import crypto from 'crypto';

function verifySignature(payload: any, signature: string, secret: string): boolean {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(JSON.stringify(payload));
  const expectedSignature = `sha256=${hmac.digest('hex')}`;
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

// In your webhook handler
const signature = request.headers.get('X-Webhook-Signature');
const isValid = verifySignature(payload, signature, 'your-secret');
```

### API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/security/webhooks` | GET | List all webhooks |
| `/api/security/webhooks` | POST | Create webhook |
| `/api/security/webhooks` | PATCH | Update webhook |
| `/api/security/webhooks` | DELETE | Delete webhook |
| `/api/security/events` | GET | View security events |

### Auto-Disable

Webhooks are automatically disabled after 10 consecutive failures to prevent unnecessary retries.

---

## 🚀 Migration Guide

### 1. Run Database Migration

```bash
# Generate Prisma migration
npx prisma migrate dev --name add-security-features

# Or in production
npx prisma migrate deploy
```

### 2. Update Environment Variables

Add to `.env`:
```env
# Optional: Custom configuration
PASSWORD_HISTORY_COUNT=5
MAX_FAILED_LOGIN_ATTEMPTS=5
LOGIN_ANOMALY_THRESHOLD=70
```

### 3. Test Security Features

```typescript
// Test password history
const isReused = await isPasswordReused(userId, 'MyPassword123!');

// Test anomaly detection
const anomaly = await checkLoginAnomaly('user@example.com', '1.2.3.4', 'Mozilla/5.0...');

// Test WebAuthn
const options = await generateRegistrationOptions(userId, 'user@example.com', 'John Doe');

// Test webhooks
await createSecurityEvent({
  eventType: 'password_changed',
  severity: 'medium',
  description: 'Test event'
});
```

---

## 📊 Monitoring & Analytics

### View Security Events

```typescript
// Get user's security events
const events = await getUserSecurityEvents(userId, 50);

// Get all recent events (admin only)
const allEvents = await getRecentSecurityEvents(100);
```

### Login Attempt Analytics

```sql
-- Failed login attempts by email
SELECT email, COUNT(*) as attempts
FROM "LoginAttempt"
WHERE successful = false
  AND "createdAt" > NOW() - INTERVAL '24 hours'
GROUP BY email
ORDER BY attempts DESC;

-- Login attempts by IP
SELECT "ipAddress", COUNT(*) as attempts
FROM "LoginAttempt"
WHERE "createdAt" > NOW() - INTERVAL '24 hours'
GROUP BY "ipAddress"
ORDER BY attempts DESC;
```

### Security Event Analytics

```sql
-- Events by type
SELECT "eventType", severity, COUNT(*) as count
FROM "SecurityEvent"
WHERE "createdAt" > NOW() - INTERVAL '7 days'
GROUP BY "eventType", severity
ORDER BY count DESC;

-- High severity events
SELECT *
FROM "SecurityEvent"
WHERE severity = 'critical'
  AND "createdAt" > NOW() - INTERVAL '30 days'
ORDER BY "createdAt" DESC;
```

---

## 🧹 Maintenance Tasks

### Cleanup Old Data

Run these periodically (e.g., daily cron job):

```typescript
import { cleanupOldLoginAttempts } from '@/lib/login-anomaly';
import { cleanupOldSecurityEvents } from '@/lib/security-webhooks';
import { cleanupExpiredChallenges } from '@/lib/webauthn';

// Delete login attempts older than 90 days
await cleanupOldLoginAttempts(90);

// Delete security events older than 90 days
await cleanupOldSecurityEvents(90);

// Delete expired WebAuthn challenges
await cleanupExpiredChallenges();
```

---

## 🔒 Security Best Practices

### Password History
- ✅ Store hashed passwords only
- ✅ Limit history to 5-10 passwords
- ✅ Clean up old history automatically
- ❌ Never store plaintext passwords

### Login Anomaly Detection
- ✅ Use multiple signals (IP, device, timing)
- ✅ Implement gradual risk scoring
- ✅ Log all attempts for forensics
- ✅ Send alerts for high-risk logins
- ❌ Don't rely on a single indicator

### WebAuthn
- ✅ Require user verification
- ✅ Use challenge-response protocol
- ✅ Implement replay protection
- ✅ Allow multiple credentials per user
- ❌ Don't use as sole authentication method initially

### Security Webhooks
- ✅ Use HMAC signatures
- ✅ Implement retry logic
- ✅ Filter events appropriately
- ✅ Monitor webhook failures
- ❌ Don't include sensitive data in payloads

---

## 📝 Summary

All five security features have been successfully implemented:

✅ **Password History Tracking** - Prevents password reuse
✅ **Enhanced Security Headers** - CSP, HSTS, and comprehensive protection
✅ **Login Anomaly Detection** - Identifies and blocks suspicious logins
✅ **WebAuthn Support** - Modern passwordless authentication
✅ **Security Event Webhooks** - Real-time security notifications

### Files Created/Modified

**Library Files:**
- `src/lib/password-history.ts` (106 lines)
- `src/lib/login-anomaly.ts` (276 lines)
- `src/lib/webauthn.ts` (303 lines)
- `src/lib/security-webhooks.ts` (347 lines)

**API Routes:**
- `src/app/api/security/webhooks/route.ts`
- `src/app/api/security/events/route.ts`
- `src/app/api/auth/webauthn/register/route.ts`
- `src/app/api/auth/webauthn/authenticate/route.ts`

**Modified Files:**
- `prisma/schema.prisma` (added 5 new models)
- `next.config.ts` (added CSP and HSTS headers)
- `src/lib/auth.ts` (integrated anomaly detection)
- `src/app/api/user/password/route.ts` (added password history)
- `src/app/api/register/route.ts` (added login logging)

### Next Steps

1. Run database migration
2. Test all features in development
3. Configure webhooks for production monitoring
4. Set up cleanup cron jobs
5. Monitor security events dashboard

---

**Documentation Version:** 1.0  
**Last Updated:** October 15, 2025  
**Author:** Security Team
