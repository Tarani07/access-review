# SparrowVision IGA User Synchronization

A comprehensive Python script for retrieving users from Identity Governance and Administration (IGA) platforms and integrating them with SparrowVision for access governance and compliance reporting.

## 🚀 Features

### Core Functionality
- **Multi-Platform Support**: JumpCloud, Okta, Azure AD, Google Workspace
- **Cursor-Based Pagination**: Efficiently handles large user datasets
- **Bearer Token Authentication**: Secure API authentication
- **Robust Error Handling**: Retry logic, rate limiting, timeout handling
- **Production Ready**: Comprehensive logging, monitoring, and deployment options

### Advanced Capabilities
- **Risk Assessment**: Automated user risk scoring based on login patterns, privileges, and status
- **Security Insights**: Identify high-risk, inactive, and privileged users
- **Audit Compliance**: ISO 27001 compliant logging and reporting
- **Data Export**: JSON export for SparrowVision integration
- **Real-Time Monitoring**: Connection status and sync health monitoring

### Integration Features
- **SparrowVision Ready**: Direct integration with SparrowVision IGA platform
- **Slack Notifications**: Sync status and alert notifications
- **Database Support**: Optional PostgreSQL integration for sync history
- **Docker Support**: Containerized deployment with orchestration
- **Scheduled Syncs**: Automated synchronization with cron scheduling

## 📋 Requirements

### Python Dependencies
```bash
pip install -r requirements.txt
```

### Core Libraries
- `requests>=2.31.0` - HTTP API client
- `python-dotenv>=1.0.0` - Environment configuration
- `pydantic>=2.0.0` - Data validation
- `tenacity>=8.2.0` - Advanced retry mechanisms

### System Requirements
- Python 3.8+ (Recommended: Python 3.11)
- 2GB+ RAM for large organizations (10K+ users)
- Network access to your IGA platform API
- Optional: Docker and Docker Compose

## 🛠️ Installation

### Method 1: Direct Installation
```bash
# Clone or download the files
git clone <repository_url>
cd iga-sync

# Install dependencies
pip install -r requirements.txt

# Copy and configure environment
cp config.env.example .env
# Edit .env with your API credentials
```

### Method 2: Docker Installation
```bash
# Clone repository
git clone <repository_url>
cd iga-sync

# Copy and configure environment
cp config.env.example .env
# Edit .env with your API credentials

# Build and run with Docker Compose
docker-compose up -d
```

## ⚙️ Configuration

### Required Environment Variables

```bash
# Core IGA API Settings
IGA_API_URL=https://console.jumpcloud.com/api
IGA_API_KEY=your_api_key_here
IGA_ORG_ID=your_org_id_here
```

### Platform-Specific Configuration

#### JumpCloud
```bash
IGA_API_URL=https://console.jumpcloud.com/api
IGA_API_KEY=your_jumpcloud_api_key
IGA_ORG_ID=your_jumpcloud_org_id
```

#### Okta
```bash
IGA_API_URL=https://your-domain.okta.com/api/v1
IGA_API_KEY=your_okta_api_token
IGA_ORG_ID=your_okta_org_id
```

#### Azure AD
```bash
IGA_API_URL=https://graph.microsoft.com/v1.0
IGA_API_KEY=your_azure_bearer_token
IGA_ORG_ID=your_tenant_id
```

#### Google Workspace
```bash
IGA_API_URL=https://admin.googleapis.com/admin/directory/v1
IGA_API_KEY=your_google_access_token
IGA_ORG_ID=your_google_domain
```

### Optional Configuration
```bash
# Performance Settings
IGA_PAGE_SIZE=100
IGA_RATE_LIMIT_DELAY=0.5
IGA_TIMEOUT=30

# Security Settings
HIGH_RISK_THRESHOLD=70
INACTIVE_USER_DAYS=30

# Logging
LOG_LEVEL=INFO
LOG_FILE=./logs/iga_sync.log
```

## 🚀 Usage

### Basic Usage
```bash
# Run synchronization
python iga_user_sync.py
```

### Advanced Usage Examples

#### 1. One-time Sync with Export
```python
from iga_user_sync import IGAUserRetriever, IGAConfig

# Initialize and sync
config = IGAConfig()
retriever = IGAUserRetriever(config)
users = retriever.retrieve_all_users()

# Export data
export_file = retriever.export_users_json()
print(f"Exported {len(users)} users to {export_file}")
```

#### 2. Security Analysis
```python
# Get high-risk users
high_risk_users = retriever.get_high_risk_users(risk_threshold=80)
print(f"Found {len(high_risk_users)} high-risk users")

# Get inactive users
inactive_users = retriever.get_inactive_users(days=90)
print(f"Found {len(inactive_users)} inactive users")

# Get privileged users
privileged_users = retriever.get_privileged_users()
print(f"Found {len(privileged_users)} privileged users")
```

#### 3. Integration with SparrowVision
```python
import json
import requests

# Sync users and send to SparrowVision
users = retriever.retrieve_all_users()
export_data = retriever.export_users_json()

# Send to SparrowVision API
with open(export_data, 'r') as f:
    user_data = json.load(f)

response = requests.post(
    'https://your-sparrowvision-instance.com/api/users/sync',
    headers={'Authorization': f'Bearer {sparrowvision_api_key}'},
    json=user_data
)

print(f"SparrowVision sync: {response.status_code}")
```

