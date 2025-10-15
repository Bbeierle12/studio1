# Database Tools - Quick Visual Reference

## 🎯 Complete Database Tools Dashboard

```
/admin/database
┌─────────────────────────────────────────────────────────────────────┐
│  ← Back to Dashboard                                   [Refresh]    │
│                                                                     │
│  Database Tools                                                     │
│  Database health, statistics, and monitoring                        │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  ✓ Database Health                                           │  │
│  │  Current status and performance metrics                      │  │
│  │                                                               │  │
│  │  [🟢 Server]       [⏱️ Clock]          [💾 HDD]              │  │
│  │   Healthy          145ms              12,345 records         │  │
│  │                                                               │  │
│  │  ✓ Database is operating normally                            │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  📊 Table Statistics                                         │  │
│  │  Record counts for each database table                       │  │
│  │                                                               │  │
│  │  [📋 User]        [🍽️ Recipe]       [⭐ FavoriteRecipe]      │  │
│  │   1,234            5,678             3,456                   │  │
│  │                                                               │  │
│  │  [📅 MealPlan]    [🛒 ShoppingList]  [📝 AuditLog]           │  │
│  │   890              234               12,345                  │  │
│  │                                                               │  │
│  │  [⚙️ Settings]     [🚩 FeatureFlag]   [🎯 NutritionGoal]     │  │
│  │   15               3                 567                     │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌──────────────────────────┐  ┌──────────────────────────┐       │
│  │  ⚡ Cache Management     │  │  ⚙️ Database Optimization│       │
│  │                          │  │                          │       │
│  │  📦 Next.js Cache        │  │  📊 Analyze Tables       │       │
│  │  [Clear]                 │  │  [Run Analysis]          │       │
│  │                          │  │  Updates statistics...   │       │
│  │  🔄 Prisma Query Cache   │  │                          │       │
│  │  [Clear]                 │  │  🔄 Rebuild Indexes      │       │
│  │                          │  │  [Reindex All]           │       │
│  │  ────────────────────    │  │  Optimizes indexes...    │       │
│  │  🗑️ Clear All Caches     │  │                          │       │
│  │  [Clear Everything]      │  │  Last: Oct 15, 11:30 AM  │       │
│  │                          │  └──────────────────────────┘       │
│  │  Last: Oct 15, 12:00 PM  │                                     │
│  └──────────────────────────┘                                     │
│                                                                     │
│  ┌──────────────────────────┐  ┌──────────────────────────┐       │
│  │  💾 System Information   │  │  📊 Performance Metrics  │       │
│  │                          │  │                          │       │
│  │  Prisma:     ^5.0.0      │  │  Pool:      Available    │       │
│  │  Database:   PostgreSQL  │  │  Queries:   145ms        │       │
│  │  Migration:  Oct 15, 3PM │  │  Size:      ~12MB        │       │
│  └──────────────────────────┘  └──────────────────────────┘       │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  💡 Prisma CLI Commands                                      │  │
│  │                                                               │  │
│  │  # Run pending migrations                                    │  │
│  │  npx prisma migrate dev                                      │  │
│  │                                                               │  │
│  │  # Generate Prisma Client                                    │  │
│  │  npx prisma generate                                         │  │
│  │                                                               │  │
│  │  # Open Prisma Studio                                        │  │
│  │  npx prisma studio                                           │  │
│  │                                                               │  │
│  │  # Reset database (caution!)                                 │  │
│  │  npx prisma migrate reset                                    │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🔥 Cache Management Card (Detailed)

```
┌───────────────────────────────────────────┐
│  ⚡ Cache Management                      │
│  Clear application caches to free memory  │
│  and ensure fresh data                    │
├───────────────────────────────────────────┤
│                                           │
│  ┌─────────────────────────────────────┐ │
│  │ 📦 Next.js Cache            [Clear] │ │
│  │ Page and data cache revalidation    │ │
│  └─────────────────────────────────────┘ │
│                                           │
│  ┌─────────────────────────────────────┐ │
│  │ 🔄 Prisma Query Cache       [Clear] │ │
│  │ Database query results cache        │ │
│  └─────────────────────────────────────┘ │
│                                           │
│  ─────────────────────────────────────── │
│                                           │
│  ┌─────────────────────────────────────┐ │
│  │      🗑️ Clear All Caches            │ │
│  └─────────────────────────────────────┘ │
│                                           │
│  Last cleared: Oct 15, 2025 12:00 PM     │
└───────────────────────────────────────────┘
```

**Loading State:**
```
┌───────────────────────────────────────────┐
│  ⚡ Cache Management                      │
├───────────────────────────────────────────┤
│  ┌─────────────────────────────────────┐ │
│  │ 📦 Next.js Cache      [⏳ Clearing] │ │
│  └─────────────────────────────────────┘ │
│                                           │
│  ┌─────────────────────────────────────┐ │
│  │      🗑️ [⏳ Clearing All...]        │ │
│  └─────────────────────────────────────┘ │
└───────────────────────────────────────────┘
```

---

## ⚙️ Database Optimization Card (Detailed)

```
┌───────────────────────────────────────────┐
│  ⚙️ Database Optimization                 │
│  Optimize database performance and        │
│  maintain indexes                         │
├───────────────────────────────────────────┤
│                                           │
│  ┌─────────────────────────────────────┐ │
│  │  📊 Analyze Tables                  │ │
│  └─────────────────────────────────────┘ │
│  Update table statistics for better      │
│  query planning                           │
│                                           │
│  ┌─────────────────────────────────────┐ │
│  │  🔄 Rebuild Indexes                 │ │
│  └─────────────────────────────────────┘ │
│  Rebuild database indexes for optimal    │
│  performance                              │
│                                           │
│  ─────────────────────────────────────── │
│  Last optimized: Oct 15, 2025 11:30 AM   │
└───────────────────────────────────────────┘
```

**After Running Analyze:**
```
┌───────────────────────────────────────────┐
│  ⚙️ Database Optimization                 │
├───────────────────────────────────────────┤
│  ┌─────────────────────────────────────┐ │
│  │  ✓ Analyze Complete (145ms)         │ │
│  └─────────────────────────────────────┘ │
│                                           │
│  Last optimized: Oct 15, 2025 12:15 PM   │
│  ✓ Table statistics updated successfully │
└───────────────────────────────────────────┘
```

---

## 📊 Performance Metrics Card (Detailed)

```
┌───────────────────────────────────────────┐
│  📊 Performance Metrics                   │
│  Database connection and query            │
│  performance                              │
├───────────────────────────────────────────┤
│                                           │
│  ┌─────────────────────────────────────┐ │
│  │ 🔌 Connection Pool                  │ │
│  │ Active connections                  │ │
│  │                        [Available]  │ │
│  └─────────────────────────────────────┘ │
│                                           │
│  ┌─────────────────────────────────────┐ │
│  │ ⚡ Query Performance                │ │
│  │ Average response time               │ │
│  │                            [145ms]  │ │
│  └─────────────────────────────────────┘ │
│                                           │
│  ┌─────────────────────────────────────┐ │
│  │ 💾 Database Size                    │ │
│  │ Approximate storage used            │ │
│  │                             ~12MB   │ │
│  └─────────────────────────────────────┘ │
└───────────────────────────────────────────┘
```

**Performance Badge Colors:**
```
Response Time:
< 100ms:    🟢 Green    (Excellent)
100-1000ms: 🔵 Blue     (Good)
> 1000ms:   🟡 Yellow   (Needs Attention)
```

---

## 🎬 User Flow: Clear All Caches

```
Step 1: Navigate
┌─────────────────────────┐
│ Admin Dashboard         │
│ Click: Database Tools   │
└─────────────────────────┘
            ↓
