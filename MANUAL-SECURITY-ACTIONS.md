# ⚠️ CRITICAL MANUAL SECURITY ACTIONS REQUIRED

## 🚨 COMPLETE THESE IMMEDIATELY AFTER DEPLOYMENT

---

## 1. Change Production Admin Password ⏰ URGENT
**Status**: ✅ **COMPLETED**  
**Priority**: IMMEDIATE  
**Time Required**: 2 minutes

### Steps:
1. ✅ Navigate to: https://craicnkuche.com/settings
2. ✅ Login with:
   - Email: `admin@ourfamilytable.com`
   - Password: `Admin123!` (current default)
3. ✅ Click on "Security" tab
4. ✅ Enter current password: `Admin123!`
5. ✅ Create new password meeting requirements:
   - **12+ characters**
   - **Uppercase letters** (A-Z)
   - **Lowercase letters** (a-z)
   - **Numbers** (0-9)
   - **Special characters** (!@#$%^&*)
6. ✅ Example strong password: `Cr@icK7ch!2025$Admin`
7. ✅ Save and confirm you're logged out
8. ✅ Test login with new password

### ✅ Verification:
- [x] Can no longer log in with `Admin123!`
- [x] Can successfully log in with new password
- [x] ✅ **COMPLETED** - Password successfully changed!

---

## 2. Rotate NEXTAUTH_SECRET ⏰ URGENT
**Status**: ❌ NOT COMPLETED  
**Priority**: IMMEDIATE  
**Time Required**: 5 minutes

### Steps:

#### A. Generate New Secret
1. ✅ Open PowerShell or terminal
2. ✅ Run: `openssl rand -base64 32`
3. ✅ Copy the output (should look like: `abc123XYZ...==`)

#### B. Update in Vercel
1. ✅ Go to: https://vercel.com/dashboard
2. ✅ Navigate to your `studio1` project
3. ✅ Click **Settings** → **Environment Variables**
4. ✅ Find `NEXTAUTH_SECRET`
5. ✅ Click **Edit**
6. ✅ Paste new secret value
7. ✅ Click **Save**

#### C. Redeploy
1. ✅ Go to **Deployments** tab
2. ✅ Click **...** on latest deployment
3. ✅ Click **Redeploy**
4. ✅ Wait for deployment to complete (2-3 minutes)

#### D. Test
1. ✅ Visit https://craicnkuche.com
2. ✅ You should be logged out (expected)
3. ✅ Log back in with admin credentials
4. ✅ Verify everything works

### ⚠️ IMPORTANT NOTES:
- **All users will be logged out** after this change (this is expected)
- Users will need to log in again with their existing passwords
- Sessions are tied to NEXTAUTH_SECRET, so rotation invalidates all sessions
- This is a security best practice after secret exposure

### ✅ Verification:
- [ ] New secret generated
- [ ] NEXTAUTH_SECRET updated in Vercel
- [ ] Application redeployed
- [ ] Successfully logged in after rotation
- [ ] Mark this section as complete: Change ❌ to ✅

---

## 3. Review and Fix Package Vulnerabilities
**Status**: ❌ NOT COMPLETED  
**Priority**: HIGH  
**Time Required**: 10 minutes

### Steps:
1. ✅ Open terminal in project directory
2. ✅ Run: `npm audit`
3. ✅ Review output:
   ```
   Current: 3 vulnerabilities (1 low, 2 moderate)
   ```
4. ✅ Run: `npm audit fix`
5. ✅ If any vulnerabilities remain, run: `npm audit fix --force`
6. ✅ Test application locally: `npm run dev`
7. ✅ Verify no breaking changes
8. ✅ Commit and push: 
   ```bash
   git add package.json package-lock.json
   git commit -m "Fix npm security vulnerabilities"
   git push origin main
   ```

### ✅ Verification:
- [ ] `npm audit` shows 0 vulnerabilities
- [ ] Application runs without errors locally
- [ ] Changes pushed to production
- [ ] Mark this section as complete: Change ❌ to ✅

---

## 4. Update Local Environment (Optional but Recommended)
**Status**: ❌ NOT COMPLETED  
**Priority**: MEDIUM  
**Time Required**: 5 minutes

### Steps:
1. ✅ Open `.env.local` file
2. ✅ Generate new local NEXTAUTH_SECRET:
   ```bash
   openssl rand -base64 32
   ```
3. ✅ Update `NEXTAUTH_SECRET` in `.env.local`
4. ✅ Save file
5. ✅ Restart dev server: `npm run dev`

### ⚠️ NOTE:
- Local and production secrets should be DIFFERENT
- This ensures dev environment can't access production sessions
- Best security practice: never share secrets between environments

### ✅ Verification:
- [ ] Local secret different from production
- [ ] Dev server starts successfully
- [ ] Can log in locally
- [ ] Mark this section as complete: Change ❌ to ✅

---

## 📊 Completion Status

### Overall Progress: 0 / 4 Complete

- [ ] **Admin Password Changed** (CRITICAL)
- [ ] **NEXTAUTH_SECRET Rotated** (CRITICAL)
- [ ] **Package Vulnerabilities Fixed** (HIGH)
- [ ] **Local Environment Updated** (MEDIUM)

---

## 🎯 When All Actions Complete

Once all checkboxes above are marked ✅:

1. Update this file:
   ```markdown
   ### Overall Progress: 4 / 4 Complete ✅
   ```

2. Create a security confirmation:
   - Take a screenshot of successful login with new password
   - Document new NEXTAUTH_SECRET in secure password manager
   - Save `npm audit` clean output

3. Review `SECURITY-FIXES-IMPLEMENTED.md` for final summary

4. **IMPORTANT**: Delete or secure this file - it contains sensitive instructions

---

## 🆘 Emergency Contacts

If you encounter issues:
- **Locked out of admin**: Create new admin with `scripts/create-admin.ts`
- **App won't start**: Check Vercel deployment logs
- **Database issues**: Verify `DATABASE_URL` in Vercel environment variables
- **Secret rotation broke login**: Revert NEXTAUTH_SECRET to previous value temporarily

---

## 📅 Completion Date

**Started**: _________________  
**Completed**: _________________  
**Verified By**: _________________

---

**Last Updated**: January 2025  
**Reference**: SECURITY-FIXES-IMPLEMENTED.md
