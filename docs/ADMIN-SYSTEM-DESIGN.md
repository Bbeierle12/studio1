# Admin Account System Design

## Overview
Admin account system for "Our Family Table" with advanced settings, user management, and content moderation capabilities.

## Admin Privileges & Features

### 1. **User Management**
- View all registered users
- View user activity and statistics
- Edit user details (name, email, role)
- Promote/demote users to/from admin
- Suspend or delete user accounts
- Reset user passwords
- View user login history
- Export user data

### 2. **Recipe Management**
- View all recipes (including private ones)
- Edit any recipe
- Delete any recipe
- Bulk recipe operations
- Feature recipes on homepage
- Approve/reject submitted recipes
- Move recipes between collections
- View recipe statistics (views, saves, ratings)
- Export recipe data

### 3. **Content Moderation**
- Review flagged content
- Moderate recipe comments/reviews
- Ban inappropriate content
- Set content visibility (public/private/archived)
- Bulk content operations

### 4. **System Settings**
- Configure application settings
- Manage API keys (OpenAI, Weather, etc.)
- Set rate limits
- Configure email templates
- Manage feature flags
- Set maintenance mode
- Configure backup schedules

### 5. **Analytics & Reporting**
- User growth statistics
- Recipe engagement metrics
- Popular ingredients/dishes
- Search analytics
- System performance metrics
- Generate custom reports
- Export analytics data

### 6. **Collections Management**
- View all collections (public and private)
- Create/edit/delete any collection
- Feature collections
- Manage collection categories
- Bulk collection operations

### 7. **Tags & Categories**
- Manage recipe tags
- Create/edit/delete categories
- Merge duplicate tags
- Set tag hierarchies
- Bulk tag operations

### 8. **Shopping List Management**
- View aggregated shopping list data
- Identify popular ingredients
- Manage ingredient database
- Set ingredient categories

### 9. **Security & Audit**
- View audit logs
- Monitor security events
- Manage API access tokens
- Configure authentication settings
- View failed login attempts
- Export security logs

### 10. **Database Management**
- Run database migrations
- View database statistics
- Perform database backups
- Execute safe database queries
- Monitor database health

## Admin Roles Hierarchy

### Super Admin (Level 1)
- All privileges
- Manage other admins
- System configuration
- Database access

### Content Admin (Level 2)
- Recipe management
- Content moderation
- User profile editing
- Collections management

### Support Admin (Level 3)
- View user data
- View recipes
- Basic support functions
- No deletion privileges

## Implementation Strategy

### Database Schema Changes

```prisma
// Add to schema.prisma
enum UserRole {
  USER
  SUPPORT_ADMIN
  CONTENT_ADMIN
  SUPER_ADMIN
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  password  String
  role      UserRole @default(USER)
  isActive  Boolean  @default(true)
  lastLogin DateTime?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // ... existing fields
}

model AuditLog {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  action      String
  entityType  String   // User, Recipe, Collection, etc.
  entityId    String?
  changes     Json?
  ipAddress   String?
  userAgent   String?
  createdAt   DateTime @default(now())
  
  @@index([userId])
  @@index([createdAt])
  @@index([entityType])
}

model SystemSetting {
  id        String   @id @default(cuid())
  key       String   @unique
  value     String
  category  String
  description String?
  updatedBy String
  updatedAt DateTime @updatedAt
  
  @@index([category])
}

model FeatureFlag {
  id          String   @id @default(cuid())
  name        String   @unique
  enabled     Boolean  @default(false)
  description String?
  rolloutPercentage Int @default(100)
  updatedAt   DateTime @updatedAt
}
```

## Admin Dashboard Pages

### `/admin` - Overview Dashboard
- User count and growth
- Recipe statistics
- Recent activity feed
- System health status
- Quick actions

### `/admin/users` - User Management
- User list with search/filter
- User details modal
- Edit user form
- Activity logs
- Bulk actions

### `/admin/recipes` - Recipe Management
- Recipe list with filters
- Edit/delete recipes
- Feature recipes
- Bulk operations
- Recipe analytics

### `/admin/content` - Content Moderation
- Flagged content queue
- Review interface
- Bulk approval/rejection
- Content reports

### `/admin/collections` - Collections Management
- All collections view
- Create/edit collections
- Feature collections
- Bulk operations

### `/admin/settings` - System Settings
- General settings
- API configuration
- Email settings
- Feature flags
- Security settings

### `/admin/analytics` - Analytics Dashboard
- User metrics
- Recipe engagement
- Search analytics
- Custom reports
- Data export

### `/admin/audit` - Audit Logs
- Activity timeline
- Filter by user/action/date
- Security events
- Export logs

