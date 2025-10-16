# 🔐 Advanced Security Features - Quick Reference

## Quick Start

### 1. Run Database Migration

```bash
npx prisma migrate dev --name add-security-features
npx prisma generate
```

### 2. Test the Features

All features are automatically integrated into existing authentication flows!

---

## Feature Overview

| Feature | Status | Auto-Integrated |
|---------|--------|-----------------|
| Password History | ✅ | `/api/user/password`, `/api/register` |
| Security Headers | ✅ | All routes (next.config.ts) |
| Login Anomaly Detection | ✅ | `/lib/auth.ts` |
| WebAuthn | ✅ | API routes available |
| Security Webhooks | ✅ | Automatic event logging |

---

## API Endpoints

### Security Webhooks
```bash
# List webhooks (SUPER_ADMIN)
GET /api/security/webhooks

# Create webhook (SUPER_ADMIN)
POST /api/security/webhooks
{
  "name": "Slack Alerts",
  "url": "https://hooks.slack.com/...",
  "events": ["login_anomaly", "password_changed"]
}

# View security events
GET /api/security/events
GET /api/security/events?userId=clx123...
```

### WebAuthn
```bash
# Get registration options
GET /api/auth/webauthn/register

# Register credential
POST /api/auth/webauthn/register
{
  "credentialId": "...",
  "publicKey": "...",
  "transports": ["internal"],
  "deviceName": "My iPhone"
}

# List credentials
GET /api/auth/webauthn/register?action=list

# Delete credential
DELETE /api/auth/webauthn/register?credentialId=...
```

---

## Library Functions

### Password History
```typescript
import { isPasswordReused, addPasswordToHistory } from '@/lib/password-history';

// Check if password was used before
const reused = await isPasswordReused(userId, newPassword);

// Add to history after password change
await addPasswordToHistory(userId, newPassword);
```

### Login Anomaly Detection
```typescript
import { checkLoginAnomaly, logLoginAttempt } from '@/lib/login-anomaly';

// Check for suspicious login
const anomaly = await checkLoginAnomaly(email, ipAddress, userAgent);
// Returns: { isAnomalous, reasons, riskScore, shouldBlock }

// Log login attempt
await logLoginAttempt({
  email,
  ipAddress,
  userAgent,
  successful: true,
  userId: user.id
});
```

### WebAuthn
```typescript
import { 
  generateRegistrationOptions,
  generateAuthenticationOptions,
  verifyAndStoreCredential,
  getUserCredentials
} from '@/lib/webauthn';

// Generate registration options
const options = await generateRegistrationOptions(
  userId,
  userEmail,
  displayName
);

// Get user's credentials
const credentials = await getUserCredentials(userId);
```

### Security Webhooks
```typescript
import { createSecurityEvent } from '@/lib/security-webhooks';

// Log security event (triggers webhooks)
await createSecurityEvent({
  userId: user.id,
  eventType: 'password_changed',
  severity: 'medium',
  description: 'User changed their password',
  ipAddress: '1.2.3.4',
  userAgent: 'Mozilla/5.0...'
});
```

---

## Database Models

### New Tables
- `PasswordHistory` - Stores hashed passwords
- `LoginAttempt` - Tracks all login attempts
- `WebAuthnCredential` - Stores WebAuthn credentials
- `WebAuthnChallenge` - Temporary challenges
- `SecurityEvent` - Security event log

### Updated Tables
- `AuditWebhook` - Already existed, no changes

---

## Configuration

### Password History
```typescript
// src/lib/password-history.ts
const PASSWORD_HISTORY_COUNT = 5; // Number of passwords to track
```

### Login Anomaly Detection
```typescript
// src/lib/login-anomaly.ts
const MAX_FAILED_ATTEMPTS = 5;
const FAILED_ATTEMPT_WINDOW = 15 * 60 * 1000; // 15 minutes
const HIGH_RISK_THRESHOLD = 70; // Block if >= 70
```

