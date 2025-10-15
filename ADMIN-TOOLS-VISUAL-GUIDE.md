# Admin Tools - Visual Quick Reference

## 🎯 Complete Admin Dashboard

```
┌─────────────────────────────────────────────────────────────┐
│                    ADMIN DASHBOARD                          │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   👥 Users   │  │  🍽️ Recipes  │  │  📊 Analytics│     │
│  │  Management  │  │  Management  │  │   Dashboard  │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  📋 Audit    │  │  🚩 Feature  │  │  ⚙️ System   │     │
│  │    Logs      │  │    Flags ✨  │  │   Settings   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐                        │
│  │  💾 Database │  │  📥 Data     │                        │
│  │   Tools ✨   │  │   Export     │                        │
│  └──────────────┘  └──────────────┘                        │
└─────────────────────────────────────────────────────────────┘
```

✨ = New Features (Feature Flags & Database Tools)

---

## 🚩 Feature Flags Page

### Layout
```
/admin/features
┌─────────────────────────────────────────────────────────────┐
│  ← Back to Dashboard              [Refresh] [+ New Flag]    │
│                                                             │
│  Feature Flags                                              │
│  Enable or disable features across the application          │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  🚩 All Feature Flags                               │   │
│  │  3 feature flags configured                         │   │
│  │                                                     │   │
│  │  Feature | Description | Status | Rollout % | Actions│   │
│  │  ───────────────────────────────────────────────────│   │
│  │  🚩 dark_mode                                       │   │
│  │  Enable dark theme    [✓ Enabled] 100%  [Edit][Del]│   │
│  │                                                     │   │
│  │  🚩 ai_recipes                                      │   │
│  │  AI recipe generation [  Disabled]  50%  [Edit][Del]│   │
│  │                                                     │   │
│  │  🚩 social_sharing                                  │   │
│  │  Share to social      [✓ Enabled]  75%  [Edit][Del]│   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Create/Edit Dialog
```
┌──────────────────────────────────────┐
│  Create Feature Flag            [X]  │
├──────────────────────────────────────┤
│  Add a new feature flag to control  │
│  application features                │
│                                      │
│  Feature Name                        │
│  ┌────────────────────────────────┐ │
│  │ dark_mode                      │ │
│  └────────────────────────────────┘ │
│  Use lowercase with underscores      │
│                                      │
│  Description                         │
│  ┌────────────────────────────────┐ │
│  │ Enable dark theme UI across    │ │
│  │ the application                │ │
│  └────────────────────────────────┘ │
│                                      │
│  Enabled          [ON/OFF Switch]    │
│  Enable or disable immediately       │
│                                      │
│  Rollout Percentage        75%       │
│  ├────────────●──────────┤           │
│  0%                    100%          │
│  Gradually roll out to users         │
│                                      │
│              [Cancel] [Create Flag]  │
└──────────────────────────────────────┘
```

### Actions
- **Toggle Switch**: Quick enable/disable
- **Edit Button**: Modify description/rollout
- **Delete Button**: Remove flag (with confirmation)
- **Refresh**: Reload flag list

---

## 💾 Database Tools Page

### Layout
```
/admin/database
┌─────────────────────────────────────────────────────────────┐
│  ← Back to Dashboard                         [Refresh]      │
│                                                             │
│  Database Tools                                             │
│  Database health, statistics, and monitoring                │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  ✓ Database Health                                  │   │
│  │  Current status and performance metrics             │   │
│  │                                                     │   │
│  │  [🟢 Server]     [⏱️ Clock]      [💾 HDD]          │   │
│  │   Healthy        145ms         12,345 records      │   │
│  │                                                     │   │
│  │  Database is operating normally                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  📊 Table Statistics                                │   │
│  │  Record counts for each database table              │   │
│  │                                                     │   │
│  │  [📋 User]           [🍽️ Recipe]        [⭐ Fav]   │   │
│  │   1,234 records      5,678 records     3,456       │   │
│  │                                                     │   │
│  │  [📅 MealPlan]       [🛒 Shopping]     [📝 Audit]  │   │
│  │   890 records        234 records       12,345      │   │
│  │                                                     │   │
│  │  [⚙️ Settings]       [🚩 Flags]        [🎯 Goals]  │   │
│  │   15 records         3 records         567         │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  💾 System Information                              │   │
│  │  Database configuration and version details         │   │
│  │                                                     │   │
│  │  Prisma Version      ^5.0.0                        │   │
│  │  Database Provider   PostgreSQL                     │   │
│  │  Last Migration      Jan 15, 2025 3:45 PM          │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  ℹ️ Database Management                             │   │
│  │                                                     │   │
│  │  For migrations and schema changes, use Prisma CLI: │   │
│  │                                                     │   │
│  │  # Run pending migrations                           │   │
│  │  npx prisma migrate dev                             │   │
│  │                                                     │   │
│  │  # Reset database (caution!)                        │   │
│  │  npx prisma migrate reset                           │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Health Status Colors
- 🟢 **Healthy** (< 1000ms): Green badge
- 🟡 **Warning** (1000-5000ms): Yellow badge
- 🔴 **Error** (> 5000ms): Red badge

