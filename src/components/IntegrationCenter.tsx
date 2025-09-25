import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Plus, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  Link,
  Upload,
  Database,
  Eye,
  Activity,
  Search,
  Filter,
  Download,
  Trash2,
  Edit,
  Key,
  Wifi,
  WifiOff,
  TestTube,
  Save,
  X
} from 'lucide-react';

import { createConnector, UserData, SyncResult, ConnectorConfig } from '../services/integrations/apiConnectors';
import { CSVProcessor, CSV_TEMPLATES } from '../services/integrations/csvProcessor';

interface Integration {
  id: string;
  name: string;
  category: string;
  type: 'API' | 'CSV' | 'WEBHOOK' | 'OAUTH';
  status: 'CONNECTED' | 'DISCONNECTED' | 'TESTING' | 'ERROR' | 'PENDING';
  lastSync?: string;
  userCount?: number;
  apiEndpoint?: string;
  authType?: string;
  isActive: boolean;
  syncFrequency?: string;
  errorMessage?: string;
  credentials?: {
    apiKey?: string;
    clientId?: string;
    clientSecret?: string;
    accessToken?: string;
  };
}

interface IntegrationTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  type: 'API' | 'CSV' | 'WEBHOOK' | 'OAUTH';
  authType: string;
  apiEndpoint?: string;
  docsUrl: string;
  fields: {
    name: string;
    type: string;
    required: boolean;
    description: string;
    placeholder?: string;
  }[];
  userMapping: {
    id: string[];
    email: string[];
    firstName: string[];
    lastName: string[];
    status: string[];
    lastLogin?: string[];
    department?: string[];
    role?: string[];
  };
}