### Security Headers
```typescript
// next.config.ts
async headers() {
  return [{
    source: '/(.*)',
    headers: [
      { key: 'Strict-Transport-Security', value: '...' },
      { key: 'Content-Security-Policy', value: '...' },
      // ... more headers
    ]
  }];
}
```

---

## Testing

### Test Password History
```bash
# Change password with new password
curl -X POST http://localhost:9002/api/user/password \
  -H "Content-Type: application/json" \
  -d '{"currentPassword":"old","newPassword":"new123!@#Abc"}'

# Try to reuse same password (should fail)
curl -X POST http://localhost:9002/api/user/password \
  -H "Content-Type: application/json" \
  -d '{"currentPassword":"new123!@#Abc","newPassword":"new123!@#Abc"}'
```

### Test Login Anomaly Detection
```bash
# Multiple failed logins (should trigger lockout)
for i in {1..6}; do
  curl -X POST http://localhost:9002/api/auth/callback/credentials \
    -d "email=test@example.com&password=wrong"
done
```

### Test WebAuthn
```javascript
// In browser console
const response = await fetch('/api/auth/webauthn/register');
const { options } = await response.json();
console.log(options);
```

### Test Security Webhooks
```bash
# Create webhook
curl -X POST http://localhost:9002/api/security/webhooks \
  -H "Content-Type: application/json" \
  -d '{
    "name":"Test Webhook",
    "url":"https://webhook.site/unique-id",
    "events":["password_changed"]
  }'

# Trigger event by changing password
```

---

## Monitoring

### View Login Attempts
```sql
-- Recent failed logins
SELECT * FROM "LoginAttempt"
WHERE successful = false
  AND "createdAt" > NOW() - INTERVAL '1 day'
ORDER BY "createdAt" DESC;
```

### View Security Events
```sql
-- Recent security events
SELECT * FROM "SecurityEvent"
WHERE "createdAt" > NOW() - INTERVAL '1 day'
ORDER BY "createdAt" DESC;
```

### Check Webhook Health
```sql
-- Webhooks with failures
SELECT name, url, "failureCount", "lastTrigger"
FROM "AuditWebhook"
WHERE "failureCount" > 0
ORDER BY "failureCount" DESC;
```

---

## Maintenance

### Cleanup Old Data
```typescript
// Run daily via cron job
import { cleanupOldLoginAttempts } from '@/lib/login-anomaly';
import { cleanupOldSecurityEvents } from '@/lib/security-webhooks';
import { cleanupExpiredChallenges } from '@/lib/webauthn';

await cleanupOldLoginAttempts(90); // 90 days
await cleanupOldSecurityEvents(90); // 90 days
await cleanupExpiredChallenges();
```

---

## Common Issues

### TypeScript Errors
**Solution:** Run Prisma generate after migration
```bash
npx prisma generate
```

### Webhook Not Triggering
**Check:**
1. Is webhook active? (`isActive = true`)
2. Are events configured correctly?
3. Check `failureCount` - may be auto-disabled
4. Verify URL is reachable

### Login Blocked Unexpectedly
**Check:**
1. Review `LoginAttempt` table for risk score
2. Check anomaly detection thresholds
3. Review IP allowlist settings
4. Clear failed attempts if needed

### Password History Not Working
**Check:**
1. Database migration completed?
2. `addPasswordToHistory()` called after password change?
3. Check `PasswordHistory` table

---

## Security Best Practices

✅ **DO:**
- Enable all security headers in production
- Monitor security events regularly
- Set up webhook alerts for critical events
- Test WebAuthn on multiple devices
- Keep password history count at 5-10
- Review login anomalies daily

❌ **DON'T:**
- Store plaintext passwords anywhere
- Disable security headers
- Ignore high-risk login alerts
- Use same signing secret for all webhooks
- Delete security events prematurely

---

## Support

For detailed documentation, see:
- `ADVANCED-SECURITY-FEATURES.md` - Complete implementation guide
- `SECURITY-ESSENTIALS-COMPLETE.md` - Existing security features
- `PRIVACY-COMPLIANCE-GUIDE.md` - Privacy and compliance

---

**Quick Reference Version:** 1.0  
**Last Updated:** October 15, 2025
