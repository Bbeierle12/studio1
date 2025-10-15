# 🔍 Enhanced Audit - Quick Reference Card

## 🚀 Get Started in 2 Minutes

### 1. Run Migration
```bash
npx prisma migrate dev --name add-audit-enhancements
npx prisma generate
```

### 2. Test Enhanced Search
```bash
curl "http://localhost:3000/api/admin/audit/enhanced?quickRange=today&stats=true"
```

### 3. Set Up SIEM (Optional)
```bash
curl -X POST http://localhost:3000/api/admin/audit/webhooks \
  -H "Content-Type: application/json" \
  -d '{"name":"My SIEM","url":"https://siem.example.com","events":["DELETE"]}'
```

---

## 📡 API Endpoints Cheat Sheet

### Enhanced Search & Export
```
GET /api/admin/audit/enhanced
```

**Most Common Parameters:**
```
?quickRange=last7days          # Quick date filter
?search=john@example.com       # Full-text search
?action=DELETE                 # Filter by action
?export=csv                    # Download CSV
?stats=true                    # Include statistics
```

### Investigation Mode
```
GET /api/admin/audit/investigate/{logId}
```

**Returns:** Timeline, related logs, entity details, statistics

### Webhook Management
```
GET    /api/admin/audit/webhooks       # List
POST   /api/admin/audit/webhooks       # Create
PATCH  /api/admin/audit/webhooks       # Update
DELETE /api/admin/audit/webhooks       # Remove
```

---

## ⚡ Quick Range Options

| Range | Description | Example |
|-------|-------------|---------|
| `today` | From midnight today | Today's activity |
| `yesterday` | Full day yesterday | Yesterday's review |
| `last7days` | Past 7 days | Weekly report |
| `last30days` | Past 30 days | Monthly review |
| `last90days` | Past 90 days | Quarterly audit |
| `thisMonth` | Current month from 1st | Month-to-date |
| `lastMonth` | Full previous month | Last month's data |
| `thisYear` | Current year from Jan 1 | Year-to-date |

---

## 🔍 Search Examples

### Find Failed Logins
```
?action=ADMIN_LOGIN&search=failed&quickRange=last7days
```

### Export All Deletions This Month
```
?action=DELETE&quickRange=thisMonth&export=csv
```

### Find Activity by User
```
?userId=cm1234...&quickRange=last30days&stats=true
```

### Investigate Suspicious IP
```
?ipAddress=192.168.1.1&quickRange=today
```

### Full-Text Search Everything
```
?search=recipe&quickRange=last7days
```

---

## 🎯 Investigation Mode Use Cases

### Security Incident Response
1. Find suspicious log in audit list
2. Click "Investigate" button
3. Review:
   - **Timeline:** User's actions ±1 hour
   - **Entity History:** All changes to affected item
   - **IP Activity:** Other actions from same address
   - **User Activity:** Recent behavior pattern

### Pattern Detection
- **Bulk Operations:** See if user performed many similar actions
- **Account Compromise:** Check for unusual IP addresses
- **Data Exfiltration:** Review entity access patterns

---

## 📊 Statistics Breakdown

Enable with `?stats=true`:

```json
{
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
```

---

## 🚨 SIEM Webhook Setup

### Create Webhook
```json
{
  "name": "Splunk SIEM",
  "url": "https://siem.example.com/collector",
  "secret": "your-webhook-secret",
  "events": ["DELETE", "PERMISSION_CHANGE", "ADMIN_LOGIN"]
}
```

### Webhook Payload
```json
{
  "event": "DELETE",
  "timestamp": "2024-01-15T10:30:00Z",
  "log": {
    "id": "cm1234...",
    "userId": "cm5678...",
    "action": "DELETE",
    "entityType": "Recipe",
    "ipAddress": "192.168.1.1"
  }
}
```

### Verify Signature (SIEM Side)
```javascript
const crypto = require('crypto');

function verifyWebhook(payload, signature, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(JSON.stringify(payload));
  const expected = 'sha256=' + hmac.digest('hex');
  return signature === expected;
}
```

