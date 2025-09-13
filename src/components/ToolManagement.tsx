import React, { useState, useMemo } from 'react';
import { Plus, Trash2, Edit2, Save, X, Key, Eye, EyeOff, TestTube, CheckCircle, AlertCircle, Upload, Download, Search, Filter, ChevronLeft, ChevronRight, RefreshCw, BarChart3 } from 'lucide-react';
import CSVComparison from './CSVComparison';

interface Tool {
  id: string;
  name: string;
  category: string;
  isActive: boolean;
  hasApiSupport?: boolean;
  apiKey?: string;
  apiEndpoint?: string;
  lastSync?: string;
  connectionStatus?: 'connected' | 'disconnected' | 'testing';
  userListFile?: File;
  exitUsersFile?: File;
}

interface ToolManagementProps {
  tools: Tool[];
  onAddTool: (tool: Omit<Tool, 'id'>) => void;
  onUpdateTool: (id: string, tool: Partial<Tool>) => void;
  onDeleteTool: (id: string) => void;
}

export default function ToolManagement({ tools, onAddTool, onUpdateTool, onDeleteTool }: ToolManagementProps) {
  const [isAddingTool, setIsAddingTool] = useState(false);
  const [editingTool, setEditingTool] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedIntegrationType, setSelectedIntegrationType] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [viewMode, setViewMode] = useState<'paginated' | 'all'>('paginated');
  const [syncingTools, setSyncingTools] = useState<Set<string>>(new Set());
  const [syncStatus, setSyncStatus] = useState<Record<string, { status: 'idle' | 'success' | 'error', message: string }>>({});
  
  const [newTool, setNewTool] = useState({ 
    name: '', 
    category: '', 
    isActive: true, 
    hasApiSupport: true,
    apiKey: '', 
    apiEndpoint: '',
    connectionStatus: 'disconnected' as const
  });
  const [editTool, setEditTool] = useState({ 
    name: '', 
    category: '', 
    isActive: true, 
    hasApiSupport: true,
    apiKey: '', 
    apiEndpoint: '',
    connectionStatus: 'disconnected' as const
  });
  const [showApiKeys, setShowApiKeys] = useState<{ [key: string]: boolean }>({});
  const [testingConnection, setTestingConnection] = useState<string | null>(null);
  const [csvComparisonOpen, setCsvComparisonOpen] = useState(false);
  const [selectedToolForComparison, setSelectedToolForComparison] = useState<string | null>(null);

  const categories = [
    'Communication', 
    'Development', 
    'Design', 
    'Cloud Services', 
    'Project Management', 
    'Monitoring', 
    'IT Management', 
    'Documentation', 
    'Security',
    'HR & Recruitment',
    'Finance & Accounting',
    'Marketing & Sales',
    'Analytics',
    'Physical Security',
    'AI & Productivity',
    'Access Review',
    'Email Services',
    'Data & Integration',
    'Customer Support',
    'Content & SEO',
    'Development Tools',
    'Domain & Hosting',
    'Business Tools',
    'Specialized Tools',
    'Other'
  ];

  const predefinedTools = [
    // Communication & Collaboration
    { name: 'Slack', category: 'Communication', hasApiSupport: true, apiEndpoint: 'https://slack.com/api' },
    { name: 'Zoom Video Communications', category: 'Communication', hasApiSupport: true, apiEndpoint: 'https://api.zoom.us/v2' },
    { name: 'RingCentral', category: 'Communication', hasApiSupport: true, apiEndpoint: 'https://platform.ringcentral.com' },
    { name: 'Skype', category: 'Communication', hasApiSupport: true, apiEndpoint: 'https://api.skype.com' },
    { name: 'Aircall.io', category: 'Communication', hasApiSupport: true, apiEndpoint: 'https://api.aircall.io/v1' },
    { name: 'Calendly', category: 'Communication', hasApiSupport: true, apiEndpoint: 'https://api.calendly.com' },
    { name: 'Loom', category: 'Communication', hasApiSupport: true, apiEndpoint: 'https://api.loom.com/v1' },
    { name: 'Vimeo', category: 'Communication', hasApiSupport: true, apiEndpoint: 'https://api.vimeo.com' },
    
    // Development & DevOps
    { name: 'GitHub Copilot', category: 'Development', hasApiSupport: true, apiEndpoint: 'https://api.github.com' },
    { name: 'Bitbucket', category: 'Development', hasApiSupport: true, apiEndpoint: 'https://api.bitbucket.org/2.0' },
    { name: 'NPM Org', category: 'Development', hasApiSupport: true, apiEndpoint: 'https://registry.npmjs.org' },
    { name: 'Jira', category: 'Development', hasApiSupport: true, apiEndpoint: 'https://api.atlassian.com/ex/jira' },
    { name: 'Confluence', category: 'Development', hasApiSupport: true, apiEndpoint: 'https://api.atlassian.com/ex/confluence' },
    { name: 'Sentry - Production - SS', category: 'Development', hasApiSupport: true, apiEndpoint: 'https://sentry.io/api/0' },
    { name: 'Sentry - Production - TS', category: 'Development', hasApiSupport: true, apiEndpoint: 'https://sentry.io/api/0' },
    { name: 'Sentry - Staging', category: 'Development', hasApiSupport: true, apiEndpoint: 'https://sentry.io/api/0' },
    { name: 'Testsigma', category: 'Development', hasApiSupport: true, apiEndpoint: 'https://api.testsigma.com/v1' },
    { name: 'Browserstack', category: 'Development', hasApiSupport: true, apiEndpoint: 'https://api.browserstack.com' },
    { name: 'Burpsuite', category: 'Development', hasApiSupport: true, apiEndpoint: 'https://portswigger.net/burp/api' },
    { name: 'NGROK.COM', category: 'Development', hasApiSupport: true, apiEndpoint: 'https://api.ngrok.com' },
    { name: 'Zapier', category: 'Development', hasApiSupport: true, apiEndpoint: 'https://api.zapier.com/v1' },
    { name: 'Clickup', category: 'Development', hasApiSupport: true, apiEndpoint: 'https://api.clickup.com/api/v2' },
    
    // Design & Creative
    { name: 'Figma', category: 'Design', hasApiSupport: true, apiEndpoint: 'https://api.figma.com/v1' },
    { name: 'Adobe Creative Cloud', category: 'Design', hasApiSupport: true, apiEndpoint: 'https://api.adobe.com' },
    { name: 'Canva', category: 'Design', hasApiSupport: true, apiEndpoint: 'https://api.canva.com/rest/v1' },
    { name: 'Whimsical', category: 'Design', hasApiSupport: true, apiEndpoint: 'https://api.whimsical.com/v1' },
    { name: 'Webflow', category: 'Design', hasApiSupport: true, apiEndpoint: 'https://api.webflow.com/v2' },
    { name: 'Unbounce', category: 'Design', hasApiSupport: true, apiEndpoint: 'https://api.unbounce.com/v2' },
    { name: 'Rawpixel', category: 'Design', hasApiSupport: true, apiEndpoint: 'https://api.rawpixel.com/v1' },
    { name: 'Freepik', category: 'Design', hasApiSupport: true, apiEndpoint: 'https://api.freepik.com/v1' },
    { name: 'Iconscout', category: 'Design', hasApiSupport: true, apiEndpoint: 'https://api.iconscout.com/v3' },
    
    // Cloud & Infrastructure
    { name: 'AWS', category: 'Cloud Services', hasApiSupport: true, apiEndpoint: 'https://iam.amazonaws.com' },
    { name: 'Google Cloud', category: 'Cloud Services', hasApiSupport: true, apiEndpoint: 'https://cloudresourcemanager.googleapis.com/v1' },
    { name: 'Microsoft 365 for Business', category: 'Cloud Services', hasApiSupport: true, apiEndpoint: 'https://graph.microsoft.com/v1.0' },
    { name: 'Microsoft 365 for Business Basic', category: 'Cloud Services', hasApiSupport: true, apiEndpoint: 'https://graph.microsoft.com/v1.0' },
    { name: 'G Suite Enterprise (Fixed 300 license)', category: 'Cloud Services', hasApiSupport: true, apiEndpoint: 'https://admin.googleapis.com' },
    { name: 'G Suite Basic', category: 'Cloud Services', hasApiSupport: true, apiEndpoint: 'https://admin.googleapis.com' },
    { name: 'Cloudflare', category: 'Cloud Services', hasApiSupport: true, apiEndpoint: 'https://api.cloudflare.com/client/v4' },
    { name: 'Forticloud', category: 'Cloud Services', hasApiSupport: true, apiEndpoint: 'https://api.forticloud.com' },
    { name: 'Fortigate Firewall', category: 'Cloud Services', hasApiSupport: true, apiEndpoint: 'https://api.fortinet.com' },
    
    // Monitoring & Analytics
    { name: 'New Relic', category: 'Monitoring', hasApiSupport: true, apiEndpoint: 'https://api.newrelic.com/v2' },
    { name: 'Logz.io', category: 'Monitoring', hasApiSupport: true, apiEndpoint: 'https://api.logz.io/v1' },
    { name: 'UptimeRobot - SS', category: 'Monitoring', hasApiSupport: true, apiEndpoint: 'https://api.uptimerobot.com/v2' },
    { name: 'UptimeRobot - TS', category: 'Monitoring', hasApiSupport: true, apiEndpoint: 'https://api.uptimerobot.com/v2' },
    { name: 'Zenduty', category: 'Monitoring', hasApiSupport: true, apiEndpoint: 'https://api.zenduty.com/v1' },
    { name: 'Crazy Egg', category: 'Analytics', hasApiSupport: true, apiEndpoint: 'https://api.crazyegg.com/v1' },
    { name: 'LuckyOrange', category: 'Analytics', hasApiSupport: true, apiEndpoint: 'https://api.luckyorange.com/v1' },
    { name: 'Heap Analytics', category: 'Analytics', hasApiSupport: true, apiEndpoint: 'https://api.heapanalytics.com/v1' },
    { name: 'Power Bi Premium', category: 'Analytics', hasApiSupport: true, apiEndpoint: 'https://api.powerbi.com/v1.0' },
    { name: 'Power Bi Pro', category: 'Analytics', hasApiSupport: true, apiEndpoint: 'https://api.powerbi.com/v1.0' },
    { name: 'Google Analytics', category: 'Analytics', hasApiSupport: true, apiEndpoint: 'https://analyticsreporting.googleapis.com/v4' },
    { name: 'Google Search Console', category: 'Analytics', hasApiSupport: true, apiEndpoint: 'https://searchconsole.googleapis.com/v1' },
    { name: 'Ahrefs', category: 'Analytics', hasApiSupport: true, apiEndpoint: 'https://apiv2.ahrefs.com' },
    { name: 'SurferSEO', category: 'Analytics', hasApiSupport: true, apiEndpoint: 'https://api.surfer.com/v1' },
    { name: 'Read.ai', category: 'Analytics', hasApiSupport: true, apiEndpoint: 'https://api.read.ai/v1' },
    
    // IT Management & Security
    { name: 'Jump Cloud', category: 'IT Management', hasApiSupport: true, apiEndpoint: 'https://console.jumpcloud.com/api' },
    { name: 'End Point Central', category: 'IT Management', hasApiSupport: true, apiEndpoint: 'https://api.manageengine.com' },
    { name: 'Heimdal - Anti Virus', category: 'Security', hasApiSupport: true, apiEndpoint: 'https://api.heimdalsecurity.com' },
    { name: 'Auzmor', category: 'IT Management', hasApiSupport: true, apiEndpoint: 'https://api.auzmor.com/v1' },
    
    // HR & Recruitment
    { name: 'LinkedIn - HR team', category: 'HR & Recruitment', hasApiSupport: true, apiEndpoint: 'https://api.linkedin.com/v2' },
    { name: 'KeKa', category: 'HR & Recruitment', hasApiSupport: true, apiEndpoint: 'https://api.keka.com' },
    { name: 'Evalgator Candidate Evaluation Platform', category: 'HR & Recruitment', hasApiSupport: true, apiEndpoint: 'https://api.evalgator.com/v1' },
    { name: 'Gusto', category: 'HR & Recruitment', hasApiSupport: true, apiEndpoint: 'https://api.gusto.com/v1' },
    
    // Finance & Accounting
    { name: 'Quickbooks', category: 'Finance & Accounting', hasApiSupport: true, apiEndpoint: 'https://sandbox-quickbooks.api.intuit.com' },
    { name: 'Stripe', category: 'Finance & Accounting', hasApiSupport: true, apiEndpoint: 'https://api.stripe.com/v1' },
    { name: 'Paddle (Vendor for Partnership management tool)', category: 'Finance & Accounting', hasApiSupport: true, apiEndpoint: 'https://api.paddle.com/v2' },
    { name: 'FastSpring', category: 'Finance & Accounting', hasApiSupport: true, apiEndpoint: 'https://api.fastspring.com' },
    { name: 'Astrella - LTSE Cap Table', category: 'Finance & Accounting', hasApiSupport: true, apiEndpoint: 'https://api.astrella.com/v1' },
    
    // Marketing & Sales
    { name: 'Hubspot', category: 'Marketing & Sales', hasApiSupport: true, apiEndpoint: 'https://api.hubapi.com' },
    { name: 'Apollo.io', category: 'Marketing & Sales', hasApiSupport: true, apiEndpoint: 'https://api.apollo.io/v1' },
    { name: 'Vitally', category: 'Marketing & Sales', hasApiSupport: true, apiEndpoint: 'https://api.vitally.io/v1' },
    { name: 'Zendesk', category: 'Marketing & Sales', hasApiSupport: true, apiEndpoint: 'https://api.zendesk.com/api/v2' },
    { name: 'LinkedIn - Sales Navigator', category: 'Marketing & Sales', hasApiSupport: false },
    { name: 'Outplay', category: 'Marketing & Sales', hasApiSupport: true, apiEndpoint: 'https://api.outplayhq.com' },
    { name: 'Lemlist', category: 'Marketing & Sales', hasApiSupport: true, apiEndpoint: 'https://api.lemlist.com/v1' },
    { name: 'Clay Labs', category: 'Marketing & Sales', hasApiSupport: true, apiEndpoint: 'https://api.clay.com/v1' },
    { name: 'Easyleadz', category: 'Marketing & Sales', hasApiSupport: true, apiEndpoint: 'https://api.easyleadz.com/v1' },
    { name: 'Respona', category: 'Marketing & Sales', hasApiSupport: true, apiEndpoint: 'https://api.respona.com/v1' },
    { name: 'ReachInbox', category: 'Marketing & Sales', hasApiSupport: true, apiEndpoint: 'https://api.reachinbox.com/v1' },
    { name: 'SaaSAnt', category: 'Marketing & Sales', hasApiSupport: true, apiEndpoint: 'https://api.saasant.com/v1' },
    { name: 'PartnerStack', category: 'Marketing & Sales', hasApiSupport: true, apiEndpoint: 'https://api.partnerstack.com/v1' },
    { name: 'PartnerStack - Usage based', category: 'Marketing & Sales', hasApiSupport: true, apiEndpoint: 'https://api.partnerstack.com/v1' },
    
    // Email & Communication Services
    { name: 'Sendgrid - (Engineering)', category: 'Email Services', hasApiSupport: true, apiEndpoint: 'https://api.sendgrid.com/v3' },
    { name: 'Sendgrid- (Marketing)', category: 'Email Services', hasApiSupport: true, apiEndpoint: 'https://api.sendgrid.com/v3' },
    { name: 'SparkPost - US - Production - SS', category: 'Email Services', hasApiSupport: true, apiEndpoint: 'https://api.sparkpost.com/api/v1' },
    { name: 'SparkPost - EU - Production - SS', category: 'Email Services', hasApiSupport: true, apiEndpoint: 'https://api.sparkpost.com/api/v1' },
    { name: 'SparkPost - US - Production - TS', category: 'Email Services', hasApiSupport: true, apiEndpoint: 'https://api.sparkpost.com/api/v1' },
    { name: 'SparkPost - EU - Production - TS', category: 'Email Services', hasApiSupport: true, apiEndpoint: 'https://api.sparkpost.com/api/v1' },
    { name: 'SparkPost - Staging - SS', category: 'Email Services', hasApiSupport: true, apiEndpoint: 'https://api.sparkpost.com/api/v1' },
    { name: 'Sinch Mailgun - Production', category: 'Email Services', hasApiSupport: true, apiEndpoint: 'https://api.mailgun.net/v3' },
    { name: 'Sinch Mailgun - Staging', category: 'Email Services', hasApiSupport: true, apiEndpoint: 'https://api.mailgun.net/v3' },
    { name: 'Sendinblue - SS', category: 'Email Services', hasApiSupport: true, apiEndpoint: 'https://api.brevo.com/v3' },
    { name: 'Sendinblue - TS', category: 'Email Services', hasApiSupport: true, apiEndpoint: 'https://api.brevo.com/v3' },
    { name: 'Twilio - Staging', category: 'Email Services', hasApiSupport: true, apiEndpoint: 'https://api.twilio.com' },
    { name: 'Twilio - Production', category: 'Email Services', hasApiSupport: true, apiEndpoint: 'https://api.twilio.com' },
    { name: 'Mailosaur', category: 'Email Services', hasApiSupport: true, apiEndpoint: 'https://mailosaur.com/api' },
    { name: 'DeBounce', category: 'Email Services', hasApiSupport: true, apiEndpoint: 'https://api.debounce.io/v1' },
    { name: 'VoilaNorbert', category: 'Email Services', hasApiSupport: true, apiEndpoint: 'https://api.voilanorbert.com/v1' },
    { name: 'Zerobounce', category: 'Email Services', hasApiSupport: true, apiEndpoint: 'https://api.zerobounce.net/v2' },
    { name: 'Quick Email Verification', category: 'Email Services', hasApiSupport: true, apiEndpoint: 'https://api.quickemailverification.com/v1' },
    { name: 'Public Data Check', category: 'Email Services', hasApiSupport: true, apiEndpoint: 'https://api.publicdatacheck.com/v1' },
    
    // AI & Productivity
    { name: 'Open AI (Chatgpt) - Production', category: 'AI & Productivity', hasApiSupport: true, apiEndpoint: 'https://api.openai.com/v1' },
    { name: 'Open AI (Chatgpt) - Subscription', category: 'AI & Productivity', hasApiSupport: true, apiEndpoint: 'https://api.openai.com/v1' },
    { name: 'Claude.ai', category: 'AI & Productivity', hasApiSupport: true, apiEndpoint: 'https://api.anthropic.com' },
    { name: 'Perplexity AI', category: 'AI & Productivity', hasApiSupport: true, apiEndpoint: 'https://api.perplexity.ai/v1' },
    { name: 'Compose AI', category: 'AI & Productivity', hasApiSupport: true, apiEndpoint: 'https://api.compose.ai/v1' },
    { name: 'HeyGen', category: 'AI & Productivity', hasApiSupport: true, apiEndpoint: 'https://api.heygen.com/v1' },
    { name: 'Originality.AI', category: 'AI & Productivity', hasApiSupport: true, apiEndpoint: 'https://api.originality.ai/v1' },
    { name: 'Midjourney', category: 'AI & Productivity', hasApiSupport: true, apiEndpoint: 'https://api.midjourney.com/v1' },
    { name: 'Grammarly', category: 'AI & Productivity', hasApiSupport: true, apiEndpoint: 'https://api.grammarly.com/v1' },
    { name: 'Evabot', category: 'AI & Productivity', hasApiSupport: true, apiEndpoint: 'https://api.evabot.com/v1' },
    { name: 'Evaboot', category: 'AI & Productivity', hasApiSupport: true, apiEndpoint: 'https://api.evaboot.com/v1' },
    { name: 'Zipy.AI - SS', category: 'AI & Productivity', hasApiSupport: true, apiEndpoint: 'https://api.zipy.ai/v1' },
    { name: 'Zipy.AI - TS', category: 'AI & Productivity', hasApiSupport: true, apiEndpoint: 'https://api.zipy.ai/v1' },
    
    // Data & Integration
    { name: 'Fivetran', category: 'Data & Integration', hasApiSupport: true, apiEndpoint: 'https://api.fivetran.com/v1' },
    { name: 'Airbyte', category: 'Data & Integration', hasApiSupport: true, apiEndpoint: 'https://api.airbyte.com/v1' },
    { name: 'Merge API', category: 'Data & Integration', hasApiSupport: true, apiEndpoint: 'https://api.merge.dev/v1' },
    { name: 'Datawarehouse.io', category: 'Data & Integration', hasApiSupport: true, apiEndpoint: 'https://api.datawarehouse.io/v1' },
    { name: 'Airtable', category: 'Data & Integration', hasApiSupport: true, apiEndpoint: 'https://api.airtable.com/v0' },
    { name: 'Rows', category: 'Data & Integration', hasApiSupport: true, apiEndpoint: 'https://api.rows.com/v1' },
    
    // Customer Support & Communication
    { name: 'Intercom', category: 'Customer Support', hasApiSupport: true, apiEndpoint: 'https://api.intercom.io/v2' },
    { name: 'Discourse', category: 'Customer Support', hasApiSupport: true, apiEndpoint: 'https://api.discourse.org/v1' },
    { name: 'Fireflies', category: 'Customer Support', hasApiSupport: true, apiEndpoint: 'https://api.fireflies.ai/v1' },
    { name: 'Read.ai', category: 'Customer Support', hasApiSupport: true, apiEndpoint: 'https://api.read.ai/v1' },
    
    // Content & SEO
    { name: 'Content Square Inc.', category: 'Content & SEO', hasApiSupport: true, apiEndpoint: 'https://api.contentsquare.com/v1' },
    { name: 'Reviewshake/ Datashake', category: 'Content & SEO', hasApiSupport: true, apiEndpoint: 'https://api.reviewshake.com/v1' },
    { name: 'Litmus', category: 'Content & SEO', hasApiSupport: true, apiEndpoint: 'https://api.litmus.com/v1' },
    { name: 'Disqus', category: 'Content & SEO', hasApiSupport: true, apiEndpoint: 'https://disqus.com/api/3.0' },
    { name: 'Cookieyes', category: 'Content & SEO', hasApiSupport: true, apiEndpoint: 'https://api.cookieyes.com/v1' },
    
    // Development Tools & Testing
    { name: 'Jam F', category: 'Development Tools', hasApiSupport: true, apiEndpoint: 'https://api.jamf.com/v1' },
    { name: 'Arcade Software', category: 'Development Tools', hasApiSupport: true, apiEndpoint: 'https://api.arcade.software/v1' },
    { name: 'Crystal Project', category: 'Development Tools', hasApiSupport: true, apiEndpoint: 'https://api.crystalproject.com/v1' },
    { name: 'GROKABILITY', category: 'Development Tools', hasApiSupport: true, apiEndpoint: 'https://api.grokability.com/v1' },
    
    // Domain & Hosting
    { name: 'Namecheap', category: 'Domain & Hosting', hasApiSupport: true, apiEndpoint: 'https://api.namecheap.com/xml.response' },
    { name: 'GoDaddy', category: 'Domain & Hosting', hasApiSupport: true, apiEndpoint: 'https://api.godaddy.com/v1' },
    { name: 'Tasjeel - Domain', category: 'Domain & Hosting', hasApiSupport: true, apiEndpoint: 'https://api.tasjeel.com/v1' },
    { name: 'Apple.com', category: 'Domain & Hosting', hasApiSupport: true, apiEndpoint: 'https://api.apple.com/v1' },
    
    // Business & Productivity
    { name: 'Dropbox Sign', category: 'Business Tools', hasApiSupport: true, apiEndpoint: 'https://api.hellosign.com/v3' },
    { name: 'Dropbox Storage', category: 'Business Tools', hasApiSupport: true, apiEndpoint: 'https://api.dropboxapi.com/2' },
    { name: 'Cab Management Tool', category: 'Business Tools', hasApiSupport: true, apiEndpoint: 'https://api.cabmanagement.com/v1' },
    { name: 'Document Studio', category: 'Business Tools', hasApiSupport: true, apiEndpoint: 'https://api.documentstudio.com/v1' },
    { name: 'Sejda', category: 'Business Tools', hasApiSupport: true, apiEndpoint: 'https://api.sejda.com/v1' },
    { name: 'Virtualpost', category: 'Business Tools', hasApiSupport: true, apiEndpoint: 'https://api.virtualpost.com/v1' },
    
    // Specialized Tools
    { name: 'Entries ai', category: 'Specialized Tools', hasApiSupport: true, apiEndpoint: 'https://api.entries.ai' },
    { name: 'Cybot', category: 'Specialized Tools', hasApiSupport: true, apiEndpoint: 'https://api.cybot.com/v1' },
    { name: 'CM.COM', category: 'Specialized Tools', hasApiSupport: true, apiEndpoint: 'https://api.cm.com/v1' },
    { name: 'AppSumo', category: 'Specialized Tools', hasApiSupport: true, apiEndpoint: 'https://api.appsumo.com/v1' },
    { name: 'Indie Hackers', category: 'Specialized Tools', hasApiSupport: true, apiEndpoint: 'https://api.indiehackers.com/v1' },
    { name: 'Copyscape', category: 'Specialized Tools', hasApiSupport: true, apiEndpoint: 'https://api.copyscape.com/v1' },
    { name: 'Blogarama', category: 'Specialized Tools', hasApiSupport: true, apiEndpoint: 'https://api.blogarama.com/v1' },
    
    // Access Review Tools
    { name: 'Zuluri', category: 'Access Review', hasApiSupport: true, apiEndpoint: 'https://api.zuluri.com/v1' },
  ];

  // Filter and search logic
  const filteredTools = useMemo(() => {
    return tools.filter(tool => {
      const matchesSearch = tool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           tool.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === '' || tool.category === selectedCategory;
      const matchesStatus = selectedStatus === '' || 
                           (selectedStatus === 'active' && tool.isActive) ||
                           (selectedStatus === 'inactive' && !tool.isActive) ||
                           (selectedStatus === 'connected' && tool.connectionStatus === 'connected') ||
                           (selectedStatus === 'disconnected' && tool.connectionStatus === 'disconnected');
      const matchesIntegrationType = selectedIntegrationType === '' ||
                                   (selectedIntegrationType === 'api' && tool.hasApiSupport) ||
                                   (selectedIntegrationType === 'csv' && !tool.hasApiSupport);
      
      return matchesSearch && matchesCategory && matchesStatus && matchesIntegrationType;
    });
  }, [tools, searchTerm, selectedCategory, selectedStatus, selectedIntegrationType]);

  // Pagination logic
  const totalPages = Math.ceil(filteredTools.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentTools = viewMode === 'paginated' ? filteredTools.slice(startIndex, endIndex) : filteredTools;

  // Reset to first page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, selectedStatus, selectedIntegrationType, itemsPerPage]);

  const handleAddTool = () => {
    if (newTool.name && newTool.category) {
      onAddTool(newTool);
      setNewTool({ 
        name: '', 
        category: '', 
        isActive: true, 
        hasApiSupport: true,
        apiKey: '', 
        apiEndpoint: '',
        connectionStatus: 'disconnected'
      });
      setIsAddingTool(false);
    }
  };

  const handleAddPredefinedTool = (predefinedTool: any) => {
    const toolToAdd = {
      ...predefinedTool,
      isActive: true,
      connectionStatus: 'disconnected' as const,
      apiKey: ''
    };
    onAddTool(toolToAdd);
  };

  const handleEditTool = (tool: Tool) => {
    setEditingTool(tool.id);
    setEditTool({ 
      name: tool.name, 
      category: tool.category, 
      isActive: tool.isActive,
      hasApiSupport: tool.hasApiSupport,
      apiKey: tool.apiKey || '',
      apiEndpoint: tool.apiEndpoint || '',
      connectionStatus: tool.connectionStatus || 'disconnected'
    });
  };

  const handleSaveEdit = () => {
    if (editingTool && editTool.name && editTool.category) {
      onUpdateTool(editingTool, editTool);
      setEditingTool(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingTool(null);
    setEditTool({ 
      name: '', 
      category: '', 
      isActive: true, 
      hasApiSupport: true,
      apiKey: '', 
      apiEndpoint: '',
      connectionStatus: 'disconnected'
    });
  };

  const toggleApiKeyVisibility = (toolId: string) => {
    setShowApiKeys(prev => ({
      ...prev,
      [toolId]: !prev[toolId]
    }));
  };

  const handleTestConnection = async (toolId: string) => {
    setTestingConnection(toolId);
    
    // Simulate API connection test
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Randomly simulate success/failure for demo
    const isSuccess = Math.random() > 0.3;
    const status = isSuccess ? 'connected' : 'disconnected';
    
    onUpdateTool(toolId, { 
      connectionStatus: status as 'connected' | 'disconnected' | 'testing',
      lastSync: isSuccess ? new Date().toISOString() : undefined
    });
    
    setTestingConnection(null);
  };

  const handleFileUpload = (toolId: string, fileType: 'userList' | 'exitUsers', file: File) => {
    onUpdateTool(toolId, {
      [fileType === 'userList' ? 'userListFile' : 'exitUsersFile']: file
    });
  };

  const handleCSVComparison = (toolId: string) => {
    const tool = tools.find(t => t.id === toolId);
    if (tool) {
      setSelectedToolForComparison(tool.name);
      setCsvComparisonOpen(true);
    }
  };

  const handleComparisonComplete = (results: any) => {
    console.log('Comparison completed:', results);
    // Here you could store the results or trigger other actions
    setCsvComparisonOpen(false);
    setSelectedToolForComparison(null);
  };

  const syncToolUsers = async (tool: Tool) => {
    if (!tool.apiKey || !tool.apiEndpoint) {
      setSyncStatus(prev => ({
        ...prev,
        [tool.id]: { status: 'error', message: 'API key and endpoint required' }
      }));
      return;
    }

    setSyncingTools(prev => new Set(prev).add(tool.id));
    setSyncStatus(prev => ({
      ...prev,
      [tool.id]: { status: 'idle', message: 'Syncing users...' }
    }));

    try {
      // Use our backend proxy to avoid CORS issues
      const response = await fetch('https://access-review-production.up.railway.app/api/proxy/test-tool', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken') || 'demo-token'}`
        },
        body: JSON.stringify({
          toolName: tool.name,
          apiKey: tool.apiKey,
          endpoint: tool.apiEndpoint
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Connection failed: ${response.status}`);
      }

      const data = await response.json();
      const users = data.users || [];
      
      // Store synced users
      const usersToStore = users.map((user: any, index: number) => ({
        id: `user-${Date.now()}-${tool.id}-${index}`,
        tool: tool.name,
        email: user.email || user.username || `user${index}@${tool.name.toLowerCase()}.com`,
        role: user.role || 'user',
        status: user.status === 'active' ? 'ACTIVE' : 'INACTIVE',
        lastLogin: user.lastLogin || new Date().toISOString(),
        permissions: user.permissions || [],
        syncedAt: new Date().toISOString(),
        department: user.department || 'Unknown',
        manager: user.manager || 'Unknown',
        joinDate: user.joinDate || new Date().toISOString()
      }));

      // Store in localStorage for demo
      const existingUsers = JSON.parse(localStorage.getItem('syncedUsers') || '[]');
      const updatedUsers = [...existingUsers, ...usersToStore];
      localStorage.setItem('syncedUsers', JSON.stringify(updatedUsers));

      // Update tool with sync timestamp
      onUpdateTool(tool.id, { lastSync: new Date().toISOString() });

      setSyncStatus(prev => ({
        ...prev,
        [tool.id]: { status: 'success', message: `Successfully synced ${usersToStore.length} users` }
      }));

    } catch (error) {
      setSyncStatus(prev => ({
        ...prev,
        [tool.id]: { 
          status: 'error', 
          message: `Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
        }
      }));
    } finally {
      setSyncingTools(prev => {
        const newSet = new Set(prev);
        newSet.delete(tool.id);
        return newSet;
      });
    }
  };

  const getConnectionStatusIcon = (status?: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'testing':
        return <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>;
      case 'disconnected':
      default:
        return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getConnectionStatusText = (status?: string) => {
    switch (status) {
      case 'connected':
        return 'Connected';
      case 'testing':
        return 'Testing...';
      case 'disconnected':
      default:
        return 'Disconnected';
    }
  };

  const availablePredefinedTools = predefinedTools.filter(
    predefined => !tools.some(tool => tool.name === predefined.name)
  );

  const handleBulkAddTools = () => {
    availablePredefinedTools.forEach(tool => {
      handleAddPredefinedTool(tool);
    });
  };

  const exportToolsData = () => {
    const csv = [
      ['Tool Name', 'Category', 'Status', 'API Support', 'Connection Status', 'Last Sync'],
      ...filteredTools.map(tool => [
        tool.name,
        tool.category,
        tool.isActive ? 'Active' : 'Inactive',
        tool.hasApiSupport ? 'Yes' : 'No',
        tool.connectionStatus || 'Not Set',
        tool.lastSync ? new Date(tool.lastSync).toLocaleDateString() : 'Never'
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'surveysparrow_tools_export.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-6 space-y-4 lg:space-y-0">
        <div>
          <h3 className="text-lg font-medium text-gray-900">SurveySparrow Tools Management</h3>
          <p className="text-sm text-gray-500 mt-1">
            Manage {tools.length} tools with API integration and CSV upload support
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={exportToolsData}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md font-medium flex items-center space-x-2 transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>Export</span>
          </button>
          <button
            onClick={() => setIsAddingTool(true)}
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-md font-medium flex items-center space-x-2 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Add Custom Tool</span>
          </button>
          {availablePredefinedTools.length > 0 && (
            <button
              onClick={handleBulkAddTools}
              className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-md font-medium flex items-center space-x-2 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Add All ({availablePredefinedTools.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* Filters and Search */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Search Tools</label>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name or category..."
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          >
            <option value="">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="connected">Connected</option>
            <option value="disconnected">Disconnected</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Integration Type</label>
          <select
            value={selectedIntegrationType}
            onChange={(e) => setSelectedIntegrationType(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          >
            <option value="">All Types</option>
            <option value="api">API Integration</option>
            <option value="csv">CSV Upload Only</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">View Mode</label>
          <select
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value as 'paginated' | 'all')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          >
            <option value="paginated">Paginated</option>
            <option value="all">Show All</option>
          </select>
        </div>

        {viewMode === 'paginated' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Per Page</label>
            <select
              value={itemsPerPage}
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        )}
      </div>

      {/* Results Summary */}
      <div className="flex justify-between items-center mb-4">
        <div className="text-sm text-gray-600">
          <Filter className="h-4 w-4 inline mr-1" />
          Showing {currentTools.length} of {filteredTools.length} tools
          {viewMode === 'paginated' && ` (Page ${currentPage} of ${totalPages})`}
        </div>
        
        {viewMode === 'paginated' && totalPages > 1 && (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="p-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            
            <span className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
            
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="p-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Add New Tool Form */}
      {isAddingTool && (
        <div className="mb-6 p-6 bg-gray-50 rounded-lg border border-gray-200">
          <h4 className="text-md font-medium text-gray-900 mb-4">Add Custom Tool</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tool Name *</label>
              <input
                type="text"
                value={newTool.name}
                onChange={(e) => setNewTool({ ...newTool, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="e.g., Custom Tool"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
              <select
                value={newTool.category}
                onChange={(e) => setNewTool({ ...newTool, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                <option value="">Select category...</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <input
                  type="checkbox"
                  id="hasApiSupport"
                  checked={newTool.hasApiSupport}
                  onChange={(e) => setNewTool({ ...newTool, hasApiSupport: e.target.checked })}
                  className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="hasApiSupport" className="text-sm text-gray-700">
                  This tool supports API integration
                </label>
              </div>
            </div>
            {newTool.hasApiSupport && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">API Endpoint</label>
                  <input
                    type="url"
                    value={newTool.apiEndpoint}
                    onChange={(e) => setNewTool({ ...newTool, apiEndpoint: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="https://api.example.com/v1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
                  <div className="relative">
                    <input
                      type="password"
                      value={newTool.apiKey}
                      onChange={(e) => setNewTool({ ...newTool, apiKey: e.target.value })}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      placeholder="Enter API key or token"
                    />
                    <Key className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
                  </div>
                </div>
              </>
            )}
          </div>
          <div className="flex items-center space-x-2 mb-4">
            <input
              type="checkbox"
              id="newToolActive"
              checked={newTool.isActive}
              onChange={(e) => setNewTool({ ...newTool, isActive: e.target.checked })}
              className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
            />
            <label htmlFor="newToolActive" className="text-sm text-gray-700">
              Activate tool immediately
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleAddTool}
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-md font-medium flex items-center space-x-1 transition-colors"
            >
              <Save className="h-4 w-4" />
              <span>Save Tool</span>
            </button>
            <button
              onClick={() => setIsAddingTool(false)}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md font-medium flex items-center space-x-1 transition-colors"
            >
              <X className="h-4 w-4" />
              <span>Cancel</span>
            </button>
          </div>
        </div>
      )}

      {/* Tools Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tool Details</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Integration Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">API Configuration</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CSV Upload</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CSV Analysis</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentTools.map((tool) => (
              <tr key={tool.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="space-y-1">
                    {editingTool === tool.id ? (
                      <>
                        <input
                          type="text"
                          value={editTool.name}
                          onChange={(e) => setEditTool({ ...editTool, name: e.target.value })}
                          className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                        />
                        <select
                          value={editTool.category}
                          onChange={(e) => setEditTool({ ...editTool, category: e.target.value })}
                          className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500 text-sm"
                        >
                          {categories.map(category => (
                            <option key={category} value={category}>{category}</option>
                          ))}
                        </select>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-900">{tool.name}</span>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            tool.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {tool.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">{tool.category}</span>
                      </>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-2">
                    {tool.hasApiSupport ? (
                      <>
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="text-sm text-blue-700 font-medium">API Integration</span>
                      </>
                    ) : (
                      <>
                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                        <span className="text-sm text-orange-700 font-medium">CSV Upload Only</span>
                      </>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  {tool.hasApiSupport ? (
                    <div className="space-y-2">
                      {editingTool === tool.id ? (
                        <>
                          <input
                            type="url"
                            value={editTool.apiEndpoint}
                            onChange={(e) => setEditTool({ ...editTool, apiEndpoint: e.target.value })}
                            className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500 text-sm"
                            placeholder="API Endpoint"
                          />
                          <input
                            type="password"
                            value={editTool.apiKey}
                            onChange={(e) => setEditTool({ ...editTool, apiKey: e.target.value })}
                            className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500 text-sm"
                            placeholder="API Key"
                          />
                        </>
                      ) : (
                        <>
                          <div className="text-xs text-gray-600 truncate max-w-xs">
                            {tool.apiEndpoint || 'No endpoint configured'}
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-gray-600">
                              {tool.apiKey ? '••••••••••••' : 'No API key'}
                            </span>
                            {tool.apiKey && (
                              <button
                                onClick={() => toggleApiKeyVisibility(tool.id)}
                                className="text-gray-400 hover:text-gray-600"
                              >
                                {showApiKeys[tool.id] ? (
                                  <EyeOff className="h-3 w-3" />
                                ) : (
                                  <Eye className="h-3 w-3" />
                                )}
                              </button>
                            )}
                          </div>
                          {showApiKeys[tool.id] && tool.apiKey && (
                            <div className="text-xs font-mono bg-gray-100 p-2 rounded border break-all">
                              {tool.apiKey}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-gray-500">API not supported</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="space-y-2">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">User List CSV</label>
                      <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded text-xs flex items-center space-x-1 transition-colors">
                        <Upload className="h-3 w-3" />
                        <span>Upload</span>
                        <input
                          type="file"
                          accept=".csv"
                          onChange={(e) => e.target.files?.[0] && handleFileUpload(tool.id, 'userList', e.target.files[0])}
                          className="hidden"
                        />
                      </label>
                      {tool.userListFile && (
                        <span className="text-xs text-green-600 block mt-1">{tool.userListFile.name}</span>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Exit Users CSV</label>
                      <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded text-xs flex items-center space-x-1 transition-colors">
                        <Upload className="h-3 w-3" />
                        <span>Upload</span>
                        <input
                          type="file"
                          accept=".csv"
                          onChange={(e) => e.target.files?.[0] && handleFileUpload(tool.id, 'exitUsers', e.target.files[0])}
                          className="hidden"
                        />
                      </label>
                      {tool.exitUsersFile && (
                        <span className="text-xs text-green-600 block mt-1">{tool.exitUsersFile.name}</span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="space-y-2">
                    <button
                      onClick={() => handleCSVComparison(tool.id)}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs font-medium flex items-center space-x-1 transition-colors"
                      title="Compare user data with exit users"
                    >
                      <BarChart3 className="h-3 w-3" />
                      <span>Compare</span>
                    </button>
                    <div className="text-xs text-gray-500">
                      {tool.userListFile && tool.exitUsersFile ? (
                        <span className="text-green-600">Ready for analysis</span>
                      ) : (
                        <span className="text-gray-400">Upload files first</span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      {testingConnection === tool.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                      ) : (
                        getConnectionStatusIcon(tool.connectionStatus)
                      )}
                      <span className="text-xs text-gray-600">
                        {testingConnection === tool.id ? 'Testing...' : getConnectionStatusText(tool.connectionStatus)}
                      </span>
                    </div>
                    {tool.lastSync && (
                      <div className="text-xs text-gray-500">
                        Last sync: {new Date(tool.lastSync).toLocaleDateString()}
                      </div>
                    )}
                    {syncStatus[tool.id] && (
                      <div className={`text-xs mt-1 ${
                        syncStatus[tool.id].status === 'success' 
                          ? 'text-green-600' 
                          : syncStatus[tool.id].status === 'error'
                          ? 'text-red-600'
                          : 'text-blue-600'
                      }`}>
                        {syncStatus[tool.id].message}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center space-x-2">
                    {editingTool === tool.id ? (
                      <>
                        <button
                          onClick={handleSaveEdit}
                          className="text-emerald-600 hover:text-emerald-900"
                          title="Save changes"
                        >
                          <Save className="h-4 w-4" />
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="text-gray-600 hover:text-gray-900"
                          title="Cancel editing"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        {tool.hasApiSupport && (
                          <>
                            <button
                              onClick={() => handleTestConnection(tool.id)}
                              disabled={!tool.apiKey || testingConnection === tool.id}
                              className="text-blue-600 hover:text-blue-900 disabled:text-gray-400 disabled:cursor-not-allowed"
                              title="Test API connection"
                            >
                              <TestTube className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => syncToolUsers(tool)}
                              disabled={!tool.apiKey || !tool.apiEndpoint || syncingTools.has(tool.id)}
                              className="text-emerald-600 hover:text-emerald-900 disabled:text-gray-400 disabled:cursor-not-allowed"
                              title="Sync users from this tool"
                            >
                              <RefreshCw className={`h-4 w-4 ${syncingTools.has(tool.id) ? 'animate-spin' : ''}`} />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleEditTool(tool)}
                          className="text-indigo-600 hover:text-indigo-900"
                          title="Edit tool"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => onDeleteTool(tool.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete tool"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {viewMode === 'paginated' && totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            Showing {startIndex + 1} to {Math.min(endIndex, filteredTools.length)} of {filteredTools.length} tools
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 text-sm"
            >
              First
            </button>
            
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="p-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            
            <span className="px-3 py-1 text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
            
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="p-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 text-sm"
            >
              Last
            </button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredTools.length === 0 && (
        <div className="text-center py-8">
          <Key className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No tools found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || selectedCategory || selectedStatus 
              ? 'Try adjusting your filters or search terms.'
              : 'Get started by adding SurveySparrow tools with API access or CSV upload.'
            }
          </p>
          {(searchTerm || selectedCategory || selectedStatus) && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('');
                setSelectedStatus('');
                setSelectedIntegrationType('');
                setSelectedIntegrationType('');
              }}
              className="mt-2 text-emerald-600 hover:text-emerald-700 text-sm font-medium"
            >
              Clear all filters
            </button>
          )}
        </div>
      )}

      {/* CSV Comparison Modal */}
      {csvComparisonOpen && selectedToolForComparison && (
        <CSVComparison
          toolName={selectedToolForComparison}
          onComparisonComplete={handleComparisonComplete}
          onClose={() => {
            setCsvComparisonOpen(false);
            setSelectedToolForComparison(null);
          }}
        />
      )}
    </div>
  );
}