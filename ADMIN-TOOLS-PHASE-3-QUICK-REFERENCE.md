# Admin Tools Phase 3 - Quick Reference

## 🎯 What Was Built

### 1. Featured Recipes ⭐
- **Feature:** Mark recipes as featured for homepage display
- **Access:** `/admin/recipes` → Recipe dropdown → "Feature/Unfeature"
- **Visual:** Yellow star badge on featured recipe cards
- **Permission:** CONTENT_ADMIN, SUPER_ADMIN

### 2. System Settings ⚙️
- **Feature:** Centralized settings with 4 tabs
- **Access:** `/admin/settings`
- **Tabs:**
  - General (site info, limits, toggles)
  - Voice AI (model, temperature, prompts)
  - API Keys (OpenAI status)
  - Maintenance (mode toggle, message)
- **Permission:** SUPER_ADMIN only

### 3. Maintenance Mode 🔧
- **Feature:** Restrict site to admins during maintenance
- **Toggle:** `/admin/settings` → Maintenance tab
- **User Page:** `/maintenance` (auto-redirect when enabled)
- **Protection:** Client + Middleware + API layers
- **Exempt:** Admins (SUPER_ADMIN, CONTENT_ADMIN, SUPPORT_ADMIN)

### 4. Data Export 📊
- **Feature:** Export analytics and logs to CSV
- **Buttons:**
  - `/admin/analytics` → "Export CSV"
  - `/admin/audit` → "Export CSV"
- **Formats:** Overview, Users, Recipes, Popular Recipes, Audit Logs
- **Permission:** VIEW_ANALYTICS, VIEW_AUDIT_LOGS

---

## 🚀 Quick Start

### Before Testing
```powershell
npx prisma migrate dev --name add_featured_recipes
npx prisma generate
```

### Feature Recipes
1. Go to `/admin/recipes`
2. Find a recipe card
3. Click ⋮ (three dots)
4. Click "Feature" (star icon)
5. See yellow star badge appear

### System Settings
1. Go to `/admin/settings`
2. Click tabs: General | Voice AI | API Keys | Maintenance
3. Update values
4. Click "Save Settings"
5. See success message

### Maintenance Mode
**Enable:**
1. Go to `/admin/settings` → Maintenance tab
2. Toggle "Enable Maintenance Mode" ON
3. Edit custom message
4. Click "Save Settings"
5. Logout to test (you'll see `/maintenance`)

**Disable:**
1. Login as admin
2. Go to `/admin/settings` → Maintenance
3. Toggle OFF
4. Click "Save Settings"

### Export Data
**Analytics:**
1. Go to `/admin/analytics`
2. Click "Export CSV"
3. CSV downloads automatically
4. Open in Excel/Sheets

**Audit Logs:**
1. Go to `/admin/audit`
2. (Optional) Apply filters
3. Click "Export CSV"
4. CSV downloads with current filters

---

## 📁 Key Files

### New APIs
- `/api/admin/recipes/[id]/feature` - Toggle featured
- `/api/admin/settings/general` - General settings
- `/api/admin/settings/maintenance` - Maintenance settings
- `/api/maintenance/status` - Public status check
- `/api/admin/export/analytics` - Export analytics
- `/api/admin/export/audit` - Export audit logs

### New Pages
- `/app/maintenance/page.tsx` - Maintenance page

### Modified Pages
- `/admin/settings` - Now has 4 tabs
- `/admin/recipes` - Feature toggle added
- `/admin/analytics` - Export button added
- `/admin/audit` - Export button added

### Core Updates
- `/middleware.ts` - Maintenance protection
- `/app/layout.tsx` - Maintenance checker
- `schema.prisma` - Featured recipe fields

---

## ⚡ Common Tasks

### Add Featured Recipe
```
Admin → Recipes → (Recipe Card) → ⋮ → Feature
```

### Change Site Name
```
Admin → Settings → General tab → Site Name → Save
```

### Enable Maintenance
```
Admin → Settings → Maintenance tab → Toggle ON → Save
```

### Export All Analytics
```
Admin → Analytics → Export CSV
```

### Export Filtered Audit Logs
```
Admin → Audit → Select Filters → Export CSV
```

---

## 🔍 Troubleshooting

### Featured recipes not working
- Run: `npx prisma migrate dev --name add_featured_recipes`
- Then: `npx prisma generate`
- Restart dev server

### Settings not saving
- Check console for errors
- Verify SUPER_ADMIN role
- Check browser network tab

### Maintenance mode not activating
- Check SystemSetting table
- Clear browser cache
- Verify role (admins are exempt)
- Check console logs

### Export downloads empty file
- Check permission (VIEW_ANALYTICS, VIEW_AUDIT_LOGS)
- Try with filters removed
- Check console for errors
- Verify database has data

---

## 📊 Permissions Quick Reference

| Feature | Permission Required |
|---------|-------------------|
| Feature Recipes | FEATURE_RECIPES |
| View Settings | SUPER_ADMIN |
| Edit Settings | SUPER_ADMIN |
| View Analytics | VIEW_ANALYTICS |
| Export Analytics | VIEW_ANALYTICS |
| View Audit Logs | VIEW_AUDIT_LOGS |
| Export Audit Logs | VIEW_AUDIT_LOGS |

**Roles with Access:**
- SUPER_ADMIN: Everything
- CONTENT_ADMIN: Feature recipes, view analytics
- SUPPORT_ADMIN: View analytics, audit logs

---

## 🎨 UI Elements

### Featured Recipe Badge
```
⭐ Featured
```
Yellow badge with star icon on recipe cards

### Export Button
```
[📥 Export CSV]
```
In page headers, downloads CSV file

### Maintenance Page
Professional page with:
- 🔧 Wrench icon
- Custom message
- Login link
- Auto-refresh

### Settings Tabs
```
[🌐 General] [🎤 Voice AI] [🔑 API Keys] [🔧 Maintenance]
```

---

## 🔄 Workflow Examples

### Publishing Featured Recipe of the Week
1. Admin reviews popular recipes
2. Selects best recipe
3. Clicks Feature in dropdown
4. Recipe appears with star on homepage
5. Next week, unfeatures old recipe
6. Features new recipe

### Scheduled Maintenance
1. Announce maintenance to users
2. Navigate to Settings → Maintenance
3. Write custom message: "We're upgrading! Back in 30 minutes."
4. Enable maintenance mode
5. Perform updates
6. Disable maintenance mode
7. Users automatically redirected back

### Monthly Reports
1. Navigate to Analytics
2. Click "Export CSV"
3. Open in Excel
4. Navigate to Audit
5. Filter by date range
6. Click "Export CSV"
7. Combine for compliance report

---

## 📞 Support

**Documentation:**
- `ADMIN-TOOLS-PHASE-3-COMPLETE.md` - Full details
- `MAINTENANCE-MODE-COMPLETE.md` - Maintenance guide
- `PHASE-3-SESSION-RECAP.md` - Implementation summary

**Common Questions:**
- Q: Can regular users see featured recipes?
  - A: Yes, everyone sees them, only admins can toggle

- Q: Can I schedule maintenance mode?
  - A: Not yet, manual toggle only (future enhancement)

- Q: What's exported in CSV?
  - A: Analytics: users, recipes, stats. Audit: all admin actions

- Q: Can I customize export format?
  - A: Modify `/api/admin/export/*` routes for custom fields

---

**Phase 3: 100% Complete! 🎉**