### `/admin/database` - Database Tools
- Statistics
- Backup/restore
- Migrations status
- Health checks

## Security Considerations

### Access Control
1. **Role-Based Access Control (RBAC)**
   - Check user role on every admin route
   - Middleware protection for admin pages
   - API route guards

2. **Audit Logging**
   - Log all admin actions
   - Track who, what, when, where
   - Immutable audit trail

3. **Session Management**
   - Admin sessions expire faster (30 min)
   - Re-authentication for sensitive actions
   - Session activity monitoring

4. **Rate Limiting**
   - Stricter limits for admin endpoints
   - Prevent abuse of bulk operations

### Admin Action Confirmations
- Delete operations require confirmation
- Bulk operations require review
- System-wide changes require password re-entry

## UI/UX Design

### Admin Navigation
```
Sidebar:
├── 📊 Dashboard
├── 👥 Users
├── 🍳 Recipes
├── 📚 Collections
├── 🏷️  Tags & Categories
├── 🚨 Content Moderation
├── 📈 Analytics
├── ⚙️  Settings
├── 🔒 Security & Audit
└── 🗄️  Database
```

### Admin Badge
- Show admin badge on user avatar
- Different colors for admin levels
- Admin indicator in header

### Quick Stats Cards
```
┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│ 👥 Users    │ │ 🍳 Recipes  │ │ 📚 Collections │ │ 🔄 Active   │
│   1,234     │ │   5,678     │ │     89       │ │     156     │
│   +12 today │ │   +34 today │ │   +2 today   │ │   users now │
└─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘
```

## Implementation Priority

### Phase 1 (Essential)
1. Add role field to User model
2. Create admin middleware
3. Basic admin dashboard
4. User management page
5. Recipe management page

### Phase 2 (Important)
1. Audit logging system
2. System settings page
3. Content moderation
4. Analytics dashboard

### Phase 3 (Advanced)
1. Advanced analytics
2. Database tools
3. Custom reports
4. Automated actions

## API Endpoints

### User Management
```
GET    /api/admin/users              - List all users
GET    /api/admin/users/:id          - Get user details
PUT    /api/admin/users/:id          - Update user
DELETE /api/admin/users/:id          - Delete user
POST   /api/admin/users/:id/role     - Change user role
POST   /api/admin/users/:id/suspend  - Suspend user
```

### Recipe Management
```
GET    /api/admin/recipes            - List all recipes
PUT    /api/admin/recipes/:id        - Update recipe
DELETE /api/admin/recipes/:id        - Delete recipe
POST   /api/admin/recipes/:id/feature - Feature recipe
POST   /api/admin/recipes/bulk       - Bulk operations
```

### System Settings
```
GET    /api/admin/settings           - Get all settings
PUT    /api/admin/settings/:key      - Update setting
GET    /api/admin/settings/category/:cat - Get category settings
```

### Analytics
```
GET    /api/admin/analytics/users    - User analytics
GET    /api/admin/analytics/recipes  - Recipe analytics
GET    /api/admin/analytics/export   - Export data
```

### Audit Logs
```
GET    /api/admin/audit              - Get audit logs
GET    /api/admin/audit/:id          - Get specific log
POST   /api/admin/audit/export       - Export logs
```

## Best Practices

1. **Always Log Admin Actions**
   - Every admin action creates audit log entry
   - Include before/after values for changes

2. **Require Confirmation for Destructive Actions**
   - Delete operations
   - Bulk modifications
   - System-wide changes

3. **Limit Admin Access**
   - Principle of least privilege
   - Grant minimum necessary permissions
   - Regular access reviews

4. **Monitor Admin Activity**
   - Alert on suspicious admin actions
   - Track admin login patterns
   - Flag unusual bulk operations

5. **Backup Before Bulk Operations**
   - Auto-backup before major changes
   - Allow rollback of bulk operations

## Testing Requirements

### Unit Tests
- Role-based access control
- Admin action validation
- Audit log creation

### Integration Tests
- Admin workflows
- User management flows
- Content moderation flows

### Security Tests
- Authorization bypass attempts
- Privilege escalation tests
- Audit log integrity

## Success Metrics

1. **Admin Efficiency**
   - Time to complete common tasks
   - Number of clicks for actions

2. **Security**
   - No unauthorized access
   - 100% audit coverage
   - No privilege escalation

3. **User Management**
   - User resolution time
   - Support ticket reduction

4. **Content Quality**
   - Moderation queue size
   - Time to moderate content
   - Content quality scores

---

**Next Steps**: Implement Phase 1 features starting with database schema updates.
