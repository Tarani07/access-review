# IGA Platform - Identity Governance & Administration Tool

A comprehensive Identity Governance and Administration (IGA) platform built with React, TypeScript, and Tailwind CSS. This tool provides enterprise-grade identity management, access governance, compliance monitoring, and security controls.

## 🚀 Features

### Core IGA Capabilities
- **Identity Lifecycle Management**: Complete user lifecycle from onboarding to offboarding
- **Access Governance**: Automated access reviews, certifications, and approvals
- **Role-Based Access Control (RBAC)**: Granular permission management with predefined roles
- **Policy Management**: Configurable access policies with real-time violation detection
- **Compliance Reporting**: SOX, GDPR, HIPAA, PCI-DSS, and ISO 27001 compliance frameworks
- **Audit & Monitoring**: Comprehensive audit logging and real-time security monitoring

### Security Features
- **Multi-Factor Authentication (MFA)**: TOTP-based authentication with fallback options
- **Session Management**: Secure session handling with timeout and activity tracking
- **Risk Assessment**: Real-time risk scoring based on user behavior and access patterns
- **Policy Violation Detection**: Automated detection and alerting of policy violations
- **Data Encryption**: Secure storage of sensitive credentials and user data

### User Experience
- **Modern UI/UX**: Clean, responsive interface built with Tailwind CSS
- **Role-Based Navigation**: Dynamic navigation based on user permissions
- **Real-Time Dashboard**: Comprehensive overview of security posture and compliance status
- **Advanced Analytics**: Risk trends, compliance metrics, and audit insights
- **Export Capabilities**: CSV/Excel export for reports and audit data

## 🏗️ Architecture

### Technology Stack
- **Frontend**: React 18 with TypeScript
- **Styling**: Tailwind CSS with custom components
- **Icons**: Lucide React icon library
- **Build Tool**: Vite for fast development and building
- **State Management**: React hooks with service-based architecture

### Service Architecture
```
src/
├── components/          # React components
│   ├── EnhancedDashboard.tsx
│   ├── LoginForm.tsx
│   ├── AccessControlGate.tsx
│   └── ...
├── services/           # Business logic services
│   ├── auth.ts         # Authentication & session management
│   ├── audit.ts        # Audit logging & compliance
│   └── policy.ts       # Policy management & violations
├── types/              # TypeScript type definitions
│   └── rbac.ts         # RBAC types and permissions
└── App.tsx            # Main application component
```

## 🔐 Security Model

### Role-Based Access Control (RBAC)
The platform implements a comprehensive RBAC system with the following roles:

1. **Super Administrator**
   - Full system access and administration
   - All permissions across all resources

2. **Access Administrator**
   - User access management
   - Access review and approval
   - Audit log access

3. **Access Reviewer**
   - Review and approve access requests
   - View audit logs
   - Limited user management

4. **Compliance Auditor**
   - View audit logs and compliance reports
   - Export audit data
   - Read-only access to user information

5. **Tool Administrator**
   - Manage tool integrations
   - Configure API connections
   - View audit logs

### Permission System
Permissions are organized by resource and action:
- **Users**: read, create, update, delete
- **Access Reviews**: read, create, approve, revoke
- **Tools**: read, create, update, delete, test
- **Audit**: read, export
- **Policies**: read, create, update, delete
- **System**: admin, config

## 🚦 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Modern web browser with JavaScript enabled