Step 2: Locate Feature
┌─────────────────────────┐
│ Database Tools Page     │
│ Find: Cache Management  │
└─────────────────────────┘
            ↓
Step 3: Click Button
┌─────────────────────────┐
│ Click: Clear All Caches │
│ [🗑️ Clear All Caches]   │
└─────────────────────────┘
            ↓
Step 4: Loading State
┌─────────────────────────┐
│ [⏳ Clearing All...]    │
│ Spinner animating       │
└─────────────────────────┘
            ↓
Step 5: Success
┌─────────────────────────┐
│ ✓ Success Toast         │
│ "Successfully cleared   │
│  Next.js cache, Prisma  │
│  query cache"           │
└─────────────────────────┘
            ↓
Step 6: Timestamp Updates
┌─────────────────────────┐
│ Last cleared:           │
│ Oct 15, 2025 12:05 PM   │
└─────────────────────────┘
```

---

## 🎬 User Flow: Optimize Database

```
Step 1: Choose Operation
┌──────────────────────────┐
│ Database Optimization    │
│ [ ] Analyze Tables       │
│ [✓] Rebuild Indexes      │
└──────────────────────────┘
            ↓
Step 2: Click Rebuild
┌──────────────────────────┐
│ [🔄 Rebuild Indexes]     │
│ Click button             │
└──────────────────────────┘
            ↓
Step 3: Confirmation (optional)
┌──────────────────────────┐
│ This will briefly lock   │
│ tables. Continue?        │
│  [Cancel]  [Proceed]     │
└──────────────────────────┘
            ↓
Step 4: Processing
┌──────────────────────────┐
│ [⏳ Reindexing...]       │
│ Please wait...           │
│ Tables: 3/10 complete    │
└──────────────────────────┘
            ↓
Step 5: Success
┌──────────────────────────┐
│ ✓ Success!               │
│ "Database indexes        │
│  rebuilt successfully"   │
│ 10 tables, 2847ms        │
└──────────────────────────┘
            ↓
