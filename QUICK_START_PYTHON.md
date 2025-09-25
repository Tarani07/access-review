# Quick Start Guide - Python IGA Integration

Get started with the SparrowVision Python IGA integration in 5 minutes.

## 🚀 Quick Setup

### 1. Environment Setup
```bash
# Clone/download the files
# Set up your environment variables
cp config.env.example .env

# Edit .env with your credentials
nano .env
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Configure Your IGA Platform

#### JumpCloud (Recommended)
```bash
export IGA_API_URL="https://console.jumpcloud.com/api"
export IGA_API_KEY="your_jumpcloud_api_key"
export IGA_ORG_ID="your_jumpcloud_org_id"
```

#### Okta
```bash
export IGA_API_URL="https://your-domain.okta.com/api/v1"
export IGA_API_KEY="your_okta_api_token"
```

#### Azure AD
```bash
export IGA_API_URL="https://graph.microsoft.com/v1.0"
export IGA_API_KEY="your_azure_bearer_token"
export IGA_ORG_ID="your_tenant_id"
```

### 4. Test Connection
```bash
python test_connection.py
```

### 5. Run Sync
```bash
python iga_user_sync.py
```

## 🐳 Docker Quick Start

```bash
# Copy environment template
cp config.env.example .env

# Edit .env with your credentials
nano .env

# Test connection
docker-compose -f api-integration.docker-compose.yml --profile test up iga-test

# Run sync
docker-compose -f api-integration.docker-compose.yml up iga-sync

# Run examples
docker-compose -f api-integration.docker-compose.yml --profile examples up iga-examples
```

## 📊 Expected Output

```
🎉 Successfully retrieved 1,247 users from IGA platform!
📊 Active users: 1,156
⚠️  Suspended users: 91
⚡ API calls made: 13

📁 Data exported to: iga_users_export_20241225_143052.json

🔍 SECURITY INSIGHTS:
🚨 High risk users (score ≥70): 23
😴 Inactive users (30+ days): 87
🔐 Privileged users: 34
```

## 🔧 Common Issues

### Authentication Error
```bash
# Check your API key
curl -H "Authorization: Bearer $IGA_API_KEY" $IGA_API_URL/organizations
```

### Rate Limiting
Add to your .env:
```bash
IGA_RATE_LIMIT_DELAY=1.0
IGA_PAGE_SIZE=50
```

### Timeout Issues
Add to your .env:
```bash
IGA_TIMEOUT=60
IGA_MAX_RETRIES=5
```

## 📝 Integration with SparrowVision

The exported JSON file can be directly imported into SparrowVision:

1. Run the sync: `python iga_user_sync.py`
2. Upload the generated `iga_users_export_*.json` to SparrowVision
3. Map the fields in SparrowVision's import wizard
4. Complete the import process

## 🔄 Automated Sync

### Cron Job (Linux/Mac)
```bash
# Edit crontab
crontab -e

# Add line for every 6 hours
0 */6 * * * cd /path/to/iga-sync && python iga_user_sync.py >> logs/cron.log 2>&1
```

### Docker Scheduler
```bash
# Start scheduled sync service
docker-compose -f api-integration.docker-compose.yml --profile scheduler up -d iga-scheduler
```

### Windows Task Scheduler
Create a task that runs:
```cmd
python C:\path\to\iga-sync\iga_user_sync.py
```

## 📚 Next Steps

- Review `IGA_SYNC_README.md` for comprehensive documentation
- Run `example_usage.py` to see advanced features
- Set up monitoring and alerting
- Configure automated reporting
- Integrate with your CI/CD pipeline

## 🆘 Support

- Check the logs in `logs/iga_sync.log`
- Run connection test: `python test_connection.py`
- Review the comprehensive README: `IGA_SYNC_README.md`
- Contact: it-admin@surveysparrow.com