### Installation
1. Clone the repository:
```bash
git clone <repository-url>
cd access-review-tool
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

### Demo Credentials
For testing purposes, use these demo credentials:

| Role | Email | Password | MFA Code |
|------|-------|----------|----------|
| Super Admin | admin@surveysparrow.com | password | 123456 |
| Access Admin | access.admin@surveysparrow.com | password | 123456 |
| Reviewer | reviewer@surveysparrow.com | password | 123456 |
| Auditor | auditor@surveysparrow.com | password | 123456 |
| Tool Admin | tool.admin@surveysparrow.com | password | 123456 |

## 📊 Dashboard Overview

The enhanced dashboard provides:

### Security Risk Assessment
- Real-time risk scoring (0-100)
- Risk level indicators (Low, Medium, High, Critical)
- Risk factor analysis and recommendations

### Key Metrics
- Total users and active users
- Exited users and flagged accounts
- Connected tools and policy violations
- Audit events and compliance status

### Recent Activity
- Real-time activity feed
- Security events and policy violations
- User actions and system changes

### Quick Actions
- Start access reviews
- View audit logs
- Manage policy violations
- Check tool status

## 🔧 Configuration

### Tool Integration
The platform supports integration with various enterprise tools:

#### API-Based Integrations
- Slack, Zoom, Microsoft Teams
- AWS, Azure, Google Cloud
- GitHub, Bitbucket, Jira
- Salesforce, HubSpot, Zendesk
- And many more...

#### CSV-Based Integrations
- Physical security systems
- Legacy applications
- Custom tools without API access

### Policy Configuration
Default policies include:
- **Separation of Duties**: Prevents conflicting role assignments
- **Time-Based Access**: Restricts access during non-business hours
- **Privileged Access Review**: Requires regular review of admin access
- **External User Controls**: Special controls for contractors and external users

## 📈 Compliance & Reporting

### Supported Frameworks
- **SOX (Sarbanes-Oxley)**: Financial compliance and controls
- **GDPR (General Data Protection Regulation)**: Data privacy and protection
- **HIPAA (Health Insurance Portability and Accountability Act)**: Healthcare data protection
- **PCI-DSS (Payment Card Industry Data Security Standard)**: Payment card security
- **ISO 27001**: Information security management

### Audit Capabilities
- Comprehensive event logging
- Real-time monitoring and alerting
- Compliance report generation
- Data export in multiple formats
- Retention and archival policies

## 🛡️ Security Features

### Authentication
- Multi-factor authentication (MFA)
- Session management with timeout
- Password policies and complexity requirements
- Account lockout after failed attempts

### Authorization
- Role-based access control
- Resource-level permissions
- Dynamic permission evaluation
- Policy-based access decisions

### Monitoring
- Real-time risk assessment
- Policy violation detection
- Suspicious activity monitoring
- Compliance status tracking

## 🔄 Workflow Management

### Access Review Process
1. **Initiation**: Automated or manual access review creation
2. **Review**: Stakeholder review of user access
3. **Approval**: Approval or rejection of access requests
4. **Implementation**: Automatic or manual access provisioning/deprovisioning
5. **Audit**: Complete audit trail of all actions

### Policy Violation Handling
1. **Detection**: Real-time policy violation detection
2. **Alerting**: Immediate notification to administrators
3. **Investigation**: Detailed investigation of violations
4. **Remediation**: Corrective actions and policy updates
5. **Resolution**: Closure and documentation of violations

## 📱 User Interface

### Responsive Design
- Mobile-first approach
- Tablet and desktop optimized
- Touch-friendly interface
- Accessibility compliant

### Navigation
- Role-based menu items
- Breadcrumb navigation
- Quick action buttons
- Search and filtering capabilities

### Data Visualization
- Interactive charts and graphs
- Real-time metrics
- Trend analysis
- Risk indicators

## 🚀 Deployment

### Development
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### Production
1. Build the application:
```bash
npm run build
```

2. Deploy the `dist` folder to your web server

3. Configure environment variables for production

### Environment Configuration
Create a `.env` file with the following variables:
```
VITE_API_BASE_URL=https://your-api-server.com
VITE_APP_NAME=IGA Platform
VITE_APP_VERSION=2.0.0
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation wiki

## 🔮 Roadmap

### Upcoming Features
- [ ] Advanced workflow automation
- [ ] Machine learning-based risk assessment
- [ ] Mobile application
- [ ] API for third-party integrations
- [ ] Advanced reporting and analytics
- [ ] Multi-tenant support
- [ ] SSO integration (SAML, OAuth, OIDC)

### Version History
- **v2.0.0**: Enhanced IGA platform with RBAC, audit logging, and policy management
- **v1.0.0**: Basic access review tool

---

**Made with ❤️ by the SurveySparrow IT Team**
