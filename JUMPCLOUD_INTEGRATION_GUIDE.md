# JumpCloud Integration Guide for SparrowVision

This guide will help you set up real-time data integration between JumpCloud and SparrowVision IGA platform.

## Prerequisites

- JumpCloud Administrator account
- JumpCloud Organization with active users
- SparrowVision v2.0 deployed and running

## Step 1: Generate JumpCloud API Key

1. **Log into JumpCloud Admin Console**
   - Navigate to https://console.jumpcloud.com
   - Sign in with your administrator account

2. **Access API Settings**
   - Go to Settings → API Settings
   - Or navigate to: Settings → General Settings → API

3. **Generate API Key**
   - Click "Generate New API Key"
   - Give it a descriptive name: "SparrowVision IGA Integration"
   - Set expiration (recommended: 1 year)
   - **Copy and securely store the API key** - you won't be able to see it again

## Step 2: Get Organization ID

1. **In JumpCloud Admin Console**
   - Go to Settings → Organization
   - Copy your Organization ID from the page

## Step 3: Configure Required API Permissions

The API key needs the following permissions:

### Required Scopes:
- **System Users** - Read access
- **User Groups** - Read access  
- **Organization** - Read access
- **Directory Insights** - Read access (for activity data)

### API Endpoints Used:
- `GET /systemusers` - Fetch all users
- `GET /systemusers/{user_id}` - Get specific user details
- `GET /usergroups` - Fetch user groups
- `GET /organizations/{org_id}` - Verify organization access

## Step 4: Configure SparrowVision

1. **Access Users Section**
   - Login to SparrowVision
   - Navigate to Users section

2. **Click "Configure JumpCloud"**
   - You'll see a "Not Connected" status
   - Click the "Configure JumpCloud" button

3. **Enter Configuration Details**
   - **API Key**: Paste your JumpCloud API key
   - **Organization ID**: Enter your JumpCloud Organization ID
   - **API Base URL**: Keep default `https://console.jumpcloud.com/api`

4. **Test Connection**
   - Click "Test Connection" button
   - Wait for successful connection confirmation
   - Fix any errors that appear

5. **Save Configuration**
   - Once connection test passes, click "Save Configuration"
   - The integration is now active

## Step 5: Sync Data

1. **Manual Sync**
   - Click "Sync JumpCloud" button
   - Wait for sync completion
   - Review synchronized user data

2. **Automatic Sync** (Future Enhancement)
   - Set sync schedule (hourly, daily)
   - Configure sync notifications via Slack

## Data Synchronization

### User Data Synced:
- ✅ User ID and Email
- ✅ First and Last Name
- ✅ Department and Job Title
- ✅ Manager Information
- ✅ Employee Status (Active/Suspended)
- ✅ Last Login Activity
- ✅ Group Memberships
- ✅ Profile Information

### Access Data Synced:
- ✅ System Access Permissions
- ✅ Application Access Rights
- ✅ Group-based Access Rules
- ✅ Last Access Timestamps
- ✅ Access Status (Active/Inactive)

## API Rate Limits

JumpCloud API has the following limits:
- **Standard Plan**: 100 requests per minute
- **Business Plan**: 1000 requests per minute
- **Enterprise Plan**: Custom limits

SparrowVision automatically handles rate limiting and will queue requests accordingly.

## Security Best Practices

1. **API Key Security**
   - Store API keys securely
   - Rotate keys regularly (every 6-12 months)
   - Use dedicated service account in JumpCloud
   - Monitor API key usage in JumpCloud logs

2. **Network Security**
   - Ensure HTTPS for all API calls
   - Implement IP whitelisting if possible
   - Use VPN for additional security layer

3. **Data Handling**
   - All user data is encrypted in transit
   - Sensitive data is hashed/encrypted at rest
   - Audit logs track all data access
   - GDPR/CCPA compliance maintained

## Troubleshooting

### Common Issues:

**1. "API Key Invalid" Error**
- Verify API key was copied correctly
- Check if API key has expired
- Ensure API key has required permissions

**2. "Organization ID Not Found"**
- Verify Organization ID is correct
- Ensure API key has organization read access

**3. "Connection Timeout"**
- Check network connectivity
- Verify firewall allows HTTPS to console.jumpcloud.com
- Try testing from different network

**4. "Rate Limit Exceeded"**
- Wait and retry - SparrowVision will handle this automatically
- Consider upgrading JumpCloud plan for higher limits

**5. "Permission Denied"**
- Review API key permissions in JumpCloud
- Ensure all required scopes are granted

### Support

For technical support:
- **SparrowVision Support**: it-admin@surveysparrow.com
- **JumpCloud Documentation**: https://docs.jumpcloud.com/api/
- **JumpCloud Support**: https://support.jumpcloud.com

## API Documentation References

- **JumpCloud API v1**: https://docs.jumpcloud.com/api/1.0/
- **JumpCloud API v2**: https://docs.jumpcloud.com/api/2.0/
- **System Users Endpoint**: https://docs.jumpcloud.com/api/1.0/#operation/systemusers_list
- **Authentication**: https://docs.jumpcloud.com/api/1.0/#section/Authentication

## Version History

- **v2.0**: Initial JumpCloud integration support
- **v2.1**: Enhanced error handling and rate limiting
- **v2.2**: Automatic sync scheduling (planned)

---

*This integration enables real-time user data synchronization between JumpCloud and SparrowVision, ensuring your access reviews are always based on the most current user information.*