// Comprehensive list of supported integrations
const INTEGRATION_TEMPLATES: IntegrationTemplate[] = [
  // Identity & Access Management
  {
    id: 'jumpcloud',
    name: 'JumpCloud',
    category: 'Identity Management',
    description: 'Directory service and identity management platform',
    type: 'API',
    authType: 'Bearer Token',
    apiEndpoint: 'https://console.jumpcloud.com/api',
    docsUrl: 'https://docs.jumpcloud.com/api/1.0/',
    fields: [
      { name: 'apiKey', type: 'password', required: true, description: 'JumpCloud API Key', placeholder: 'Enter API key from JumpCloud console' },
      { name: 'orgId', type: 'text', required: true, description: 'Organization ID', placeholder: 'Your JumpCloud organization ID' }
    ],
    userMapping: {
      id: ['_id', 'id'],
      email: ['email'],
      firstName: ['firstname', 'firstName'],
      lastName: ['lastname', 'lastName'],
      status: ['activated', 'suspended'],
      lastLogin: ['lastLogin'],
      department: ['department'],
      role: ['groups']
    }
  },
  {
    id: 'gsuite',
    name: 'G Suite Enterprise',
    category: 'Identity Management',
    description: 'Google Workspace directory and user management',
    type: 'OAUTH',
    authType: 'OAuth 2.0',
    apiEndpoint: 'https://admin.googleapis.com/admin/directory/v1',
    docsUrl: 'https://developers.google.com/admin-sdk/directory/',
    fields: [
      { name: 'clientId', type: 'text', required: true, description: 'OAuth Client ID', placeholder: 'Google Cloud Console Client ID' },
      { name: 'clientSecret', type: 'password', required: true, description: 'OAuth Client Secret', placeholder: 'Client secret from Google Cloud' },
      { name: 'domain', type: 'text', required: true, description: 'G Suite Domain', placeholder: 'yourcompany.com' }
    ],
    userMapping: {
      id: ['id'],
      email: ['primaryEmail'],
      firstName: ['name.givenName'],
      lastName: ['name.familyName'],
      status: ['suspended'],
      lastLogin: ['lastLoginTime'],
      department: ['organizations.department'],
      role: ['organizations.title']
    }
  },
  {
    id: 'microsoft365',
    name: 'Microsoft 365 for Business',
    category: 'Identity Management', 
    description: 'Microsoft 365 and Azure AD integration',
    type: 'API',
    authType: 'Bearer Token',
    apiEndpoint: 'https://graph.microsoft.com/v1.0',
    docsUrl: 'https://docs.microsoft.com/en-us/graph/',
    fields: [
      { name: 'tenantId', type: 'text', required: true, description: 'Azure Tenant ID', placeholder: 'Your Azure AD tenant ID' },
      { name: 'clientId', type: 'text', required: true, description: 'Application Client ID', placeholder: 'Registered app client ID' },
      { name: 'clientSecret', type: 'password', required: true, description: 'Application Secret', placeholder: 'Client secret value' }
    ],
    userMapping: {
      id: ['id'],
      email: ['mail', 'userPrincipalName'],
      firstName: ['givenName'],
      lastName: ['surname'],
      status: ['accountEnabled'],
      lastLogin: ['signInActivity.lastSignInDateTime'],
      department: ['department'],
      role: ['jobTitle']
    }
  },

  // Communication & Collaboration
  {
    id: 'slack',
    name: 'Slack',
    category: 'Communication',
    description: 'Team communication and collaboration platform',
    type: 'API',
    authType: 'Bearer Token',
    apiEndpoint: 'https://slack.com/api',
    docsUrl: 'https://api.slack.com/web',
    fields: [
      { name: 'botToken', type: 'password', required: true, description: 'Bot User OAuth Token', placeholder: 'xoxb-your-bot-token' },
      { name: 'workspaceId', type: 'text', required: false, description: 'Workspace ID (Optional)', placeholder: 'T1234567890' }
    ],
    userMapping: {
      id: ['id'],
      email: ['profile.email'],
      firstName: ['profile.first_name', 'real_name'],
      lastName: ['profile.last_name'],
      status: ['deleted', 'is_bot'],
      lastLogin: ['profile.status_expiration'],
      department: ['profile.fields.department'],
      role: ['profile.title']
    }
  },
  {
    id: 'zoom',
    name: 'Zoom Video Communications',
    category: 'Communication',
    description: 'Video conferencing and webinar platform',
    type: 'API',
    authType: 'JWT/OAuth',
    apiEndpoint: 'https://api.zoom.us/v2',
    docsUrl: 'https://marketplace.zoom.us/docs/api-reference/zoom-api',
    fields: [
      { name: 'apiKey', type: 'text', required: true, description: 'Zoom API Key', placeholder: 'Your Zoom API key' },
      { name: 'apiSecret', type: 'password', required: true, description: 'Zoom API Secret', placeholder: 'Your Zoom API secret' },
      { name: 'accountId', type: 'text', required: false, description: 'Account ID (Optional)', placeholder: 'Zoom account ID' }
    ],
    userMapping: {
      id: ['id'],
      email: ['email'],
      firstName: ['first_name'],
      lastName: ['last_name'],
      status: ['status'],
      lastLogin: ['last_login_time'],
      department: ['dept'],
      role: ['role_name']
    }
  },
  {
    id: 'ringcentral',
    name: 'RingCentral',
    category: 'Communication',
    description: 'Cloud-based business communications platform',
    type: 'API',
    authType: 'OAuth 2.0',
    apiEndpoint: 'https://platform.ringcentral.com/restapi/v1.0',
    docsUrl: 'https://developers.ringcentral.com/api-reference',
    fields: [
      { name: 'clientId', type: 'text', required: true, description: 'RingCentral App Client ID', placeholder: 'Your app client ID' },
      { name: 'clientSecret', type: 'password', required: true, description: 'RingCentral App Secret', placeholder: 'Your app client secret' },
      { name: 'server', type: 'select', required: true, description: 'Server Environment', placeholder: 'Select server' }
    ],
    userMapping: {
      id: ['id'],
      email: ['contact.email'],
      firstName: ['contact.firstName'],
      lastName: ['contact.lastName'],
      status: ['status'],
      lastLogin: ['lastLoginTime'],
      department: ['contact.department'],
      role: ['roles']
    }
  },

  // Development & DevOps
  {
    id: 'github',
    name: 'GitHub',
    category: 'Development',
    description: 'Code repository and collaboration platform',
    type: 'API',
    authType: 'Personal Access Token',
    apiEndpoint: 'https://api.github.com',
    docsUrl: 'https://docs.github.com/en/rest',
    fields: [
      { name: 'accessToken', type: 'password', required: true, description: 'Personal Access Token', placeholder: 'ghp_xxxxxxxxxxxxxxxxxxxx' },
      { name: 'organization', type: 'text', required: true, description: 'GitHub Organization', placeholder: 'your-org-name' }
    ],
    userMapping: {
      id: ['id'],
      email: ['email'],
      firstName: ['name'],
      lastName: [''],
      status: ['state'],
      lastLogin: ['updated_at'],
      department: ['company'],
      role: ['role']
    }
  },
  {
    id: 'bitbucket',
    name: 'Bitbucket',
    category: 'Development',
    description: 'Git repository management and code collaboration',
    type: 'API',
    authType: 'App Password',
    apiEndpoint: 'https://api.bitbucket.org/2.0',
    docsUrl: 'https://developer.atlassian.com/bitbucket/api/2/reference/',
    fields: [
      { name: 'username', type: 'text', required: true, description: 'Bitbucket Username', placeholder: 'your-username' },
      { name: 'appPassword', type: 'password', required: true, description: 'App Password', placeholder: 'Generated app password' },
      { name: 'workspace', type: 'text', required: true, description: 'Workspace Name', placeholder: 'your-workspace' }
    ],
    userMapping: {
      id: ['account_id'],
      email: ['email'],
      firstName: ['display_name'],
      lastName: [''],
      status: ['is_active'],
      lastLogin: ['created_on'],
      department: [''],
      role: ['type']
    }
  },
  {
    id: 'jira',
    name: 'Jira',
    category: 'Development',
    description: 'Project management and issue tracking',
    type: 'API',
    authType: 'API Token',
    apiEndpoint: 'https://your-domain.atlassian.net/rest/api/3',
    docsUrl: 'https://developer.atlassian.com/cloud/jira/platform/rest/v3/',
    fields: [
      { name: 'domain', type: 'text', required: true, description: 'Atlassian Domain', placeholder: 'your-domain.atlassian.net' },
      { name: 'email', type: 'email', required: true, description: 'Atlassian Account Email', placeholder: 'admin@yourcompany.com' },
      { name: 'apiToken', type: 'password', required: true, description: 'API Token', placeholder: 'Generated from Atlassian account' }
    ],
    userMapping: {
      id: ['accountId'],
      email: ['emailAddress'],
      firstName: ['displayName'],
      lastName: [''],
      status: ['active'],
      lastLogin: [''],
      department: [''],
      role: ['groups']
    }
  },
  {
    id: 'confluence',
    name: 'Confluence',
    category: 'Development',
    description: 'Team collaboration and knowledge management',
    type: 'API',
    authType: 'API Token',
    apiEndpoint: 'https://your-domain.atlassian.net/wiki/rest/api',
    docsUrl: 'https://developer.atlassian.com/cloud/confluence/rest/v1/',
    fields: [
      { name: 'domain', type: 'text', required: true, description: 'Atlassian Domain', placeholder: 'your-domain.atlassian.net' },
      { name: 'email', type: 'email', required: true, description: 'Atlassian Account Email', placeholder: 'admin@yourcompany.com' },
      { name: 'apiToken', type: 'password', required: true, description: 'API Token', placeholder: 'Generated from Atlassian account' }
    ],
    userMapping: {
      id: ['userKey', 'accountId'],
      email: ['email'],
      firstName: ['displayName'],
      lastName: [''],
      status: ['status'],
      lastLogin: [''],
      department: [''],
      role: ['groups']
    }
  },

  // Customer Support & CRM
  {
    id: 'hubspot',
    name: 'HubSpot',
    category: 'CRM',
    description: 'CRM and marketing automation platform',
    type: 'API',
    authType: 'API Key',
    apiEndpoint: 'https://api.hubapi.com',
    docsUrl: 'https://developers.hubspot.com/docs/api/overview',
    fields: [
      { name: 'apiKey', type: 'password', required: true, description: 'HubSpot API Key', placeholder: 'Your HubSpot API key' }
    ],
    userMapping: {
      id: ['user-id'],
      email: ['email'],
      firstName: ['firstName'],
      lastName: ['lastName'],
      status: [''],
      lastLogin: ['lastModifiedDate'],
      department: [''],
      role: ['roleId']
    }
  },
  {
    id: 'zendesk',
    name: 'Zendesk',
    category: 'Customer Support',
    description: 'Customer service and support platform',
    type: 'API',
    authType: 'API Token',
    apiEndpoint: 'https://your-subdomain.zendesk.com/api/v2',
    docsUrl: 'https://developer.zendesk.com/api-reference/',
    fields: [
      { name: 'subdomain', type: 'text', required: true, description: 'Zendesk Subdomain', placeholder: 'yourcompany' },
      { name: 'email', type: 'email', required: true, description: 'Admin Email', placeholder: 'admin@yourcompany.com' },
      { name: 'apiToken', type: 'password', required: true, description: 'API Token', placeholder: 'Generated API token' }
    ],
    userMapping: {
      id: ['id'],
      email: ['email'],
      firstName: ['name'],
      lastName: [''],
      status: ['active', 'suspended'],
      lastLogin: ['last_login_at'],
      department: ['organization_id'],
      role: ['role']
    }
  },
  {
    id: 'intercom',
    name: 'Intercom',
    category: 'Customer Support',
    description: 'Customer messaging and support platform',
    type: 'API',
    authType: 'Bearer Token',
    apiEndpoint: 'https://api.intercom.io',
    docsUrl: 'https://developers.intercom.com/intercom-api-reference/reference',
    fields: [
      { name: 'accessToken', type: 'password', required: true, description: 'Intercom Access Token', placeholder: 'Your Intercom access token' }
    ],
    userMapping: {
      id: ['id'],
      email: ['email'],
      firstName: ['name'],
      lastName: [''],
      status: [''],
      lastLogin: ['last_seen_at'],
      department: [''],
      role: ['role']
    }
  },

  // Monitoring & Analytics
  {
    id: 'newrelic',
    name: 'New Relic',
    category: 'Monitoring',
    description: 'Application performance monitoring platform',
    type: 'API',
    authType: 'API Key',
    apiEndpoint: 'https://api.newrelic.com/v2',
    docsUrl: 'https://docs.newrelic.com/docs/apis/rest-api-v2/',
    fields: [
      { name: 'apiKey', type: 'password', required: true, description: 'New Relic API Key', placeholder: 'NRAA-xxxxxxxxxxxxxxxxxxxxx' }
    ],
    userMapping: {
      id: ['id'],
      email: ['email'],
      firstName: ['first_name'],
      lastName: ['last_name'],
      status: [''],
      lastLogin: ['last_active'],
      department: [''],
      role: ['role']
    }
  },
  {
    id: 'sentry',
    name: 'Sentry',
    category: 'Monitoring',
    description: 'Error tracking and performance monitoring',
    type: 'API',
    authType: 'Bearer Token',
    apiEndpoint: 'https://sentry.io/api/0',
    docsUrl: 'https://docs.sentry.io/api/',
    fields: [
      { name: 'authToken', type: 'password', required: true, description: 'Sentry Auth Token', placeholder: 'Generated from Sentry settings' },
      { name: 'organization', type: 'text', required: true, description: 'Organization Slug', placeholder: 'your-org-slug' }
    ],
    userMapping: {
      id: ['id'],
      email: ['email'],
      firstName: ['name'],
      lastName: [''],
      status: ['isActive'],
      lastLogin: ['lastSeen'],
      department: [''],
      role: ['role']
    }
  },

  // Cloud Platforms
  {
    id: 'aws',
    name: 'Amazon Web Services',
    category: 'Cloud Platform',
    description: 'AWS IAM users and access management',
    type: 'API',
    authType: 'Access Keys',
    apiEndpoint: 'https://iam.amazonaws.com',
    docsUrl: 'https://docs.aws.amazon.com/IAM/latest/APIReference/',
    fields: [
      { name: 'accessKeyId', type: 'text', required: true, description: 'AWS Access Key ID', placeholder: 'AKIA...' },
      { name: 'secretAccessKey', type: 'password', required: true, description: 'AWS Secret Access Key', placeholder: 'Your AWS secret key' },
      { name: 'region', type: 'text', required: true, description: 'AWS Region', placeholder: 'us-east-1' }
    ],
    userMapping: {
      id: ['UserId'],
      email: [''],
      firstName: ['UserName'],
      lastName: [''],
      status: [''],
      lastLogin: ['PasswordLastUsed'],
      department: [''],
      role: ['Groups']
    }
  },
  {
    id: 'googlecloud',
    name: 'Google Cloud',
    category: 'Cloud Platform',
    description: 'Google Cloud Platform IAM and user management',
    type: 'API',
    authType: 'Service Account',
    apiEndpoint: 'https://cloudresourcemanager.googleapis.com/v1',
    docsUrl: 'https://cloud.google.com/resource-manager/reference/rest',
    fields: [
      { name: 'serviceAccountKey', type: 'textarea', required: true, description: 'Service Account JSON Key', placeholder: 'Paste the entire JSON key file content' },
      { name: 'projectId', type: 'text', required: true, description: 'GCP Project ID', placeholder: 'your-project-id' }
    ],
    userMapping: {
      id: ['name'],
      email: ['email'],
      firstName: ['displayName'],
      lastName: [''],
      status: ['disabled'],
      lastLogin: [''],
      department: [''],
      role: ['bindings']
    }
  },

  // Design & Creative
  {
    id: 'figma',
    name: 'Figma',
    category: 'Design',
    description: 'Collaborative design and prototyping platform',
    type: 'API',
    authType: 'Personal Access Token',
    apiEndpoint: 'https://api.figma.com/v1',
    docsUrl: 'https://www.figma.com/developers/api',
    fields: [
      { name: 'accessToken', type: 'password', required: true, description: 'Figma Personal Access Token', placeholder: 'figd_...' },
      { name: 'teamId', type: 'text', required: false, description: 'Team ID (Optional)', placeholder: 'Figma team ID' }
    ],
    userMapping: {
      id: ['id'],
      email: ['email'],
      firstName: ['handle'],
      lastName: [''],
      status: [''],
      lastLogin: [''],
      department: [''],
      role: ['role']
    }
  },
  {
    id: 'adobe',
    name: 'Adobe Creative Cloud',
    category: 'Design',
    description: 'Adobe Creative Cloud user management',
    type: 'API',
    authType: 'JWT/OAuth',
    apiEndpoint: 'https://usermanagement.adobe.io/v2/usermanagement',
    docsUrl: 'https://adobe-apiplatform.github.io/usermanagement-api/',
    fields: [
      { name: 'apiKey', type: 'text', required: true, description: 'Adobe API Key', placeholder: 'Your Adobe API key' },
      { name: 'technicalAccount', type: 'text', required: true, description: 'Technical Account ID', placeholder: 'Technical account ID' },
      { name: 'orgId', type: 'text', required: true, description: 'Organization ID', placeholder: 'Adobe organization ID' },
      { name: 'clientSecret', type: 'password', required: true, description: 'Client Secret', placeholder: 'Client secret' },
      { name: 'privateKey', type: 'textarea', required: true, description: 'Private Key', placeholder: 'RSA private key content' }
    ],
    userMapping: {
      id: ['id'],
      email: ['email'],
      firstName: ['firstname'],
      lastName: ['lastname'],
      status: ['status'],
      lastLogin: [''],
      department: [''],
      role: ['groups']
    }
  }
];

