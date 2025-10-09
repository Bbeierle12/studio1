# Privacy & Security Compliance Guide
## CCPA, GDPR, and Best Practices

**Last Updated**: October 9, 2025  
**Application**: Our Family Table (studio1)  
**Target Compliance**: CCPA (California), GDPR (EU), General Privacy Best Practices

---

## 📋 Table of Contents
1. [Data We Collect](#data-we-collect)
2. [CCPA Compliance Requirements](#ccpa-compliance-requirements)
3. [GDPR Considerations](#gdpr-considerations)
4. [Security Measures](#security-measures)
5. [Action Items](#action-items)
6. [Privacy Policy Requirements](#privacy-policy-requirements)

---

## 🔍 Data We Collect

### Personal Information (PII)
| Data Type | Purpose | Storage | Retention | CCPA Category |
|-----------|---------|---------|-----------|---------------|
| **Email** | Account identification, login | PostgreSQL (Neon) | Until account deletion | Identifiers |
| **Password** | Authentication | PostgreSQL (bcrypt hashed) | Until changed/deleted | Security credentials |
| **Name** | User profile, display | PostgreSQL | Until account deletion | Identifiers |
| **Avatar URL** | Profile picture | PostgreSQL | Until changed/deleted | Visual identifiers |
| **Bio** | Profile description | PostgreSQL | Until changed/deleted | Personal characteristics |
| **IP Address** | Rate limiting, security | In-memory (temporary) | 1 minute | Internet/network activity |
| **Last Login** | Account activity | PostgreSQL | Until account deletion | Activity information |

### User-Generated Content
| Data Type | Purpose | Storage | User Control |
|-----------|---------|---------|--------------|
| **Recipes** | User's custom recipes | PostgreSQL | ✅ Full CRUD |
| **Meal Plans** | User's meal planning | PostgreSQL | ✅ Full CRUD |
| **Shopping Lists** | User's shopping items | PostgreSQL | ✅ Full CRUD |
| **Nutrition Goals** | User's dietary preferences | PostgreSQL | ✅ Full CRUD |

### Technical Data
| Data Type | Purpose | Storage | Retention |
|-----------|---------|---------|-----------|
| **Session Tokens** | Authentication state | NextAuth (encrypted) | Session expiry |
| **API Keys (OpenAI)** | User's AI features | PostgreSQL (AES-256 encrypted) | Until user removes |
| **Rate Limit Data** | Abuse prevention | In-memory | 1 minute |

### Third-Party Services
| Service | Data Shared | Purpose | Their Privacy Policy |
|---------|-------------|---------|---------------------|
| **OpenAI** | User questions (voice AI) | AI responses | https://openai.com/privacy/ |
| **Neon (PostgreSQL)** | All database data | Data storage | https://neon.tech/privacy-policy |
| **Vercel** | Hosting/deployment data | Application hosting | https://vercel.com/legal/privacy-policy |

---

## 📜 CCPA Compliance Requirements

### Consumer Rights Under CCPA

#### 1. **Right to Know** ✅
Users can request what personal data we collect.

**Implementation Needed:**
```typescript
// Create: src/app/api/user/data-export/route.ts
// Export all user data in JSON format
```

#### 2. **Right to Delete** ⚠️ PARTIAL
Users can delete their account, but we need a proper endpoint.

**Current Status:**
- ✅ Cascade deletes configured in schema
- ❌ No user-facing "Delete My Account" button
- ❌ No data export before deletion

**Action Required:** Create account deletion endpoint

#### 3. **Right to Opt-Out of Sale** ✅ N/A
We don't sell personal information.

#### 4. **Right to Non-Discrimination** ✅
Users aren't charged different prices or denied service for exercising rights.

#### 5. **Notice at Collection** ⚠️ MISSING
Must inform users what data we collect at signup.

**Action Required:** Add privacy notice at registration

---

## 🇪🇺 GDPR Considerations

Even though you're US-based, GDPR applies if you have EU users.

### GDPR Requirements

#### 1. **Lawful Basis** ✅
- **Consent**: User registration = consent
- **Contract**: Necessary for service
- **Legitimate Interest**: Security, fraud prevention

#### 2. **Data Minimization** ✅
We only collect what's necessary.

#### 3. **Right to Access** ⚠️ NEEDS WORK
Users should be able to download their data.

#### 4. **Right to Erasure** ⚠️ NEEDS WORK
"Right to be forgotten" - proper account deletion.

#### 5. **Data Portability** ⚠️ NEEDS WORK
Export data in machine-readable format (JSON).

#### 6. **Privacy by Design** ✅ GOOD
- Passwords hashed
- API keys encrypted
- No unnecessary data collection

---

## 🔒 Security Measures (Current Status)

### ✅ **What You're Doing Right:**

1. **Password Security**
   - ✅ bcrypt hashing
   - ✅ Salt rounds (10)
   - ⚠️ Weak password policy (min 8 chars)

2. **Authentication**
   - ✅ NextAuth with session management
   - ✅ CSRF protection
   - ✅ Secure cookies

3. **Data Encryption**
   - ✅ API keys encrypted (AES-256-GCM)
   - ✅ HTTPS in production
   - ✅ PostgreSQL SSL connections

4. **Access Control**
   - ✅ Role-based access (USER, ADMIN)
   - ✅ Row-level security via userId
   - ✅ Authentication required for AI endpoints

5. **Input Validation**
   - ✅ Zod schema validation
   - ✅ SQL injection protected (Prisma ORM)
   - ✅ XSS protection (React escaping)

6. **Rate Limiting** (NEW!)
   - ✅ 20 requests/min for AI
   - ✅ IP + User ID tracking
   - ✅ Prevents abuse

---

## ⚠️ Security Vulnerabilities to Fix

### 🔴 CRITICAL

#### 1. **Exposed API Key in Code**
Your OpenAI key is now in `.env.local` which is good, but:
- ⚠️ Make sure it's never committed
- ⚠️ Check Git history for exposed keys

**Action:**
```powershell
# Check if key was ever committed:
git log -p --all -S "sk-proj-" | Select-String "sk-proj"
```

#### 2. **No Account Deletion Flow**
Users can't delete their accounts - CCPA violation.

**Action Required:** Create deletion endpoint

### 🟠 HIGH PRIORITY

#### 3. **Weak Password Requirements**
Current: Min 8 characters (any)
Should: 12+ chars, complexity requirements

#### 4. **No Privacy Policy**
Legally required for CCPA/GDPR compliance.

#### 5. **No Terms of Service**
Protect yourself from liability.

#### 6. **No Cookie Consent Banner**
Required if you have EU visitors.

---

## ✅ Action Items (Priority Order)

### **Phase 1: Legal Compliance (CRITICAL)**

#### 1. Create Privacy Policy
```markdown
Required sections:
- What data we collect
- Why we collect it
- Who we share it with (OpenAI, Neon, Vercel)
- User rights (CCPA/GDPR)
- How to contact us
- How to delete account
- Cookie policy
```

#### 2. Create Terms of Service
```markdown
Required sections:
- Acceptable use
- User responsibilities
- Limitation of liability
- Dispute resolution
- Governing law
```

#### 3. Add Privacy Notices
- ✅ At registration
- ✅ At login
- ✅ When using AI features

### **Phase 2: User Rights Implementation**

#### 4. Create Data Export Endpoint
```typescript
// GET /api/user/data-export
// Returns JSON with all user data
```

#### 5. Create Account Deletion Endpoint
```typescript
// DELETE /api/user/account
// Deletes user and all associated data
// Requires password confirmation
```

#### 6. Add Settings UI
- "Download My Data" button
- "Delete My Account" button (with confirmation)

### **Phase 3: Security Hardening**

#### 7. Strengthen Password Policy
```typescript
// Min 12 characters
// At least 1 uppercase, 1 lowercase, 1 number, 1 special
```

#### 8. Add Security Headers
```typescript
// Content-Security-Policy
// X-Frame-Options
// X-Content-Type-Options
```

#### 9. Audit Logging
```typescript
// Log sensitive actions:
// - Account deletion
// - Password changes
// - Role changes
```

---

## 📝 Privacy Policy Requirements

### Must Include (CCPA):

1. **Categories of Personal Information Collected**
   - Identifiers (email, name)
   - Internet activity (IP for rate limiting)
   - User content (recipes, meal plans)

2. **Sources of Personal Information**
   - Directly from users
   - Automatically (IP addresses)

3. **Business Purpose for Collection**
   - Provide meal planning services
   - Authenticate users
   - Prevent abuse
   - AI-powered features

4. **Third Parties We Share With**
   - OpenAI (for AI features)
   - Neon (database hosting)
   - Vercel (application hosting)

5. **Your Rights**
   - Right to know
   - Right to delete
   - Right to opt-out (N/A - we don't sell)
   - Right to non-discrimination

6. **How to Exercise Rights**
   - Email: [your-email]
   - Settings page: Download/Delete data

7. **Data Retention**
   - Until account deletion
   - Backups retained 30 days

8. **Children's Privacy**
   - Not intended for users under 13
   - No knowing collection from children

---

## 🔐 Immediate Actions (Before Committing)

### 1. Check for Exposed Secrets
```powershell
# Scan for API keys in Git history
git log --all --full-history -p -- .env.local

# Check for committed secrets
git log -p --all -S "sk-proj" -S "sk-"
```

### 2. Create Privacy & Legal Pages
- [ ] `src/app/privacy/page.tsx` - Privacy Policy
- [ ] `src/app/terms/page.tsx` - Terms of Service
- [ ] `src/app/cookies/page.tsx` - Cookie Policy

### 3. Add User Rights Endpoints
- [ ] `src/app/api/user/data-export/route.ts` - Export user data
- [ ] `src/app/api/user/delete-account/route.ts` - Delete account

### 4. Update Registration/Login
- [ ] Add "I agree to Terms and Privacy Policy" checkbox
- [ ] Link to privacy policy
- [ ] CCPA notice at collection

### 5. Update Settings Page
- [ ] Add "Download My Data" section
- [ ] Add "Delete My Account" section
- [ ] Show what data we collect

---

## 📞 User Rights Contact

You must provide a way for users to exercise their rights:

**Options:**
1. **Email**: Create privacy@yourdomain.com
2. **Web Form**: Create /privacy-request page
3. **Settings Page**: Self-service download/delete

**Response Time Requirements:**
- CCPA: 45 days (+ 45 day extension if needed)
- GDPR: 30 days (+ 60 day extension if needed)

---

## ✅ Compliance Checklist

### Before Going Live:
- [ ] Privacy Policy published
- [ ] Terms of Service published
- [ ] Cookie Policy published (if applicable)
- [ ] Privacy notice at registration
- [ ] Data export functionality
- [ ] Account deletion functionality
- [ ] Contact method for privacy requests
- [ ] No API keys in Git history
- [ ] Strong password requirements
- [ ] Security headers configured
- [ ] Rate limiting enabled
- [ ] Audit logging for sensitive actions

### Ongoing:
- [ ] Review privacy policy annually
- [ ] Monitor for data breaches
- [ ] Respond to data requests within 45 days
- [ ] Keep security dependencies updated
- [ ] Regular security audits
- [ ] Backup and recovery testing

---

## 🚨 What to Do in Case of Data Breach

### Immediate Response (First 24 Hours):
1. **Contain**: Stop the breach, secure systems
2. **Assess**: What data was exposed?
3. **Document**: Timeline, scope, impact
4. **Notify**: Legal counsel

### Legal Requirements:
- **CCPA**: Notify affected users "without unreasonable delay"
- **GDPR**: Notify supervisory authority within 72 hours
- **State Laws**: Varies by state (California: "without unreasonable delay")

### Who to Notify:
- Affected users (email)
- California Attorney General (if >500 CA residents)
- Data Protection Authority (if EU users)
- Media (if >1000 users affected)

---

## 📚 Resources

### Privacy Law Resources:
- CCPA Full Text: https://oag.ca.gov/privacy/ccpa
- GDPR Full Text: https://gdpr.eu/
- Privacy Policy Generator: https://www.termsfeed.com/
- CCPA Compliance Guide: https://www.onetrust.com/solutions/ccpa-compliance/

### Security Resources:
- OWASP Top 10: https://owasp.org/www-project-top-ten/
- Node.js Security Best Practices: https://nodejs.org/en/docs/guides/security/
- Next.js Security: https://nextjs.org/docs/app/building-your-application/configuring/security-headers

---

## ✅ Summary

**Good News:**
- ✅ You're asking the right questions!
- ✅ Strong authentication already in place
- ✅ Data encryption for API keys
- ✅ Rate limiting implemented
- ✅ Input validation working
- ✅ No data selling

**Needs Work:**
- ⚠️ Privacy Policy (required!)
- ⚠️ Terms of Service (required!)
- ⚠️ Data export endpoint
- ⚠️ Account deletion endpoint
- ⚠️ Stronger password requirements
- ⚠️ Privacy notices at collection

**Priority:** Create Privacy Policy & Terms of Service FIRST, then implement user rights endpoints.

---

**You're on the right track!** Privacy compliance is a journey, not a destination. By thinking about this now, you're already ahead of many developers. 🌟