---

## 🔐 Permission Matrix

| Feature | SUPER_ADMIN | CONTENT_ADMIN | SUPPORT_ADMIN | USER |
|---------|-------------|---------------|---------------|------|
| **Feature Flags** |
| View Flags | ✅ | ❌ | ❌ | ❌ |
| Create Flags | ✅ | ❌ | ❌ | ❌ |
| Edit Flags | ✅ | ❌ | ❌ | ❌ |
| Delete Flags | ✅ | ❌ | ❌ | ❌ |
| **Database Tools** |
| View Stats | ✅ | ❌ | ❌ | ❌ |
| Health Monitor | ✅ | ❌ | ❌ | ❌ |

---

## 📋 User Flows

### Creating a Feature Flag
```
1. Navigate to /admin/features
   └─> Only SUPER_ADMIN sees the button
   
2. Click "+ New Flag" button
   └─> Dialog opens
   
3. Fill in form:
   ├─> name: "new_feature" (required, unique)
   ├─> description: "Brief description" (optional)
   ├─> enabled: true/false (default: false)
   └─> rolloutPercentage: 0-100 (default: 100)
   
4. Click "Create Flag"
   ├─> Validation (name format check)
   ├─> API call to POST /api/admin/features
   ├─> Audit log created
   └─> Success toast shown
   
5. Flag appears in table
   └─> Can toggle, edit, or delete
```

### Toggling a Feature Flag
```
1. In /admin/features, find flag in table
   
2. Click the switch next to flag name
   ├─> Immediate UI update
   └─> API call to PUT /api/admin/features/[id]
   
3. Backend updates flag.enabled
   ├─> Audit log entry created
   └─> Response confirms change
   
4. Toast notification appears
   └─> "Feature enabled/disabled"
```

### Monitoring Database Health
```
1. Navigate to /admin/database
   └─> Only SUPER_ADMIN sees the button
   
2. Page loads automatically
   ├─> API call to GET /api/admin/database/stats
   ├─> Measures response time
   └─> Counts all table records
   
3. Display updates:
   ├─> Health status (color-coded)
   ├─> Response time in ms
   ├─> Total record count
   ├─> Individual table counts
   └─> System information
   
4. Click "Refresh" to update
   └─> Fetches latest stats
```

---

## 🎨 Color Coding

### Feature Flags
- **Enabled Badge**: Blue background, white text
- **Disabled Badge**: Gray background, gray text
- **Enabled with ✓**: Green checkmark icon

### Database Health
- **Healthy**: Green icon + badge
- **Warning**: Yellow icon + badge
- **Error**: Red icon + badge

### Table Cards
- **User**: Blue accent
- **Recipe**: Purple accent
- **System**: Orange accent

---

## 🔔 Notifications

### Success Messages
- ✅ "Feature flag created successfully"
- ✅ "Feature flag updated successfully"
- ✅ "Feature flag deleted successfully"
- ✅ "Feature enabled"
- ✅ "Feature disabled"

### Error Messages
- ❌ "Failed to fetch feature flags"
- ❌ "Failed to save feature flag"
- ❌ "A feature flag with this name already exists"
- ❌ "Feature name must be lowercase with underscores"
- ❌ "Failed to fetch database statistics"
- ❌ "Unauthorized. Only Super Admins can access this."

---

## 🧪 Testing Checklist

### Feature Flags
- [ ] Navigate to /admin/features as SUPER_ADMIN
- [ ] Create new flag "test_feature"
- [ ] Verify flag appears in table
- [ ] Toggle flag on/off
- [ ] Edit flag description
- [ ] Change rollout percentage
- [ ] Delete flag with confirmation
- [ ] Check audit logs for all actions
- [ ] Try accessing as non-SUPER_ADMIN (should be blocked)

### Database Tools
- [ ] Navigate to /admin/database as SUPER_ADMIN
- [ ] Verify health status displays
- [ ] Check all table counts are accurate
- [ ] Confirm response time is reasonable
- [ ] Click refresh button
- [ ] Verify system info shows correct Prisma version
- [ ] Check audit log for access
- [ ] Try accessing as non-SUPER_ADMIN (should be blocked)

---

## 📱 Responsive Design

Both pages are fully responsive:
- **Desktop**: 3-column grid for stats
- **Tablet**: 2-column grid
- **Mobile**: Single column, stacked cards

---

## 🚀 Quick Commands

```bash
# Navigate to features
https://yourapp.com/admin/features

# Navigate to database tools
https://yourapp.com/admin/database

# API endpoints
GET    /api/admin/features           # List flags
POST   /api/admin/features           # Create flag
PUT    /api/admin/features/[id]      # Update flag
DELETE /api/admin/features/[id]      # Delete flag
GET    /api/admin/database/stats     # Get DB stats
```

---

**All Admin Tools Complete!** 🎉  
No more 404 errors in the admin dashboard.
