# 🔍 Enhanced Audit System - Complete Operational Guide

## 📊 Overview

The enhanced audit system transforms basic logging into a comprehensive security operations platform with:

- **Full-text search** across all log fields
- **Date/time filters** with quick ranges (today, last 7 days, etc.)
- **CSV/JSON export** for external analysis
- **SIEM webhooks** with HMAC signatures
- **Investigation mode** that pivots from a log to related context

---

## 🚀 Quick Start

### 1. Run Database Migration

```bash
npx prisma migrate dev --name add-audit-enhancements
npx prisma generate
```

### 2. Access Enhanced Audit Logs

Navigate to: `/admin/audit` (with enhanced UI)

### 3. Set Up SIEM Integration

Navigate to: `/admin/audit/webhooks` to configure webhooks

---

## 📡 API Endpoints

### Enhanced Search & Export
```
GET /api/admin/audit/enhanced
```

**Query Parameters:**

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `page` | number | Page number (default: 1) | `?page=2` |
| `limit` | number | Results per page (default: 20) | `?limit=50` |
| `search` | string | Full-text search | `?search=john@example.com` |
| `quickRange` | string | Date range preset | `?quickRange=last7days` |
| `startDate` | ISO 8601 | Custom start date | `?startDate=2024-01-01T00:00:00Z` |
| `endDate` | ISO 8601 | Custom end date | `?endDate=2024-01-31T23:59:59Z` |
| `userId` | string | Filter by user ID | `?userId=cm1234...` |
| `action` | string | Filter by action | `?action=DELETE` |
| `entityType` | string | Filter by entity | `?entityType=Recipe` |
| `ipAddress` | string | Filter by IP | `?ipAddress=192.168.1.1` |
| `export` | string | Export format | `?export=csv` or `?export=json` |
| `stats` | boolean | Include statistics | `?stats=true` |

**Quick Range Options:**
- `today` - From midnight today
- `yesterday` - Full day yesterday
- `last7days` - Past 7 days
- `last30days` - Past 30 days
- `last90days` - Past 90 days
- `thisMonth` - Current month from 1st
- `lastMonth` - Full previous month
- `thisYear` - Current year from Jan 1

**Response:**
```json
{
  "logs": [
    {
      "id": "cm1234...",
      "userId": "cm5678...",
      "user": {
        "email": "admin@example.com",
        "name": "Admin User"
      },
      "action": "DELETE",
      "entityType": "Recipe",
      "entityId": "cm9012...",
      "changes": { "title": "Deleted Recipe" },
      "ipAddress": "192.168.1.1",
      "userAgent": "Mozilla/5.0...",
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "totalCount": 150,
    "totalPages": 8
  },
  "statistics": {
    "actionBreakdown": {
      "CREATE": 50,
      "UPDATE": 75,
      "DELETE": 25
    },
    "entityBreakdown": {
      "Recipe": 100,
      "User": 30,
      "Category": 20
    },
    "topUsers": [
      { "userId": "cm1234...", "count": 45 }
    ],
    "topIPs": [
      { "ipAddress": "192.168.1.1", "count": 120 }
    ]
  }
}
```

### Investigation Mode
```
GET /api/admin/audit/investigate/{logId}
```

Pivots from a single log to comprehensive context:

**Response:**
```json
{
  "log": { /* Original log */ },
  "relatedByUser": [
    /* Other logs by same user within 1 hour */
  ],
  "relatedByEntity": [
    /* All logs for same entity */
  ],
  "relatedByIP": [
    /* Recent logs from same IP */
  ],
  "recentUserActivity": [
    /* Last 20 actions by user */
  ],
  "entityDetails": {
    /* Full entity data if still exists */
  },
  "statistics": {
    "totalLogsByUser": 45,
    "totalLogsByIP": 120,
    "totalLogsByEntity": 8
  }
}
```

### Webhook Management
```
GET    /api/admin/audit/webhooks       # List all webhooks
POST   /api/admin/audit/webhooks       # Create webhook
PATCH  /api/admin/audit/webhooks       # Update webhook
DELETE /api/admin/audit/webhooks       # Delete webhook
```

**Create Webhook Request:**
```json
{
  "name": "Splunk SIEM",
  "url": "https://siem.example.com/webhooks/audit",
  "secret": "your-webhook-secret-key",
  "events": ["DELETE", "ADMIN_LOGIN", "PERMISSION_CHANGE"]
}
```

**Webhook Payload (sent to SIEM):**
```json
{
  "event": "DELETE",
  "timestamp": "2024-01-15T10:30:00Z",
  "log": {
    "id": "cm1234...",
    "userId": "cm5678...",
    "action": "DELETE",
    "entityType": "Recipe",
    "entityId": "cm9012...",
    "changes": { "title": "Deleted Recipe" },
    "ipAddress": "192.168.1.1"
  }
}
```

**HMAC Signature (in headers):**
```
X-Audit-Signature: sha256=abc123...
X-Audit-Timestamp: 2024-01-15T10:30:00Z
```

---

## 💻 Usage Examples

### Example 1: Search for Failed Login Attempts
```typescript
const response = await fetch('/api/admin/audit/enhanced?' + new URLSearchParams({
  action: 'ADMIN_LOGIN',
  search: 'failed',
  quickRange: 'last7days',
  stats: 'true'
}));
```

### Example 2: Export All Deletions This Month
```typescript
const response = await fetch('/api/admin/audit/enhanced?' + new URLSearchParams({
  action: 'DELETE',
  quickRange: 'thisMonth',
  export: 'csv'
}));

const blob = await response.blob();
const url = window.URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = `deletions-${new Date().toISOString()}.csv`;
a.click();
```