// Add CSV-only integrations for platforms without APIs
const CSV_INTEGRATIONS = [
  'Fortigate Firewall', 'Heimdal - Anti Virus', 'Cab Management Tool', 
  'Astrella - LTSE Cap Table', 'Namecheap', 'FastSpring', 'IPAPI',
  'Whimsical', 'Gusto', 'Litmus', 'Unbounce', 'DeBounce', 'VoilaNorbert',
  'Entries ai', 'Cookieyes', 'Zerobounce', 'GROKABILITY', 'LuckyOrange',
  'ReachInbox', 'Burpsuite', 'Quick Email Verification', 'Public Data Check',
  'HeyGen', 'Crystal Project', 'Crazy Egg', 'Virtualpost', 'Vimeo',
  'Rawpixel', 'Forticloud', 'Read.ai', 'SurferSEO', 'SaaSAnt', 'Iconscout',
  'Originality.AI', 'Disqus', 'Freepik', 'AppSumo', 'Midjourney',
  'NGROK.COM', 'Compose AI', 'Blogarama', 'Apple.com', 'Sejda', 'Medium',
  'GoDaddy', 'Tasjeel - Domain', 'Document Studio', 'Indie Hackers', 'Copyscape'
];

export default function IntegrationCenter() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [templates] = useState<IntegrationTemplate[]>(INTEGRATION_TEMPLATES);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<IntegrationTemplate | null>(null);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [editingIntegration, setEditingIntegration] = useState<Integration | null>(null);
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [showCSVModal, setShowCSVModal] = useState(false);
  const [selectedCSVTool, setSelectedCSVTool] = useState<string>('');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvTemplate, setCsvTemplate] = useState('standard');
  const [csvProcessing, setCsvProcessing] = useState(false);

  useEffect(() => {
    loadIntegrations();
  }, []);

  const loadIntegrations = async () => {
    setIsLoading(true);
    try {
      // Load from localStorage or API
      const saved = localStorage.getItem('sparrowvision-integrations');
      if (saved) {
        setIntegrations(JSON.parse(saved));
      } else {
        // Initialize with some demo data
        const demoIntegrations: Integration[] = [
          {
            id: '1',
            name: 'JumpCloud',
            category: 'Identity Management',
            type: 'API',
            status: 'CONNECTED',
            lastSync: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
            userCount: 247,
            apiEndpoint: 'https://console.jumpcloud.com/api',
            authType: 'Bearer Token',
            isActive: true,
            syncFrequency: 'Every 6 hours'
          },
          {
            id: '2', 
            name: 'Slack',
            category: 'Communication',
            type: 'API',
            status: 'CONNECTED',
            lastSync: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
            userCount: 156,
            apiEndpoint: 'https://slack.com/api',
            authType: 'Bearer Token',
            isActive: true,
            syncFrequency: 'Daily'
          }
        ];
        setIntegrations(demoIntegrations);
      }
    } catch (error) {
      console.error('Failed to load integrations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveIntegrations = (newIntegrations: Integration[]) => {
    localStorage.setItem('sparrowvision-integrations', JSON.stringify(newIntegrations));
    setIntegrations(newIntegrations);
  };

  const handleAddIntegration = (template: IntegrationTemplate) => {
    setSelectedTemplate(template);
    setCredentials({});
    setEditingIntegration(null);
    setShowConfigModal(true);
  };

  const handleEditIntegration = (integration: Integration) => {
    const template = templates.find(t => t.name === integration.name);
    if (template) {
      setSelectedTemplate(template);
      setEditingIntegration(integration);
      setCredentials(integration.credentials || {});
      setShowConfigModal(true);
    }
  };

  const handleSaveIntegration = async () => {
    if (!selectedTemplate) return;

    // Validate required fields
    const missingFields = selectedTemplate.fields
      .filter(field => field.required && !credentials[field.name])
      .map(field => field.name);

    if (missingFields.length > 0) {
      alert(`Please fill in required fields: ${missingFields.join(', ')}`);
      return;
    }

    const newIntegration: Integration = {
      id: editingIntegration?.id || Date.now().toString(),
      name: selectedTemplate.name,
      category: selectedTemplate.category,
      type: selectedTemplate.type,
      status: 'PENDING',
      apiEndpoint: selectedTemplate.apiEndpoint,
      authType: selectedTemplate.authType,
      isActive: true,
      credentials: credentials,
      syncFrequency: 'Daily'
    };

    // Test connection
    await testConnection(newIntegration);

    if (editingIntegration) {
      // Update existing
      const updated = integrations.map(i => 
        i.id === editingIntegration.id ? newIntegration : i
      );
      saveIntegrations(updated);
    } else {
      // Add new
      saveIntegrations([...integrations, newIntegration]);
    }

    setShowConfigModal(false);
    setSelectedTemplate(null);
    setCredentials({});
  };

  const testConnection = async (integration: Integration) => {
    const updated = { ...integration, status: 'TESTING' as const };
    setIntegrations(prev => prev.map(i => i.id === integration.id ? updated : i));

    try {
      // Create real API connector
      const connector = createConnector(integration.name, integration.credentials || {});
      
      if (!connector) {
        updated.status = 'ERROR';
        updated.errorMessage = 'Unsupported integration type';
      } else {
        // Test the actual connection
        const testResult = await connector.testConnection();
        
        updated.status = testResult.success ? 'CONNECTED' : 'ERROR';
        updated.errorMessage = testResult.success ? undefined : testResult.message;
        
        if (testResult.success) {
          updated.lastSync = new Date().toISOString();
          // Get a small sample to count users
          try {
            const sampleSync = await connector.syncUsers();
            updated.userCount = sampleSync.usersCount;
          } catch {
            // If sync fails, still mark as connected but without user count
            updated.userCount = 0;
          }
        }
      }

    } catch (error) {
      updated.status = 'ERROR';
      updated.errorMessage = error instanceof Error ? error.message : 'Connection failed - please check your configuration';
    }

    setIntegrations(prev => prev.map(i => i.id === integration.id ? updated : i));
  };

  const handleDeleteIntegration = (id: string) => {
    if (confirm('Are you sure you want to delete this integration?')) {
      const filtered = integrations.filter(i => i.id !== id);
      saveIntegrations(filtered);
    }
  };

  const handleSyncIntegration = async (integration: Integration) => {
    const updated = { ...integration, status: 'TESTING' as const };
    setIntegrations(prev => prev.map(i => i.id === integration.id ? updated : i));

    try {
      // Create real API connector
      const connector = createConnector(integration.name, integration.credentials || {});
      
      if (!connector) {
        updated.status = 'ERROR';
        updated.errorMessage = 'Unsupported integration type';
      } else {
        // Perform actual sync
        const syncResult = await connector.syncUsers();
        
        if (syncResult.success) {
          updated.status = 'CONNECTED';
          updated.lastSync = new Date().toISOString();
          updated.userCount = syncResult.usersCount;
          updated.errorMessage = undefined;
          
          // Save synced users to localStorage for access reviews
          const existingSyncData = JSON.parse(localStorage.getItem('sparrowvision-sync-data') || '{}');
          existingSyncData[integration.id] = {
            integration: integration.name,
            users: syncResult.users,
            syncedAt: updated.lastSync,
            usersCount: syncResult.usersCount
          };
          localStorage.setItem('sparrowvision-sync-data', JSON.stringify(existingSyncData));
          
        } else {
          updated.status = 'ERROR';
          updated.errorMessage = syncResult.errors.join('; ') || 'Sync failed';
        }
      }

    } catch (error) {
      updated.status = 'ERROR';
      updated.errorMessage = error instanceof Error ? error.message : 'Sync failed - please try again';
    }

    setIntegrations(prev => prev.map(i => i.id === integration.id ? updated : i));
  };

  const handleCSVIntegration = (toolName: string) => {
    setSelectedCSVTool(toolName);
    setCsvFile(null);
    setCsvTemplate('standard');
    setShowCSVModal(true);
  };

  const handleCSVFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'text/csv') {
      setCsvFile(file);
    } else {
      alert('Please select a valid CSV file.');
    }
  };

  const handleCSVUpload = async () => {
    if (!csvFile || !selectedCSVTool) return;

    setCsvProcessing(true);

    try {
      const result = await CSVProcessor.processCSVFile(csvFile, csvTemplate);

      if (result.success && result.users.length > 0) {
        // Create new CSV integration
        const newIntegration: Integration = {
          id: Date.now().toString(),
          name: selectedCSVTool,
          category: 'Manual Import',
          type: 'CSV',
          status: 'CONNECTED',
          lastSync: new Date().toISOString(),
          userCount: result.processedRows,
          isActive: true,
          syncFrequency: 'Manual',
          errorMessage: result.warnings.length > 0 ? `Warnings: ${result.warnings.join('; ')}` : undefined
        };

        // Save integration
        const updatedIntegrations = [...integrations, newIntegration];
        saveIntegrations(updatedIntegrations);

        // Save user data
        const existingSyncData = JSON.parse(localStorage.getItem('sparrowvision-sync-data') || '{}');
        existingSyncData[newIntegration.id] = {
          integration: selectedCSVTool,
          users: result.users,
          syncedAt: newIntegration.lastSync,
          usersCount: result.users.length
        };
        localStorage.setItem('sparrowvision-sync-data', JSON.stringify(existingSyncData));

        // Show success message
        alert(`Successfully imported ${result.processedRows} users from ${selectedCSVTool}!`);
        setShowCSVModal(false);

      } else {
        const errorMsg = result.errors.length > 0 ? result.errors.join('\n') : 'No users could be processed from the CSV file';
        alert(`CSV processing failed:\n${errorMsg}`);
      }

    } catch (error) {
      alert(`Failed to process CSV: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setCsvProcessing(false);
    }
  };

  const downloadCSVTemplate = (templateType: string) => {
    const csvContent = CSVProcessor.generateCSVTemplate(templateType);
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${templateType}-template.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === 'ALL' || template.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  const filteredIntegrations = integrations.filter(integration => {
    const matchesSearch = integration.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         integration.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === 'ALL' || integration.category === categoryFilter;
    const matchesStatus = statusFilter === 'ALL' || integration.status === statusFilter;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const categories = Array.from(new Set(templates.map(t => t.category)));

  const getStatusColor = (status: Integration['status']) => {
    switch (status) {
      case 'CONNECTED': return 'bg-green-100 text-green-800';
      case 'DISCONNECTED': return 'bg-gray-100 text-gray-800';
      case 'TESTING': return 'bg-yellow-100 text-yellow-800';
      case 'ERROR': return 'bg-red-100 text-red-800';
      case 'PENDING': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: Integration['status']) => {
    switch (status) {
      case 'CONNECTED': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'DISCONNECTED': return <X className="h-4 w-4 text-gray-500" />;
      case 'TESTING': return <Clock className="h-4 w-4 text-yellow-500 animate-spin" />;
      case 'ERROR': return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'PENDING': return <Clock className="h-4 w-4 text-blue-500" />;
      default: return <X className="h-4 w-4 text-gray-500" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Integration Center</h1>
          <p className="text-gray-600 mt-1">Connect and manage all your business tools for comprehensive access reviews</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Integration
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
          <div className="text-2xl font-bold text-emerald-700">{integrations.filter(i => i.status === 'CONNECTED').length}</div>
          <div className="text-sm text-emerald-600">Connected</div>
        </div>
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="text-2xl font-bold text-blue-700">{integrations.reduce((sum, i) => sum + (i.userCount || 0), 0).toLocaleString()}</div>
          <div className="text-sm text-blue-600">Total Users</div>
        </div>
        <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
          <div className="text-2xl font-bold text-yellow-700">{integrations.filter(i => i.status === 'ERROR').length}</div>
          <div className="text-sm text-yellow-600">Errors</div>
        </div>
        <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
          <div className="text-2xl font-bold text-purple-700">{templates.length}</div>
          <div className="text-sm text-purple-600">Available Integrations</div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex-1 max-w-lg">
            <div className="relative">
              <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search integrations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
          
          <div className="flex space-x-4">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="ALL">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="ALL">All Status</option>
              <option value="CONNECTED">Connected</option>
              <option value="DISCONNECTED">Disconnected</option>
              <option value="ERROR">Error</option>
              <option value="PENDING">Pending</option>
            </select>
          </div>
        </div>
      </div>

      {/* Connected Integrations */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Connected Integrations ({filteredIntegrations.length})</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Integration</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Users</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Sync</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredIntegrations.map((integration) => (
                <tr key={integration.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center">
                        {integration.type === 'API' && <Link className="h-5 w-5 text-blue-500" />}
                        {integration.type === 'CSV' && <Upload className="h-5 w-5 text-orange-500" />}
                        {integration.type === 'WEBHOOK' && <Activity className="h-5 w-5 text-purple-500" />}
                        {integration.type === 'OAUTH' && <Key className="h-5 w-5 text-green-500" />}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{integration.name}</div>
                        <div className="text-sm text-gray-500">{integration.category}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      integration.type === 'API' ? 'bg-blue-100 text-blue-800' :
                      integration.type === 'CSV' ? 'bg-orange-100 text-orange-800' :
                      integration.type === 'WEBHOOK' ? 'bg-purple-100 text-purple-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {integration.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getStatusIcon(integration.status)}
                      <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(integration.status)}`}>
                        {integration.status}
                      </span>
                    </div>
                    {integration.errorMessage && (
                      <div className="text-xs text-red-600 mt-1 max-w-xs truncate">
                        {integration.errorMessage}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {integration.userCount ? integration.userCount.toLocaleString() : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {integration.lastSync ? new Date(integration.lastSync).toLocaleString() : 'Never'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleSyncIntegration(integration)}
                        disabled={integration.status === 'TESTING'}
                        className="text-emerald-600 hover:text-emerald-900 disabled:opacity-50"
                        title="Sync now"
                      >
                        <RefreshCw className={`h-4 w-4 ${integration.status === 'TESTING' ? 'animate-spin' : ''}`} />
                      </button>
                      <button
                        onClick={() => handleEditIntegration(integration)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Edit configuration"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteIntegration(integration.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete integration"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredIntegrations.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No integrations found. Add your first integration to get started.
            </div>
          )}
        </div>
      </div>

      {/* Add Integration Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Add New Integration</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="mb-6">
                <input
                  type="text"
                  placeholder="Search for an integration..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTemplates.map((template) => (
                  <div key={template.id} className="border border-gray-200 rounded-lg p-4 hover:border-emerald-300 hover:bg-emerald-50 transition-colors cursor-pointer">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
                          {template.type === 'API' && <Link className="h-5 w-5 text-blue-500" />}
                          {template.type === 'CSV' && <Upload className="h-5 w-5 text-orange-500" />}
                          {template.type === 'WEBHOOK' && <Activity className="h-5 w-5 text-purple-500" />}
                          {template.type === 'OAUTH' && <Key className="h-5 w-5 text-green-500" />}
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{template.name}</h4>
                          <p className="text-sm text-gray-500">{template.category}</p>
                        </div>
                      </div>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        template.type === 'API' ? 'bg-blue-100 text-blue-800' :
                        template.type === 'CSV' ? 'bg-orange-100 text-orange-800' :
                        template.type === 'WEBHOOK' ? 'bg-purple-100 text-purple-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {template.type}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">{template.description}</p>
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-gray-500">
                        {template.authType}
                      </div>
                      <button
                        onClick={() => handleAddIntegration(template)}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1 rounded text-sm transition-colors"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                ))}
                
                {/* CSV-only integrations */}
                {CSV_INTEGRATIONS.filter(name => 
                  name.toLowerCase().includes(searchTerm.toLowerCase())
                ).map((name) => (
                  <div key={name} className="border border-gray-200 rounded-lg p-4 hover:border-orange-300 hover:bg-orange-50 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
                          <Upload className="h-5 w-5 text-orange-500" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{name}</h4>
                          <p className="text-sm text-gray-500">Manual Import</p>
                        </div>
                      </div>
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">
                        CSV
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">Manual CSV upload for user access data</p>
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-gray-500">
                        CSV Upload
                      </div>
                      <button 
                        onClick={() => handleCSVIntegration(name)}
                        className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 rounded text-sm transition-colors"
                      >
                        Upload CSV
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Configuration Modal */}
      {showConfigModal && selectedTemplate && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingIntegration ? 'Edit' : 'Configure'} {selectedTemplate.name}
              </h3>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Integration Details</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-blue-700 font-medium">Type:</span> {selectedTemplate.type}
                  </div>
                  <div>
                    <span className="text-blue-700 font-medium">Auth:</span> {selectedTemplate.authType}
                  </div>
                  <div className="col-span-2">
                    <span className="text-blue-700 font-medium">API:</span> {selectedTemplate.apiEndpoint || 'N/A'}
                  </div>
                </div>
                <p className="text-blue-700 mt-2">{selectedTemplate.description}</p>
              </div>

              {/* Configuration Fields */}
              <div className="space-y-4">
                {selectedTemplate.fields.map((field) => (
                  <div key={field.name}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {field.name.charAt(0).toUpperCase() + field.name.slice(1).replace(/([A-Z])/g, ' $1')}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    {field.type === 'textarea' ? (
                      <textarea
                        rows={4}
                        value={credentials[field.name] || ''}
                        onChange={(e) => setCredentials(prev => ({ ...prev, [field.name]: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        placeholder={field.placeholder}
                      />
                    ) : field.type === 'select' ? (
                      <select
                        value={credentials[field.name] || ''}
                        onChange={(e) => setCredentials(prev => ({ ...prev, [field.name]: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="">Select...</option>
                        {field.name === 'server' && (
                          <>
                            <option value="production">Production</option>
                            <option value="sandbox">Sandbox</option>
                          </>
                        )}
                      </select>
                    ) : (
                      <input
                        type={field.type}
                        value={credentials[field.name] || ''}
                        onChange={(e) => setCredentials(prev => ({ ...prev, [field.name]: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        placeholder={field.placeholder}
                      />
                    )}
                    <p className="text-xs text-gray-500 mt-1">{field.description}</p>
                  </div>
                ))}
              </div>

              <div className="bg-yellow-50 rounded-lg p-4">
                <h4 className="font-medium text-yellow-900 mb-2">📚 Setup Instructions</h4>
                <p className="text-sm text-yellow-800">
                  For detailed setup instructions, please refer to the{' '}
                  <a 
                    href={selectedTemplate.docsUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="underline hover:text-yellow-900"
                  >
                    official API documentation
                  </a>
                  .
                </p>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => setShowConfigModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveIntegration}
                  className="px-4 py-2 text-sm font-medium text-white bg-emerald-500 rounded-lg hover:bg-emerald-600 transition-colors flex items-center"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {editingIntegration ? 'Update' : 'Save'} Integration
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CSV Upload Modal */}
      {showCSVModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Upload CSV for {selectedCSVTool}
              </h3>
              <button
                onClick={() => setShowCSVModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* CSV Template Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CSV Template Type
                </label>
                <select
                  value={csvTemplate}
                  onChange={(e) => setCsvTemplate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {CSVProcessor.getAvailableTemplates().map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name} - {template.description}
                    </option>
                  ))}
                </select>
                <div className="mt-2">
                  <button
                    onClick={() => downloadCSVTemplate(csvTemplate)}
                    className="text-sm text-blue-600 hover:text-blue-800 underline"
                  >
                    Download template file
                  </button>
                </div>
              </div>

              {/* CSV File Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CSV File
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                  <div className="space-y-1 text-center">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600">
                      <label className="relative cursor-pointer bg-white rounded-md font-medium text-emerald-600 hover:text-emerald-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-emerald-500">
                        <span>Upload a file</span>
                        <input
                          type="file"
                          accept=".csv"
                          onChange={handleCSVFileChange}
                          className="sr-only"
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">CSV files only</p>
                    {csvFile && (
                      <div className="mt-2 text-sm text-green-600">
                        ✓ Selected: {csvFile.name} ({Math.round(csvFile.size / 1024)}KB)
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* CSV Format Help */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">📋 CSV Format Requirements</h4>
                <div className="text-sm text-blue-800 space-y-1">
                  <p>• First row must contain column headers</p>
                  <p>• Email column is required for user identification</p>
                  <p>• Status column should contain: active, inactive, suspended, etc.</p>
                  <p>• Multiple groups can be separated by semicolons (;)</p>
                  <p>• Download the template above for the correct format</p>
                </div>
              </div>

              {/* Expected Results */}
              {csvFile && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Expected Processing</h4>
                  <div className="text-sm text-gray-600">
                    <p>File size: {Math.round(csvFile.size / 1024)}KB</p>
                    <p>Estimated users: ~{Math.max(1, Math.floor(csvFile.size / 100))} (approximate)</p>
                    <p>Processing time: Usually 1-5 seconds</p>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => setShowCSVModal(false)}
                  disabled={csvProcessing}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCSVUpload}
                  disabled={!csvFile || csvProcessing}
                  className="px-4 py-2 text-sm font-medium text-white bg-emerald-500 rounded-lg hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                >
                  {csvProcessing ? (
                    <>
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Process CSV
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
