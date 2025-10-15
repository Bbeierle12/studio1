# 🚀 Admin Tools Quick Start Guide

## Phase 1 Tools Now Live!

### 🎯 Quick Access
- **Admin Dashboard:** `/admin`
- **User Management:** `/admin/users`
- **Analytics:** `/admin/analytics`
- **Audit Logs:** `/admin/audit`

---

## 👥 User Management

### View Users
1. Navigate to `/admin/users`
2. Browse the user table
3. Use pagination controls at bottom

### Search Users
- Type in search box to find by **name** or **email**
- Results update automatically

### Filter Users
- **By Role:** All, User, Support Admin, Content Admin, Super Admin
- **By Status:** All, Active, Inactive

### View User Details
- Click "View Details" from the actions menu
- See full profile, stats, and recent recipes
- View recipes count, meal plans, favorites

### Manage Individual Users
Click the **⋮** menu for actions:
- **View Details** - Full user profile
- **Suspend** - Deactivate account (CONTENT_ADMIN+)
- **Activate** - Reactivate account (CONTENT_ADMIN+)
- **Delete** - Remove user permanently (SUPER_ADMIN only)

### Bulk Actions
1. Check boxes next to users
2. Bulk action bar appears
3. Choose: **Activate**, **Suspend**, or **Delete**
4. Confirm the action

### Safety Features
- ❌ Cannot delete your own account
- ❌ Cannot change your own role
- ✅ Confirmation required for deletions
- ✅ All actions logged in audit trail

---

## 📊 Analytics Dashboard

### Overview Cards
- **Total Users** - All registered accounts
- **Total Recipes** - Recipes in database
- **Active Users (30d)** - Users who logged in recently
- **Meal Plans** - Active meal planning

### Charts

#### User Growth Chart
- Shows new user signups over 30 days
- Hover for exact counts per day
- Purple line graph

#### Recipe Creation Chart
- Shows recipes created over 30 days
- Hover for daily counts
- Orange line graph

#### Users by Role Pie Chart
- Visual distribution of user roles
- Color-coded by role type
- Shows count for each role

#### Top Recipe Creators
- Leaderboard of top 5 contributors
- Shows name, email, recipe count
- Ranked by total recipes

### Refresh Data
Click **Refresh** button to update all metrics

---

## 🔍 Audit Logs

### View Logs
- Navigate to `/admin/audit`
- Logs are chronological (newest first)
- 20 logs per page

### Filter Options
- **By Action:** CREATE, UPDATE, DELETE, VIEW, Bulk operations
- **By Entity:** User, Recipe, Settings, Feature

### Log Information
Each log shows:
- ⏰ **Time** - When action occurred
- 👤 **User** - Who performed the action
- 🎯 **Action** - What was done
- 📦 **Entity** - What was affected
- 🌐 **IP Address** - Where from

### Security Events
- Highlighted in **yellow**
- Includes: DELETE, SUSPEND, BAN actions
- ⚠️ Warning icon displayed

### View Details
1. Click **👁️ eye icon** on any log
2. See full information:
   - Complete timestamp
   - User details and role
   - Entity type and ID
   - IP address and user agent
   - Before/after changes (for updates)

---

## 🔐 Permissions Reference

### USER (Regular Users)
- ❌ No admin access

### SUPPORT_ADMIN
- ✅ View users
- ✅ View analytics
- ❌ Cannot edit users
- ❌ Cannot view audit logs

### CONTENT_ADMIN
- ✅ View users
- ✅ Edit users (suspend/activate)
- ✅ View analytics
- ✅ View audit logs
- ❌ Cannot delete users
- ❌ Cannot change roles

### SUPER_ADMIN (Full Access)
- ✅ Everything CONTENT_ADMIN can do
- ✅ Delete users
- ✅ Change user roles
- ✅ Export audit logs
- ✅ All system settings

---

## 🎨 UI Tips

### Badges
- **Green** - Active status
- **Gray** - Inactive status
- **Red** - DELETE actions
- **Blue** - UPDATE actions
- **Green** - CREATE actions
- **Purple** - CONTENT_ADMIN role
- **Red** - SUPER_ADMIN role

### Icons
- 👁️ **Eye** - View details
- ⋮ **Three dots** - More actions
- 🔄 **Refresh** - Reload data
- ✓ **Checkbox** - Select for bulk actions
- ⚠️ **Warning** - Security event

---

## ⚡ Keyboard Shortcuts

### Navigation
- `Alt + U` - Go to Users (not yet implemented)
- `Alt + A` - Go to Analytics (not yet implemented)
- `Alt + L` - Go to Audit Logs (not yet implemented)

### Actions
- `Escape` - Close modals/dialogs
- `Enter` - Confirm dialogs
- `Tab` - Navigate form fields

---

## 📱 Mobile Support

All admin tools are **fully responsive**:
- Tables scroll horizontally on mobile
- Filters stack vertically
- Touch-friendly buttons and menus
- Optimized for tablets and phones

---

## 🐛 Troubleshooting

### "Unauthorized" Error
- ✅ Check you're logged in
- ✅ Verify your role (must be admin)
- ✅ Try logging out and back in

### "Failed to fetch" Error
- ✅ Check internet connection
- ✅ Try refreshing the page
- ✅ Check browser console for details

### Missing Data
- ✅ Click Refresh button
- ✅ Check filters aren't too restrictive
- ✅ Verify pagination (might be on wrong page)

### Can't Delete/Edit
- ✅ Check your role permissions
- ✅ Can't modify your own account
- ✅ Deletions require SUPER_ADMIN

---

## 📈 Common Tasks

### Promote User to Admin
1. Go to User Management
2. Find the user (search/filter)
3. Click actions menu (⋮)
4. Select "Edit" (coming soon)
5. OR use API directly:
```bash
PATCH /api/admin/users/[id]
{ "role": "SUPPORT_ADMIN" }
```

### Suspend Multiple Spammers
1. Go to User Management
2. Check boxes next to spam accounts
3. Click "Suspend" in bulk actions
4. Confirm action
5. Check audit log to verify

### Review Today's Activity
1. Go to Audit Logs
2. Logs are sorted newest first
3. Scroll through today's entries
4. Click eye icon for details

### Check User Growth
1. Go to Analytics
2. Look at User Growth chart
3. Hover over chart for details
4. Check "New Users" cards

---

## 💡 Pro Tips

1. **Use Search Wisely**
   - Search by email is more accurate
   - Partial matches work

2. **Filter Before Bulk Actions**
   - Filter to inactive users
   - Select all for bulk cleanup

3. **Audit Log is Your Friend**
   - Check logs before making changes
   - Review logs after bulk operations
   - Filter by your user ID to see your history

4. **Watch the Metrics**
   - Check analytics daily
   - Monitor user growth trends
   - Identify top contributors

5. **Security First**
   - Review security events in audit log
   - Check for suspicious deletions
   - Monitor role changes

---

## 🎯 Next Features (Coming Soon)

- User edit form dialog
- Export users to CSV
- Export audit logs
- Date range filters
- Recipe management
- Advanced search
- Email notifications

---

## 📞 Need Help?

- Review audit logs for error details
- Check browser console (F12)
- Verify permissions
- Contact system administrator

---

**Last Updated:** October 14, 2025  
**Version:** Phase 1 Complete  
**Status:** ✅ Production Ready