## 📊 Output Examples

### Console Output
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

🚨 TOP 5 HIGH RISK USERS:
   • John Admin (john.admin@company.com) - Risk: 95
   • Stale Service Account (service@company.com) - Risk: 89
   • Former Manager (ex.manager@company.com) - Risk: 84
```

### JSON Export Structure
```json
{
  "metadata": {
    "export_timestamp": "2024-12-25T14:30:52.123456",
    "total_users": 1247,
    "sync_stats": {
      "api_calls": 13,
      "duration": 45.67
    }
  },
  "users": [
    {
      "id": "user123",
      "email": "john.doe@company.com",
      "username": "john.doe",
      "first_name": "John",
      "last_name": "Doe",
      "display_name": "John Doe",
      "status": "ACTIVE",
      "department": "Engineering",
      "job_title": "Senior Developer",
      "risk_score": 15,
      "groups": ["Developers", "VPN-Users"]
    }
  ]
}
```

## 🐳 Docker Deployment

### Simple Docker Run
```bash
# Build image
docker build -t sparrowvision-iga-sync .

# Run container
docker run --env-file .env \
  -v $(pwd)/logs:/app/logs \
  -v $(pwd)/exports:/app/exports \
  sparrowvision-iga-sync
```

### Docker Compose (Recommended)
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f iga-sync

# Stop services
docker-compose down
```

### Kubernetes Deployment
```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: iga-sync-cronjob
spec:
  schedule: "0 */6 * * *"  # Every 6 hours
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: iga-sync
            image: sparrowvision-iga-sync:latest
            envFrom:
            - secretRef:
                name: iga-sync-secrets
          restartPolicy: OnFailure
```

## 📈 Monitoring & Alerts

### Logging
- **Structured Logging**: JSON format for log aggregation
- **Log Levels**: DEBUG, INFO, WARNING, ERROR, CRITICAL
- **Log Rotation**: Automatic log file rotation
- **Audit Trail**: Complete API call and error logging

### Health Checks
```bash
# Check container health
docker-compose ps

# View sync status
tail -f logs/iga_sync.log

# Monitor API calls
grep "API_CALLS" logs/iga_sync.log
```

### Slack Integration
```bash
# Configure Slack webhook
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL

# Automatic notifications for:
# - Sync completion
# - High-risk user alerts
# - API errors
# - Connection issues
```

## 🔒 Security Best Practices

### API Key Management
- Store API keys in environment variables or secret management systems
- Rotate API keys regularly (every 6-12 months)
- Use dedicated service accounts with minimal required permissions
- Monitor API key usage and access logs

### Network Security
- Use HTTPS for all API communications
- Implement IP whitelisting where possible
- Use VPN or private networks for additional security
- Regular security audits of API endpoints

### Data Handling
- Encrypt sensitive data at rest and in transit
- Implement data retention policies
- Regular backup and recovery testing
- Compliance with GDPR, CCPA, and other regulations

## 🔧 Troubleshooting

### Common Issues

#### 1. Authentication Failures
```bash
# Check API key validity
curl -H "Authorization: Bearer $IGA_API_KEY" $IGA_API_URL/organizations

# Verify organization access
python -c "from iga_user_sync import IGAUserRetriever; r = IGAUserRetriever(); r._make_request('organizations')"
```

#### 2. Rate Limiting
- Increase `IGA_RATE_LIMIT_DELAY`
- Reduce `IGA_PAGE_SIZE`
- Upgrade your IGA platform plan for higher limits

#### 3. Connection Timeouts
- Increase `IGA_TIMEOUT` value
- Check network connectivity
- Verify firewall rules

#### 4. Memory Issues (Large Organizations)
```bash
# Monitor memory usage
docker stats sparrowvision-iga-sync

# Optimize for large datasets
export IGA_PAGE_SIZE=50
export IGA_RATE_LIMIT_DELAY=1.0
```

## 📚 API Reference

### Main Classes

#### `IGAUserRetriever`
Main class for user synchronization
- `retrieve_all_users()` - Fetch all users with pagination
- `get_high_risk_users(threshold)` - Get users above risk threshold
- `get_inactive_users(days)` - Get users inactive for X days
- `export_users_json(filename)` - Export users to JSON

#### `IGAUser`
Data class representing a user
- `id`, `email`, `username` - Basic identifiers
- `status`, `department`, `job_title` - User attributes
- `risk_score` - Calculated risk assessment
- `groups` - User group memberships

#### `IGAConfig`
Configuration management
- Environment variable loading
- API endpoint configuration
- Rate limiting and retry settings

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Setup
```bash
# Install development dependencies
pip install -r requirements.txt
pip install pytest black flake8 mypy

# Run tests
pytest tests/

# Format code
black iga_user_sync.py

# Type checking
mypy iga_user_sync.py
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

- **SparrowVision Support**: it-admin@surveysparrow.com
- **Documentation**: https://docs.sparrowvision.com
- **Issues**: Create GitHub issues for bugs and feature requests

## 🔄 Version History

- **v2.0**: Complete rewrite with multi-platform support
- **v1.5**: Added risk assessment and security insights
- **v1.0**: Initial release with basic user sync

---

*This integration script enables seamless user synchronization between your IGA platform and SparrowVision for comprehensive access governance and compliance reporting.*