### Example 3: Investigate Suspicious Activity
```typescript
// User clicks "Investigate" on a suspicious log
const logId = 'cm1234...';
const context = await fetch(`/api/admin/audit/investigate/${logId}`).then(r => r.json());

// Show timeline of user's actions
console.log('User activity:', context.relatedByUser);

// Show all changes to the entity
console.log('Entity history:', context.relatedByEntity);

// Show activity from same IP
console.log('IP activity:', context.relatedByIP);
```

### Example 4: Create SIEM Webhook
```typescript
await fetch('/api/admin/audit/webhooks', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Splunk SIEM',
    url: 'https://siem.example.com/audit',
    secret: 'your-secret',
    events: ['DELETE', 'PERMISSION_CHANGE', 'ADMIN_LOGIN']
  })
});
```

---

## 🎯 Common Use Cases

### Security Investigation
1. **Suspicious deletion detected**
   - Use investigation mode to see user's recent activity
   - Check if same IP performed other suspicious actions
   - Review full history of deleted entity

2. **Unusual login pattern**
   - Search for `ADMIN_LOGIN` actions
   - Filter by IP or user
   - Export to CSV for analysis

### Compliance Reporting
1. **Quarterly access audit**
   - Use `quickRange=last90days`
   - Include `stats=true` for summary
   - Export to JSON for processing

2. **GDPR data request**
   - Filter by specific user ID
   - Export all actions as JSON
   - Review entity changes

### Real-time Monitoring
1. **Set up SIEM integration**
   - Create webhook for critical events
   - Configure events: `DELETE`, `PERMISSION_CHANGE`, `CONFIG_UPDATE`
   - Monitor for auto-disable (10 consecutive failures)

---

## 🔧 Advanced Configuration

### Webhook Retry Logic

Webhooks automatically retry with exponential backoff:
- 1st retry: 1 second delay
- 2nd retry: 2 seconds delay
- 3rd retry: 4 seconds delay

After 10 consecutive failures, webhook auto-disables.

### Performance Tuning

**For large datasets (>100K logs):**
- Use specific filters to narrow results
- Limit exports to date ranges
- Consider archiving old logs

**Search optimization:**
- Full-text search indexes: `user.email`, `user.name`, `entityId`, `ipAddress`, `userAgent`
- Quick ranges use database indexes on `createdAt`

### Security Considerations

**SIEM Webhooks:**
- Always use HTTPS URLs
- Provide a strong secret for HMAC validation
- Rotate secrets periodically
- Monitor failure counts

**Export Controls:**
- Exports limited to 10,000 records
- Only SUPER_ADMIN can export sensitive data
- All exports logged in audit trail

---

## 📈 Statistics API

Get comprehensive statistics:

```typescript
const stats = await fetch('/api/admin/audit/enhanced?stats=true&quickRange=last30days')
  .then(r => r.json());

console.log('Actions:', stats.statistics.actionBreakdown);
// { CREATE: 150, UPDATE: 300, DELETE: 50 }

console.log('Most active user:', stats.statistics.topUsers[0]);
// { userId: "cm1234...", count: 200 }
```

---

## 🛡️ Permissions

| Action | Required Permission | Notes |
|--------|-------------------|-------|
| View audit logs | `VIEW_AUDIT_LOGS` | ADMIN or SUPER_ADMIN |
| Export audit logs | `VIEW_AUDIT_LOGS` | Limited to 10K records |
| Investigate logs | `VIEW_AUDIT_LOGS` | Shows related context |
| Manage webhooks | SUPER_ADMIN only | Full CRUD access |

---

## 🧪 Testing

### Test Full-Text Search
```bash
# Create test data
curl -X POST http://localhost:3000/api/admin/recipes \
  -H "Content-Type: application/json" \
  -d '{"title": "Test Recipe"}'

# Search for it
curl "http://localhost:3000/api/admin/audit/enhanced?search=Test+Recipe"
```

### Test Investigation Mode
```bash
# Get a log ID
LOG_ID=$(curl "http://localhost:3000/api/admin/audit/enhanced?limit=1" | jq -r '.logs[0].id')

# Investigate
curl "http://localhost:3000/api/admin/audit/investigate/$LOG_ID"
```

### Test Webhook
```bash
# Create webhook
curl -X POST http://localhost:3000/api/admin/audit/webhooks \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test SIEM",
    "url": "https://webhook.site/your-unique-id",
    "events": ["DELETE"]
  }'

# Trigger event
curl -X DELETE http://localhost:3000/api/admin/recipes/test-id

# Check webhook.site for payload
```

---

## 🚨 Troubleshooting

### Webhooks Not Firing
1. Check webhook is active: `GET /api/admin/audit/webhooks`
2. Verify events match action type
3. Check failure count < 10
4. Review server logs for errors

### Search Not Finding Results
1. Verify search term matches exact values
2. Try broader date range
3. Check filters aren't too restrictive
4. Use investigation mode to find related logs

### Export Timeout
1. Reduce date range
2. Add more specific filters
3. Export in smaller batches

---

## 📚 Related Documentation

- [Security Essentials](./ADMIN-SECURITY-ESSENTIALS.md) - 2FA, IP allowlist, CSRF
- [Audit Log Reference](./AUDIT-LOG-REFERENCE.md) - Action types, entity types
- [Admin Permissions](./ADMIN-PERMISSIONS-GUIDE.md) - Role-based access

---

## ✅ Next Steps

1. **Run migration**: `npx prisma migrate dev`
2. **Test search**: Try quick ranges and filters
3. **Set up SIEM**: Configure webhooks for critical events
4. **Train team**: Show investigation mode for security incidents
5. **Monitor**: Check webhook health regularly

---

**🎉 Your audit system is now fully operational!**