---

## 📥 Export Formats

### CSV Export
```
?export=csv
```

Downloads: `audit-logs-2024-01-15T10:30:00.000Z.csv`

**Format:**
```csv
ID,User Email,User Name,Action,Entity Type,Entity ID,IP Address,Created At
cm1234...,admin@example.com,Admin,DELETE,Recipe,cm5678...,192.168.1.1,2024-01-15T10:30:00Z
```

### JSON Export
```
?export=json
```

Downloads: `audit-logs-2024-01-15T10:30:00.000Z.json`

**Format:**
```json
[
  {
    "id": "cm1234...",
    "userEmail": "admin@example.com",
    "userName": "Admin",
    "action": "DELETE",
    "entityType": "Recipe",
    "entityId": "cm5678...",
    "ipAddress": "192.168.1.1",
    "createdAt": "2024-01-15T10:30:00Z"
  }
]
```

---

## 🔒 Permissions Required

| Action | Permission | Role |
|--------|-----------|------|
| View audit logs | `VIEW_AUDIT_LOGS` | ADMIN, SUPER_ADMIN |
| Search & filter | `VIEW_AUDIT_LOGS` | ADMIN, SUPER_ADMIN |
| Export logs | `VIEW_AUDIT_LOGS` | ADMIN, SUPER_ADMIN |
| Investigate | `VIEW_AUDIT_LOGS` | ADMIN, SUPER_ADMIN |
| Manage webhooks | SUPER_ADMIN only | SUPER_ADMIN |

---

## 🧪 Testing Commands

### Test Search
```bash
curl "http://localhost:3000/api/admin/audit/enhanced?search=admin&quickRange=today"
```

### Test Export
```bash
curl "http://localhost:3000/api/admin/audit/enhanced?export=csv" > audit.csv
```

### Test Investigation
```bash
LOG_ID=$(curl "http://localhost:3000/api/admin/audit/enhanced?limit=1" | jq -r '.logs[0].id')
curl "http://localhost:3000/api/admin/audit/investigate/$LOG_ID"
```

### Test Webhook
```bash
# Use webhook.site to see payload
curl -X POST http://localhost:3000/api/admin/audit/webhooks \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","url":"https://webhook.site/YOUR-UNIQUE-ID","events":["DELETE"]}'

# Trigger event
curl -X DELETE http://localhost:3000/api/admin/recipes/test-id

# Check webhook.site
```

---

## 🚨 Troubleshooting

### Webhooks Not Firing
- ✅ Check webhook is active
- ✅ Verify events match action type
- ✅ Ensure failure count < 10
- ✅ Review server logs

### Search Returns Nothing
- ✅ Try broader date range
- ✅ Remove some filters
- ✅ Check search term spelling
- ✅ Use investigation mode to pivot

### TypeScript Errors
- ✅ Run: `npx prisma generate`
- ✅ Restart TypeScript server

---

## 📚 Full Documentation

- **[AUDIT-OPERATIONAL-GUIDE.md](./AUDIT-OPERATIONAL-GUIDE.md)** - Complete usage guide
- **[AUDIT-SYSTEM-COMPLETE.md](./AUDIT-SYSTEM-COMPLETE.md)** - Implementation details
- **[ADMIN-SECURITY-ESSENTIALS.md](./ADMIN-SECURITY-ESSENTIALS.md)** - Security features

---

## ✅ Deployment Checklist

- [ ] Run: `npx prisma migrate dev --name add-audit-enhancements`
- [ ] Run: `npx prisma generate`
- [ ] Test search: `?quickRange=today`
- [ ] Test export: `?export=csv`
- [ ] Test investigation mode
- [ ] Set up SIEM webhooks (if needed)
- [ ] Train admin team on features
- [ ] Monitor webhook health

---

**🎉 Enhanced audit system ready!**

Quick start: Search with `?quickRange=last7days&stats=true`
