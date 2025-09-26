# 🔗 JumpCloud Integration Setup Guide

## Step 1: Get Your JumpCloud API Key

### 1.1 Access JumpCloud Admin Console
1. **Go to:** https://console.jumpcloud.com
2. **Log in** with your JumpCloud admin account
3. **Navigate to:** Settings > API Settings (or use the search bar to find "API")

### 1.2 Generate API Key
1. **Click** "Generate New API Key"
2. **Name your key:** "SparrowVision IGA Integration"
3. **Set permissions:** Read access to Users and Groups (minimum required)
4. **Copy the API Key** - Save it securely (you'll need this for SparrowVision)
5. **Optional:** Note your Organization ID if you have multiple orgs

### 1.3 Required Permissions
Your API key needs these permissions:
- ✅ **Read Users** - To fetch user directory
- ✅ **Read User Groups** - To get user roles/groups
- 🔧 **Optional:** Write permissions if you want to update users from SparrowVision

---

## Step 2: Configure JumpCloud in SparrowVision

### 2.1 Access SparrowVision
1. **Go to:** https://sparrowvision-iga.netlify.app
2. **Login:** admin@surveysparrow.com / admin123
3. **Navigate to:** Users section (left sidebar)

### 2.2 Configure JumpCloud Integration
1. **Look for:** "JumpCloud Integration Status" section
2. **Click:** "Configure JumpCloud" button
3. **Enter:**
   - **API Key:** Paste your JumpCloud API key
   - **Organization ID:** (Optional) Your JumpCloud org ID
   - **Base URL:** Leave as default (https://console.jumpcloud.com/api)

### 2.3 Test Connection
1. **Click:** "Test Connection" button
2. **Wait** for connection test (5-10 seconds)
3. **Success:** You should see "✅ Connected" status
4. **Error:** Check your API key and permissions

### 2.4 Save Configuration
1. **Click:** "Save Configuration" button
2. **Verify:** Configuration is saved and status shows "Connected"

---

## Step 3: Sync Users from JumpCloud

### 3.1 Initial Sync
1. **In the Users section,** look for "JumpCloud Sync" section
2. **Click:** "Sync JumpCloud Users" button
3. **Wait:** For sync to complete (may take 1-2 minutes for large directories)
4. **Review:** Sync results showing users created/updated

### 3.2 Verify Sync Results
1. **Check:** User list is populated with JumpCloud users
2. **Verify:** User details (name, email, department, status)
3. **Confirm:** Sync timestamp and user counts are accurate

---

## Step 4: Ongoing Management

### 4.1 Automatic Sync (Recommended)
- **SparrowVision** will sync users every 6 hours automatically
- **Manual sync** available anytime via "Sync Users" button

### 4.2 User Management
- **View:** All JumpCloud users in the Users section
- **Search:** Filter by name, email, department, status
- **Review:** User access across all integrated tools
- **Track:** Exit employees and their access

---

## 🧪 Testing Your Integration

### Test These Features:
1. **✅ Connection Test:** JumpCloud API responds successfully
2. **✅ User Sync:** Users are imported from JumpCloud
3. **✅ Status Mapping:** Active/suspended status correctly mapped
4. **✅ User Details:** All user fields populated correctly
5. **✅ Dashboard:** JumpCloud users show in dashboard metrics

### Expected Results:
- **User Count:** Should match your JumpCloud directory size
- **Status Accuracy:** Active/suspended users correctly identified
- **Exit Employees:** Properly flagged for access review
- **Sync History:** Available in audit logs

---

## ⚠️ Troubleshooting

### Common Issues:

**❌ "Invalid API Key"**
- Verify API key is correct and complete
- Check API key hasn't expired
- Ensure sufficient permissions

**❌ "Connection Timeout"**
- Check internet connection
- Verify JumpCloud service is available
- Try again in a few minutes

**❌ "No Users Found"**
- Verify API key has read permissions for users
- Check if Organization ID is correct (if using multi-org)
- Ensure users exist in your JumpCloud directory

**❌ "Sync Failed"**
- Check backend logs for detailed error
- Verify database connection is healthy
- Try manual sync with smaller batch size

### Get Help:
- **JumpCloud Docs:** https://docs.jumpcloud.com/api/1.0/
- **Backend Logs:** Check Railway logs for detailed errors
- **Frontend Console:** Check browser console for API errors

---

## 🎯 Success Indicators

✅ **Connection:** "Connected" status in JumpCloud config
✅ **User Sync:** Users appear in SparrowVision user list
✅ **Data Accuracy:** User details match JumpCloud directory
✅ **Status Sync:** Active/suspended status correctly reflected
✅ **Dashboard:** JumpCloud metrics visible in dashboard
✅ **Audit Trail:** Sync events logged in audit logs

When all indicators are green, your **JumpCloud integration is fully operational!** 🚀

---

## 🔐 Security Notes

- **API Key Storage:** Keys are securely stored in backend database
- **Permissions:** Use minimum required permissions (read-only recommended)
- **Audit Trail:** All sync activities are logged for compliance
- **Data Protection:** User data follows ISO 27001 compliance standards