Step 6: Stats Refresh
┌──────────────────────────┐
│ Auto-refresh stats       │
│ Updated metrics shown    │
└──────────────────────────┘
```

---

## 🔔 Toast Notifications

### Success Messages
```
┌─────────────────────────────────────┐
│ ✓ Success                           │
│ Successfully cleared Next.js cache  │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ ✓ Success                           │
│ Database indexes rebuilt            │
│ successfully (10 tables, 2847ms)    │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ ✓ Success                           │
│ Table statistics updated            │
│ successfully (145ms)                │
└─────────────────────────────────────┘
```

### Error Messages
```
┌─────────────────────────────────────┐
│ ✗ Error                             │
│ Failed to clear cache               │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ ⚠️ Warning                          │
│ This operation is PostgreSQL-       │
│ specific. Your database may not     │
│ support it.                         │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ 🔒 Unauthorized                     │
│ Only Super Admins can manage        │
│ database operations                 │
└─────────────────────────────────────┘
```

---

## 🎨 Color Coding & Icons

### Health Status
- 🟢 **Healthy** - Green background, checkmark icon
- 🟡 **Warning** - Yellow background, alert icon
- 🔴 **Error** - Red background, X icon

### Operation States
- ⏳ **Loading** - Spinning loader icon
- ✓ **Success** - Green checkmark
- ✗ **Error** - Red X
- 💡 **Info** - Blue info icon

### Cache Types
- 📦 **Next.js** - Blue package icon
- 🔄 **Prisma** - Purple refresh icon
- 🗑️ **Clear All** - Red trash icon

### Optimization
- 📊 **Analyze** - Blue bar chart icon
- 🔄 **Reindex** - Green refresh icon
- ⚙️ **Settings** - Gray cog icon

---

## 📊 Performance Indicators

### Response Time Badges
```
Excellent (< 100ms):
┌──────────┐
│ 🟢 45ms  │
└──────────┘

Good (100-1000ms):
┌──────────┐
│ 🔵 345ms │
└──────────┘

Slow (> 1000ms):
┌──────────┐
│ 🟡 1.2s  │
└──────────┘
```

### Connection Pool Status
```
Available:
┌────────────────┐
│ 🟢 Available   │
└────────────────┘

Busy:
┌────────────────┐
│ 🟡 Busy (3/5)  │
└────────────────┘

Error:
┌────────────────┐
│ 🔴 Unavailable │
└────────────────┘
```

---

## 🎯 Quick Action Reference

| Action | Button | Duration | Impact |
|--------|--------|----------|--------|
| **Clear Next.js Cache** | [Clear] | < 1s | Next request slower |
| **Clear Prisma Cache** | [Clear] | < 1s | Reconnects DB |
| **Clear All Caches** | [Clear Everything] | < 1s | Both above |
| **Analyze Tables** | [Run Analysis] | ~300ms | No disruption |
| **Rebuild Indexes** | [Reindex All] | 1-5s | Brief table locks |
| **Refresh Stats** | [Refresh] | ~200ms | No impact |

---

## 🔐 Permission Matrix

| Role | View Stats | Clear Cache | Optimize DB |
|------|-----------|-------------|-------------|
| **SUPER_ADMIN** | ✅ | ✅ | ✅ |
| **CONTENT_ADMIN** | ✅ | ❌ | ❌ |
| **SUPPORT_ADMIN** | ✅ | ❌ | ❌ |
| **USER** | ❌ | ❌ | ❌ |

---

## 📱 Responsive Layout

### Desktop (3 columns)
```
┌──────────┐ ┌──────────┐ ┌──────────┐
│ Health   │ │ Stats    │ │ System   │
└──────────┘ └──────────┘ └──────────┘
┌──────────┐ ┌──────────┐
│ Cache    │ │ Optimize │
└──────────┘ └──────────┘
┌──────────┐ ┌──────────┐
│ Metrics  │ │ CLI      │
└──────────┘ └──────────┘
```

### Tablet (2 columns)
```
┌──────────┐ ┌──────────┐
│ Health   │ │ Stats    │
└──────────┘ └──────────┘
┌──────────┐ ┌──────────┐
│ System   │ │ Cache    │
└──────────┘ └──────────┘
┌──────────┐ ┌──────────┐
│ Optimize │ │ Metrics  │
└──────────┘ └──────────┘
┌──────────┐
│ CLI      │
└──────────┘
```

### Mobile (1 column)
```
┌──────────┐
│ Health   │
└──────────┘
┌──────────┐
│ Stats    │
└──────────┘
┌──────────┐
│ System   │
└──────────┘
┌──────────┐
│ Cache    │
└──────────┘
┌──────────┐
│ Optimize │
└──────────┘
┌──────────┐
│ Metrics  │
└──────────┘
┌──────────┐
│ CLI      │
└──────────┘
```

---

**Database Tools - Now with real management power!** 🚀
