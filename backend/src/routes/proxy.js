import express from 'express';
import fetch from 'node-fetch';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// CORS middleware for proxy routes
router.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Proxy endpoint to handle API calls and avoid CORS issues
router.post('/api-call', authenticateToken, async (req, res) => {
  try {
    const { url, method = 'GET', headers = {}, body } = req.body;

    if (!url) {
      return res.status(400).json({
        error: 'URL is required',
        message: 'Please provide a valid API endpoint URL'
      });
    }

    // Validate URL
    try {
      new URL(url);
    } catch (error) {
      return res.status(400).json({
        error: 'Invalid URL',
        message: 'Please provide a valid URL format'
      });
    }

    // Make the API call
    const response = await fetch(url, {
      method: method.toUpperCase(),
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'SparrowVision-IGA/1.0',
        ...headers
      },
      body: body ? JSON.stringify(body) : undefined,
      timeout: 30000 // 30 second timeout
    });

    if (!response.ok) {
      return res.status(response.status).json({
        error: 'API call failed',
        message: `HTTP ${response.status}: ${response.statusText}`,
        status: response.status
      });
    }

    const data = await response.json();
    
    // Log the API call for audit
    console.log(`API call made to: ${url} - Status: ${response.status}`);

    res.json({
      success: true,
      data: data,
      status: response.status,
      headers: Object.fromEntries(response.headers.entries())
    });

  } catch (error) {
    console.error('Proxy API call error:', error);
    
    if (error.code === 'ENOTFOUND') {
      return res.status(400).json({
        error: 'Connection failed',
        message: 'Unable to reach the API endpoint. Please check the URL.'
      });
    }
    
    if (error.code === 'ECONNREFUSED') {
      return res.status(400).json({
        error: 'Connection refused',
        message: 'The API endpoint is not responding. Please check the URL and try again.'
      });
    }

    res.status(500).json({
      error: 'Proxy error',
      message: error.message || 'An error occurred while making the API call'
    });
  }
});

// Handle OPTIONS requests for test-tool endpoint
router.options('/test-tool', (req, res) => {
  res.status(200).end();
});

// Test specific tool APIs
router.post('/test-tool', authenticateToken, async (req, res) => {
  try {
    const { toolName, apiKey, endpoint } = req.body;

    if (!toolName || !apiKey || !endpoint) {
      return res.status(400).json({
        error: 'Missing parameters',
        message: 'Tool name, API key, and endpoint are required'
      });
    }

    // Tool-specific API configurations
    const toolConfigs = {
      // Communication & Collaboration
      'Slack': {
        url: `${endpoint}/users.list`,
        headers: { 'Authorization': `Bearer ${apiKey}` }
      },
      'Zoom Video Communications': {
        url: `${endpoint}/users`,
        headers: { 'Authorization': `Bearer ${apiKey}` }
      },
      'RingCentral': {
        url: `${endpoint}/restapi/v1.0/account/~/extension`,
        headers: { 'Authorization': `Bearer ${apiKey}` }
      },
      'Skype': {
        url: `${endpoint}/users`,
        headers: { 'Authorization': `Bearer ${apiKey}` }
      },
      'Aircall.io': {
        url: `${endpoint}/users`,
        headers: { 'Authorization': `Bearer ${apiKey}` }
      },
      'Calendly': {
        url: `${endpoint}/users/me`,
        headers: { 'Authorization': `Bearer ${apiKey}` }
      },
      'Loom': {
        url: `${endpoint}/users/me`,
        headers: { 'Authorization': `Bearer ${apiKey}` }
      },
      'Vimeo': {
        url: `${endpoint}/me`,
        headers: { 'Authorization': `Bearer ${apiKey}` }
      },
      
      // Development & DevOps
      'GitHub Copilot': {
        url: `${endpoint}/user`,
        headers: { 'Authorization': `token ${apiKey}` }
      },
      'Bitbucket': {
        url: `${endpoint}/user`,
        headers: { 'Authorization': `Bearer ${apiKey}` }
      },
      'NPM Org': {
        url: `${endpoint}/-/user/org.couchdb.user:${apiKey}`,
        headers: { 'Authorization': `Bearer ${apiKey}` }
      },
      'Jira': {
        url: `${endpoint}/myself`,
        headers: { 'Authorization': `Bearer ${apiKey}` }
      },
      'Confluence': {
        url: `${endpoint}/user/current`,
        headers: { 'Authorization': `Bearer ${apiKey}` }
      },
      'Sentry - Production - SS': {
        url: `${endpoint}/users/me`,
        headers: { 'Authorization': `Bearer ${apiKey}` }
      },
      'Sentry - Production - TS': {
        url: `${endpoint}/users/me`,
        headers: { 'Authorization': `Bearer ${apiKey}` }
      },
      'Sentry - Staging': {
        url: `${endpoint}/users/me`,
        headers: { 'Authorization': `Bearer ${apiKey}` }
      },
      'Testsigma': {
        url: `${endpoint}/users/me`,
        headers: { 'Authorization': `Bearer ${apiKey}` }
      },
      'Browserstack': {
        url: `${endpoint}/user`,
        headers: { 'Authorization': `Basic ${Buffer.from(apiKey).toString('base64')}` }
      },
      'Burpsuite': {
        url: `${endpoint}/user`,
        headers: { 'Authorization': `Bearer ${apiKey}` }
      },
      'NGROK.COM': {
        url: `${endpoint}/users/me`,
        headers: { 'Authorization': `Bearer ${apiKey}` }
      },
      'Zapier': {
        url: `${endpoint}/users/me`,
        headers: { 'Authorization': `Bearer ${apiKey}` }
      },
      'Clickup': {
        url: `${endpoint}/user`,
        headers: { 'Authorization': `${apiKey}` }
      },
      
      // Design & Creative
      'Figma': {
        url: `${endpoint}/users/me`,
        headers: { 'Authorization': `Bearer ${apiKey}` }
      },
      'Adobe Creative Cloud': {
        url: `${endpoint}/users/me`,
        headers: { 'Authorization': `Bearer ${apiKey}` }
      },
      'Canva': {
        url: `${endpoint}/users/me`,
        headers: { 'Authorization': `Bearer ${apiKey}` }
      },
      'Whimsical': {
        url: `${endpoint}/users/me`,
        headers: { 'Authorization': `Bearer ${apiKey}` }
      },
      'Webflow': {
        url: `${endpoint}/users/me`,
        headers: { 'Authorization': `Bearer ${apiKey}` }
      },
      'Unbounce': {
        url: `${endpoint}/users/me`,
        headers: { 'Authorization': `Bearer ${apiKey}` }
      },
      'Rawpixel': {
        url: `${endpoint}/users/me`,
        headers: { 'Authorization': `Bearer ${apiKey}` }
      },
      'Freepik': {
        url: `${endpoint}/users/me`,
        headers: { 'Authorization': `Bearer ${apiKey}` }
      },
      'Iconscout': {
        url: `${endpoint}/users/me`,
        headers: { 'Authorization': `Bearer ${apiKey}` }
      },
      
      // Cloud & Infrastructure
      'AWS': {
        url: `${endpoint}/`,
        headers: { 'Authorization': `AWS4-HMAC-SHA256 ${apiKey}` }
      },
      'Google Cloud': {
        url: `${endpoint}/projects`,
        headers: { 'Authorization': `Bearer ${apiKey}` }
      },
      'Microsoft 365 for Business': {
        url: `${endpoint}/me`,
        headers: { 'Authorization': `Bearer ${apiKey}` }
      },
      'Microsoft 365 for Business Basic': {
        url: `${endpoint}/me`,
        headers: { 'Authorization': `Bearer ${apiKey}` }
      },
      'G Suite Enterprise (Fixed 300 license)': {
        url: `${endpoint}/users`,
        headers: { 'Authorization': `Bearer ${apiKey}` }
      },
      'G Suite Basic': {
        url: `${endpoint}/users`,
        headers: { 'Authorization': `Bearer ${apiKey}` }
      },
      'Cloudflare': {
        url: `${endpoint}/user`,
        headers: { 'Authorization': `Bearer ${apiKey}` }
      },
      'Forticloud': {
        url: `${endpoint}/users/me`,
        headers: { 'Authorization': `Bearer ${apiKey}` }
      },
      'Fortigate Firewall': {
        url: `${endpoint}/users/me`,
        headers: { 'Authorization': `Bearer ${apiKey}` }
      },
      
      // Monitoring & Analytics
      'New Relic': {
        url: `${endpoint}/users/me`,
        headers: { 'X-Api-Key': apiKey }
      },
      'Logz.io': {
        url: `${endpoint}/users/me`,
        headers: { 'Authorization': `Bearer ${apiKey}` }
      },
      'UptimeRobot - SS': {
        url: `${endpoint}/getAccountDetails`,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `api_key=${apiKey}&format=json`
      },
      'UptimeRobot - TS': {
        url: `${endpoint}/getAccountDetails`,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `api_key=${apiKey}&format=json`
      },
      'Zenduty': {
        url: `${endpoint}/users/me`,
        headers: { 'Authorization': `Bearer ${apiKey}` }
      },
      'Crazy Egg': {
        url: `${endpoint}/users/me`,
        headers: { 'Authorization': `Bearer ${apiKey}` }
      },
      'LuckyOrange': {
        url: `${endpoint}/users/me`,
        headers: { 'Authorization': `Bearer ${apiKey}` }
      },
      'Heap Analytics': {
        url: `${endpoint}/users/me`,
        headers: { 'Authorization': `Bearer ${apiKey}` }
      },
      'Power Bi Premium': {
        url: `${endpoint}/users/me`,
        headers: { 'Authorization': `Bearer ${apiKey}` }
      },
      'Power Bi Pro': {
        url: `${endpoint}/users/me`,
        headers: { 'Authorization': `Bearer ${apiKey}` }
      },
      'Google Analytics': {
        url: `${endpoint}/accounts`,
        headers: { 'Authorization': `Bearer ${apiKey}` }
      },
      'Google Search Console': {
        url: `${endpoint}/sites`,
        headers: { 'Authorization': `Bearer ${apiKey}` }
      },
      'Ahrefs': {
        url: `${endpoint}/user`,
        headers: { 'Authorization': `Bearer ${apiKey}` }
      },
      'SurferSEO': {
        url: `${endpoint}/users/me`,
        headers: { 'Authorization': `Bearer ${apiKey}` }
      },
      'Read.ai': {
        url: `${endpoint}/users/me`,
        headers: { 'Authorization': `Bearer ${apiKey}` }
      },
      
      // IT Management & Security
      'Jump Cloud': {
        url: `${endpoint}/users`,
        headers: { 'Authorization': `Bearer ${apiKey}` }
      },
      'End Point Central': {
        url: `${endpoint}/users`,
        headers: { 'Authorization': `Bearer ${apiKey}` }
      },
      'Heimdal - Anti Virus': {
        url: `${endpoint}/users`,
        headers: { 'Authorization': `Bearer ${apiKey}` }
      },
      'Auzmor': {
        url: `${endpoint}/users/me`,
        headers: { 'Authorization': `Bearer ${apiKey}` }
      },
      
      // HR & Recruitment
      'LinkedIn - HR team': {
        url: `${endpoint}/people/~`,
        headers: { 'Authorization': `Bearer ${apiKey}` }
      },
      'KeKa': {
        url: `${endpoint}/users/me`,
        headers: { 'Authorization': `Bearer ${apiKey}` }
      },
      'Evalgator Candidate Evaluation Platform': {
        url: `${endpoint}/users/me`,
        headers: { 'Authorization': `Bearer ${apiKey}` }
      },
      'Gusto': {
        url: `${endpoint}/users/me`,
        headers: { 'Authorization': `Bearer ${apiKey}` }
      },
      
      // Finance & Accounting
      'Quickbooks': {
        url: `${endpoint}/users/me`,
        headers: { 'Authorization': `Bearer ${apiKey}` }
      },
      'Stripe': {
        url: `${endpoint}/account`,
        headers: { 'Authorization': `Bearer ${apiKey}` }
      },
      'Paddle (Vendor for Partnership management tool)': {
        url: `${endpoint}/users/me`,
        headers: { 'Authorization': `Bearer ${apiKey}` }
      },
      'FastSpring': {
        url: `${endpoint}/users/me`,
        headers: { 'Authorization': `Bearer ${apiKey}` }
      },
      'Astrella - LTSE Cap Table': {
        url: `${endpoint}/users/me`,
        headers: { 'Authorization': `Bearer ${apiKey}` }
      },
      
      // Marketing & Sales
      'Hubspot': {
        url: `${endpoint}/crm/v3/objects/contacts`,
        headers: { 'Authorization': `Bearer ${apiKey}` }
      },
      'Apollo.io': {
        url: `${endpoint}/users/me`,
        headers: { 'Authorization': `Bearer ${apiKey}` }
      },
      'Vitally': {
        url: `${endpoint}/users/me`,
        headers: { 'Authorization': `Bearer ${apiKey}` }
      },
      'Zendesk': {
        url: `${endpoint}/users/me.json`,
        headers: { 'Authorization': `Bearer ${apiKey}` }
      },
      'LinkedIn - Sales Navigator': {
        url: `${endpoint}/people/~`,
        headers: { 'Authorization': `Bearer ${apiKey}` }
      },
      'Outplay': {
        url: `${endpoint}/users/me`,
        headers: { 'Authorization': `Bearer ${apiKey}` }
      },
      'Lemlist': {
        url: `${endpoint}/users/me`,
        headers: { 'Authorization': `Bearer ${apiKey}` }
      },
      'Clay Labs': {
        url: `${endpoint}/users/me`,
        headers: { 'Authorization': `Bearer ${apiKey}` }
      },
      'Easyleadz': {
        url: `${endpoint}/users/me`,
        headers: { 'Authorization': `Bearer ${apiKey}` }
      },
      'Respona': {
        url: `${endpoint}/users/me`,
        headers: { 'Authorization': `Bearer ${apiKey}` }
      },
      'ReachInbox': {
        url: `${endpoint}/users/me`,
        headers: { 'Authorization': `Bearer ${apiKey}` }
      },
      'SaaSAnt': {
        url: `${endpoint}/users/me`,
        headers: { 'Authorization': `Bearer ${apiKey}` }
      },
      'PartnerStack': {
        url: `${endpoint}/users/me`,
        headers: { 'Authorization': `Bearer ${apiKey}` }
      },
      'PartnerStack - Usage based': {
        url: `${endpoint}/users/me`,
        headers: { 'Authorization': `Bearer ${apiKey}` }
      },
      
      // Email Services
      'Sendgrid - (Engineering)': {
        url: `${endpoint}/user/profile`,
        headers: { 'Authorization': `Bearer ${apiKey}` }
      },
      'Sendgrid- (Marketing)': {
        url: `${endpoint}/user/profile`,
        headers: { 'Authorization': `Bearer ${apiKey}` }
      },
      'SparkPost - US - Production - SS': {
        url: `${endpoint}/users/me`,
        headers: { 'Authorization': `Bearer ${apiKey}` }
      },
      'SparkPost - EU - Production - SS': {
        url: `${endpoint}/users/me`,
        headers: { 'Authorization': `Bearer ${apiKey}` }
      },
      'SparkPost - US - Production - TS': {
        url: `${endpoint}/users/me`,
        headers: { 'Authorization': `Bearer ${apiKey}` }
      },
      'SparkPost - EU - Production - TS': {
        url: `${endpoint}/users/me`,
        headers: { 'Authorization': `Bearer ${apiKey}` }
      },
      'SparkPost - Staging - SS': {
        url: `${endpoint}/users/me`,
        headers: { 'Authorization': `Bearer ${apiKey}` }
      },
      'Sinch Mailgun - Production': {
        url: `${endpoint}/domains`,
        headers: { 'Authorization': `Basic ${Buffer.from(`api:${apiKey}`).toString('base64')}` }
      },
      'Sinch Mailgun - Staging': {
        url: `${endpoint}/domains`,
        headers: { 'Authorization': `Basic ${Buffer.from(`api:${apiKey}`).toString('base64')}` }
      },
      'Sendinblue - SS': {
        url: `${endpoint}/account`,
        headers: { 'Authorization': `Bearer ${apiKey}` }
      },
      'Sendinblue - TS': {
        url: `${endpoint}/account`,
        headers: { 'Authorization': `Bearer ${apiKey}` }
      },
      'Twilio - Staging': {
        url: `${endpoint}/Accounts/${apiKey.split(':')[0]}.json`,
        headers: { 'Authorization': `Basic ${Buffer.from(apiKey).toString('base64')}` }
      },
      'Twilio - Production': {
        url: `${endpoint}/Accounts/${apiKey.split(':')[0]}.json`,
        headers: { 'Authorization': `Basic ${Buffer.from(apiKey).toString('base64')}` }
      },
      'Mailosaur': {
        url: `${endpoint}/me`,
        headers: { 'Authorization': `Bearer ${apiKey}` }
      },
      'DeBounce': {
        url: `${endpoint}/user`,
        headers: { 'Authorization': `Bearer ${apiKey}` }
      },
      'VoilaNorbert': {
        url: `${endpoint}/users/me`,
        headers: { 'Authorization': `Bearer ${apiKey}` }
      },
      'Zerobounce': {
        url: `${endpoint}/user`,
        headers: { 'Authorization': `Bearer ${apiKey}` }
      },
      'Quick Email Verification': {
        url: `${endpoint}/user`,
        headers: { 'Authorization': `Bearer ${apiKey}` }
      },
      'Public Data Check': {
        url: `${endpoint}/user`,
        headers: { 'Authorization': `Bearer ${apiKey}` }
      },
      
      // AI & Productivity
      'Open AI (Chatgpt) - Production': {
        url: `${endpoint}/users/me`,
        headers: { 'Authorization': `Bearer ${apiKey}` }
      },
      'Open AI (Chatgpt) - Subscription': {
        url: `${endpoint}/users/me`,
        headers: { 'Authorization': `Bearer ${apiKey}` }
      },
      'Claude.ai': {
        url: `${endpoint}/users/me`,
        headers: { 'Authorization': `Bearer ${apiKey}` }
      },
      'Perplexity AI': {
        url: `${endpoint}/users/me`,
        headers: { 'Authorization': `Bearer ${apiKey}` }
      },
      'Compose AI': {
        url: `${endpoint}/users/me`,
        headers: { 'Authorization': `Bearer ${apiKey}` }
      },
      'HeyGen': {
        url: `${endpoint}/users/me`,
        headers: { 'Authorization': `Bearer ${apiKey}` }
      },
      'Originality.AI': {
        url: `${endpoint}/users/me`,
        headers: { 'Authorization': `Bearer ${apiKey}` }
      },
      'Midjourney': {
        url: `${endpoint}/users/me`,
        headers: { 'Authorization': `Bearer ${apiKey}` }
      },
      'Grammarly': {
        url: `${endpoint}/users/me`,
        headers: { 'Authorization': `Bearer ${apiKey}` }
      },
      'Evabot': {
        url: `${endpoint}/users/me`,
        headers: { 'Authorization': `Bearer ${apiKey}` }
      },
      'Evaboot': {
        url: `${endpoint}/users/me`,
        headers: { 'Authorization': `Bearer ${apiKey}` }
      },
      'Zipy.AI - SS': {
        url: `${endpoint}/users/me`,
        headers: { 'Authorization': `Bearer ${apiKey}` }
      },
      'Zipy.AI - TS': {
        url: `${endpoint}/users/me`,
        headers: { 'Authorization': `Bearer ${apiKey}` }
      },
      
      // Data & Integration
      'Fivetran': {
        url: `${endpoint}/users/me`,
        headers: { 'Authorization': `Bearer ${apiKey}` }
      },
      'Airbyte': {
        url: `${endpoint}/users/me`,
        headers: { 'Authorization': `Bearer ${apiKey}` }
      },
      'Merge API': {
        url: `${endpoint}/users/me`,
        headers: { 'Authorization': `Bearer ${apiKey}` }
      },
      'Datawarehouse.io': {
        url: `${endpoint}/users/me`,
        headers: { 'Authorization': `Bearer ${apiKey}` }
      },
      'Airtable': {
        url: `${endpoint}/users/me`,
        headers: { 'Authorization': `Bearer ${apiKey}` }
      },
      'Rows': {
        url: `${endpoint}/users/me`,
        headers: { 'Authorization': `Bearer ${apiKey}` }
      },
      
      // Customer Support & Communication
      'Intercom': {
        url: `${endpoint}/users/me`,
        headers: { 'Authorization': `Bearer ${apiKey}` }
      },
      'Discourse': {
        url: `${endpoint}/users/me`,
        headers: { 'Authorization': `Bearer ${apiKey}` }
      },
      'Fireflies': {
        url: `${endpoint}/users/me`,
        headers: { 'Authorization': `Bearer ${apiKey}` }
      },
      
      // Content & SEO
      'Content Square Inc.': {
        url: `${endpoint}/users/me`,
        headers: { 'Authorization': `Bearer ${apiKey}` }
      },
      'Reviewshake/ Datashake': {
        url: `${endpoint}/users/me`,
        headers: { 'Authorization': `Bearer ${apiKey}` }
      },
      'Litmus': {
        url: `${endpoint}/users/me`,
        headers: { 'Authorization': `Bearer ${apiKey}` }
      },
      'Disqus': {
        url: `${endpoint}/users/me`,
        headers: { 'Authorization': `Bearer ${apiKey}` }
      },
      'Cookieyes': {
        url: `${endpoint}/users/me`,
        headers: { 'Authorization': `Bearer ${apiKey}` }
      },
      
      // Development Tools & Testing
      'Jam F': {
        url: `${endpoint}/users/me`,
        headers: { 'Authorization': `Bearer ${apiKey}` }
      },
      'Arcade Software': {
        url: `${endpoint}/users/me`,
        headers: { 'Authorization': `Bearer ${apiKey}` }
      },
      'Crystal Project': {
        url: `${endpoint}/users/me`,
        headers: { 'Authorization': `Bearer ${apiKey}` }
      },
      'GROKABILITY': {
        url: `${endpoint}/users/me`,
        headers: { 'Authorization': `Bearer ${apiKey}` }
      },
      
      // Domain & Hosting
      'Namecheap': {
        url: `${endpoint}/users/get`,
        headers: { 'Authorization': `Bearer ${apiKey}` }
      },
      'GoDaddy': {
        url: `${endpoint}/users/me`,
        headers: { 'Authorization': `Bearer ${apiKey}` }
      },
      'Tasjeel - Domain': {
        url: `${endpoint}/users/me`,
        headers: { 'Authorization': `Bearer ${apiKey}` }
      },
      'Apple.com': {
        url: `${endpoint}/users/me`,
        headers: { 'Authorization': `Bearer ${apiKey}` }
      },
      
      // Business & Productivity
      'Dropbox Sign': {
        url: `${endpoint}/account`,
        headers: { 'Authorization': `Bearer ${apiKey}` }
      },
      'Dropbox Storage': {
        url: `${endpoint}/users/get_current_account`,
        headers: { 'Authorization': `Bearer ${apiKey}` }
      },
      'Cab Management Tool': {
        url: `${endpoint}/users/me`,
        headers: { 'Authorization': `Bearer ${apiKey}` }
      },
      'Document Studio': {
        url: `${endpoint}/users/me`,
        headers: { 'Authorization': `Bearer ${apiKey}` }
      },
      'Sejda': {
        url: `${endpoint}/users/me`,
        headers: { 'Authorization': `Bearer ${apiKey}` }
      },
      'Virtualpost': {
        url: `${endpoint}/users/me`,
        headers: { 'Authorization': `Bearer ${apiKey}` }
      },
      
      // Specialized Tools
      'Entries ai': {
        url: `${endpoint}/users/me`,
        headers: { 'Authorization': `Bearer ${apiKey}` }
      },
      'Cybot': {
        url: `${endpoint}/users/me`,
        headers: { 'Authorization': `Bearer ${apiKey}` }
      },
      'CM.COM': {
        url: `${endpoint}/users/me`,
        headers: { 'Authorization': `Bearer ${apiKey}` }
      },
      'AppSumo': {
        url: `${endpoint}/users/me`,
        headers: { 'Authorization': `Bearer ${apiKey}` }
      },
      'Indie Hackers': {
        url: `${endpoint}/users/me`,
        headers: { 'Authorization': `Bearer ${apiKey}` }
      },
      'Copyscape': {
        url: `${endpoint}/users/me`,
        headers: { 'Authorization': `Bearer ${apiKey}` }
      },
      'Blogarama': {
        url: `${endpoint}/users/me`,
        headers: { 'Authorization': `Bearer ${apiKey}` }
      },
      
      // Access Review Tools
      'Zuluri': {
        url: `${endpoint}/users`,
        headers: { 
          'Authorization': `Bearer ${apiKey}`,
          'X-API-Version': 'v1',
          'Content-Type': 'application/json'
        }
      }
    };

    const config = toolConfigs[toolName];
    if (!config) {
      return res.status(400).json({
        error: 'Unsupported tool',
        message: `Tool "${toolName}" is not supported yet`
      });
    }

    const response = await fetch(config.url, {
      method: 'GET',
      headers: config.headers,
      timeout: 30000
    });

    if (!response.ok) {
      return res.status(response.status).json({
        error: 'API call failed',
        message: `HTTP ${response.status}: ${response.statusText}`,
        tool: toolName,
        status: response.status
      });
    }

    const data = await response.json();
    
    // Transform data based on tool type
    let users = [];
    
    // Communication & Collaboration Tools
    if (toolName === 'Slack' && data.members) {
      users = data.members.map(member => ({
        id: member.id,
        email: member.profile?.email || member.name,
        username: member.name,
        role: member.is_admin ? 'admin' : 'user',
        status: member.deleted ? 'inactive' : 'active',
        lastLogin: member.updated ? new Date(member.updated * 1000).toISOString() : null
      }));
    } else if (toolName === 'Zoom Video Communications' && data.users) {
      users = data.users.map(user => ({
        id: user.id,
        email: user.email,
        username: user.first_name + ' ' + user.last_name,
        role: user.type === 2 ? 'admin' : 'user',
        status: user.status === 'active' ? 'active' : 'inactive',
        lastLogin: user.last_login_time ? new Date(user.last_login_time).toISOString() : null
      }));
    } else if (toolName === 'RingCentral' && data.extensions) {
      users = data.extensions.map(ext => ({
        id: ext.id,
        email: ext.contact?.email || ext.extensionNumber + '@ringcentral.com',
        username: ext.contact?.firstName + ' ' + ext.contact?.lastName,
        role: ext.type === 'User' ? 'user' : 'admin',
        status: ext.status === 'Enabled' ? 'active' : 'inactive',
        lastLogin: ext.lastModifiedTime
      }));
    } else if (toolName === 'Calendly' && data.resource) {
      users = [{
        id: data.resource.uri,
        email: data.resource.email,
        username: data.resource.name,
        role: 'user',
        status: 'active',
        lastLogin: data.resource.updated_at
      }];
    } else if (toolName === 'Loom' && data.user) {
      users = [{
        id: data.user.id,
        email: data.user.email,
        username: data.user.name,
        role: data.user.role || 'user',
        status: 'active',
        lastLogin: data.user.updated_at
      }];
    } else if (toolName === 'Vimeo' && data.user) {
      users = [{
        id: data.user.uri,
        email: data.user.email,
        username: data.user.name,
        role: data.user.account_type || 'user',
        status: 'active',
        lastLogin: data.user.created_time
      }];
    }
    
    // Development & DevOps Tools
    else if (toolName === 'GitHub Copilot' && data.login) {
      users = [{
        id: data.id,
        email: data.email || data.login + '@github.com',
        username: data.login,
        role: data.type === 'User' ? 'user' : 'admin',
        status: 'active',
        lastLogin: data.updated_at
      }];
    } else if (toolName === 'Bitbucket' && data.uuid) {
      users = [{
        id: data.uuid,
        email: data.email || data.username + '@bitbucket.org',
        username: data.display_name || data.username,
        role: 'user',
        status: 'active',
        lastLogin: data.created_on
      }];
    } else if (toolName === 'Jira' && data.accountId) {
      users = [{
        id: data.accountId,
        email: data.emailAddress,
        username: data.displayName,
        role: data.accountType || 'user',
        status: 'active',
        lastLogin: data.lastActive
      }];
    } else if (toolName === 'Confluence' && data.accountId) {
      users = [{
        id: data.accountId,
        email: data.email,
        username: data.displayName,
        role: data.accountType || 'user',
        status: 'active',
        lastLogin: data.lastActive
      }];
    } else if (toolName.includes('Sentry') && data.user) {
      users = [{
        id: data.user.id,
        email: data.user.email,
        username: data.user.name,
        role: data.user.role || 'user',
        status: 'active',
        lastLogin: data.user.lastActive
      }];
    } else if (toolName === 'Browserstack' && data.user) {
      users = [{
        id: data.user.id,
        email: data.user.email,
        username: data.user.name,
        role: 'user',
        status: 'active',
        lastLogin: data.user.created_at
      }];
    } else if (toolName === 'Clickup' && data.user) {
      users = [{
        id: data.user.id,
        email: data.user.email,
        username: data.user.username,
        role: 'user',
        status: 'active',
        lastLogin: data.user.date_joined
      }];
    }
    
    // Design & Creative Tools
    else if (toolName === 'Figma' && data.user) {
      users = [{
        id: data.user.id,
        email: data.user.email,
        username: data.user.handle,
        role: 'user',
        status: 'active',
        lastLogin: data.user.updated_at
      }];
    } else if (toolName === 'Adobe Creative Cloud' && data.user) {
      users = [{
        id: data.user.id,
        email: data.user.email,
        username: data.user.name,
        role: 'user',
        status: 'active',
        lastLogin: data.user.updated_at
      }];
    } else if (toolName === 'Canva' && data.user) {
      users = [{
        id: data.user.id,
        email: data.user.email,
        username: data.user.name,
        role: 'user',
        status: 'active',
        lastLogin: data.user.updated_at
      }];
    }
    
    // Cloud & Infrastructure Tools
    else if (toolName === 'AWS' && data.Account) {
      users = [{
        id: data.Account.Id,
        email: data.Account.Arn,
        username: 'AWS Account',
        role: 'admin',
        status: 'active',
        lastLogin: new Date().toISOString()
      }];
    } else if (toolName === 'Google Cloud' && data.projects) {
      users = data.projects.map(project => ({
        id: project.projectId,
        email: project.name,
        username: project.displayName,
        role: 'admin',
        status: 'active',
        lastLogin: project.createTime
      }));
    } else if (toolName.includes('Microsoft 365') && data.userPrincipalName) {
      users = [{
        id: data.id,
        email: data.userPrincipalName,
        username: data.displayName,
        role: 'user',
        status: 'active',
        lastLogin: data.lastSignInDateTime
      }];
    } else if (toolName.includes('G Suite') && data.users) {
      users = data.users.map(user => ({
        id: user.id,
        email: user.primaryEmail,
        username: user.name?.fullName || user.primaryEmail,
        role: user.isAdmin ? 'admin' : 'user',
        status: user.suspended ? 'inactive' : 'active',
        lastLogin: user.lastLoginTime
      }));
    } else if (toolName === 'Cloudflare' && data.result) {
      users = [{
        id: data.result.id,
        email: data.result.email,
        username: data.result.username,
        role: 'user',
        status: 'active',
        lastLogin: data.result.modified_on
      }];
    }
    
    // Monitoring & Analytics Tools
    else if (toolName === 'New Relic' && data.user) {
      users = [{
        id: data.user.id,
        email: data.user.email,
        username: data.user.first_name + ' ' + data.user.last_name,
        role: 'user',
        status: 'active',
        lastLogin: data.user.last_login
      }];
    } else if (toolName === 'Logz.io' && data.user) {
      users = [{
        id: data.user.id,
        email: data.user.email,
        username: data.user.firstName + ' ' + data.user.lastName,
        role: 'user',
        status: 'active',
        lastLogin: data.user.lastLogin
      }];
    } else if (toolName.includes('UptimeRobot') && data.account) {
      users = [{
        id: data.account.user_id,
        email: data.account.email,
        username: data.account.first_name + ' ' + data.account.last_name,
        role: 'user',
        status: 'active',
        lastLogin: data.account.last_login
      }];
    } else if (toolName === 'Google Analytics' && data.items) {
      users = data.items.map(account => ({
        id: account.id,
        email: account.name,
        username: account.displayName,
        role: 'admin',
        status: 'active',
        lastLogin: account.created
      }));
    } else if (toolName === 'Ahrefs' && data.user) {
      users = [{
        id: data.user.id,
        email: data.user.email,
        username: data.user.name,
        role: 'user',
        status: 'active',
        lastLogin: data.user.last_login
      }];
    }
    
    // IT Management & Security Tools
    else if (toolName === 'Jump Cloud' && data.results) {
      users = data.results.map(user => ({
        id: user.id,
        email: user.email,
        username: user.firstname + ' ' + user.lastname,
        role: user.role?.name || 'user',
        status: user.activated ? 'active' : 'inactive',
        lastLogin: user.lastLogin
      }));
    } else if (toolName === 'End Point Central' && data.users) {
      users = data.users.map(user => ({
        id: user.id,
        email: user.email,
        username: user.name,
        role: user.role || 'user',
        status: user.status === 'Active' ? 'active' : 'inactive',
        lastLogin: user.lastLogin
      }));
    } else if (toolName === 'Heimdal - Anti Virus' && data.users) {
      users = data.users.map(user => ({
        id: user.id,
        email: user.email,
        username: user.name,
        role: 'user',
        status: 'active',
        lastLogin: user.lastLogin
      }));
    }
    
    // HR & Recruitment Tools
    else if (toolName === 'LinkedIn - HR team' && data.id) {
      users = [{
        id: data.id,
        email: data.emailAddress,
        username: data.firstName + ' ' + data.lastName,
        role: 'user',
        status: 'active',
        lastLogin: data.lastModifiedTimestamp
      }];
    } else if (toolName === 'KeKa' && data.user) {
      users = [{
        id: data.user.id,
        email: data.user.email,
        username: data.user.name,
        role: 'user',
        status: 'active',
        lastLogin: data.user.lastLogin
      }];
    } else if (toolName === 'Gusto' && data.user) {
      users = [{
        id: data.user.id,
        email: data.user.email,
        username: data.user.first_name + ' ' + data.user.last_name,
        role: 'user',
        status: 'active',
        lastLogin: data.user.last_login
      }];
    }
    
    // Finance & Accounting Tools
    else if (toolName === 'Quickbooks' && data.QueryResponse) {
      users = data.QueryResponse.Customer.map(customer => ({
        id: customer.Id,
        email: customer.PrimaryEmailAddr?.Address || customer.Name + '@customer.com',
        username: customer.Name,
        role: 'customer',
        status: 'active',
        lastLogin: customer.MetaData?.LastUpdatedTime
      }));
    } else if (toolName === 'Stripe' && data.id) {
      users = [{
        id: data.id,
        email: data.email,
        username: data.business_profile?.name || 'Stripe Account',
        role: 'admin',
        status: 'active',
        lastLogin: data.created
      }];
    }
    
    // Marketing & Sales Tools
    else if (toolName === 'Hubspot' && data.results) {
      users = data.results.map(contact => ({
        id: contact.id,
        email: contact.properties?.email,
        username: contact.properties?.firstname + ' ' + contact.properties?.lastname,
        role: 'contact',
        status: 'active',
        lastLogin: contact.properties?.lastmodifieddate
      }));
    } else if (toolName === 'Apollo.io' && data.user) {
      users = [{
        id: data.user.id,
        email: data.user.email,
        username: data.user.first_name + ' ' + data.user.last_name,
        role: 'user',
        status: 'active',
        lastLogin: data.user.last_login
      }];
    } else if (toolName === 'Zendesk' && data.user) {
      users = [{
        id: data.user.id,
        email: data.user.email,
        username: data.user.name,
        role: data.user.role || 'user',
        status: data.user.active ? 'active' : 'inactive',
        lastLogin: data.user.last_login_at
      }];
    }
    
    // Email Services
    else if (toolName.includes('Sendgrid') && data.user) {
      users = [{
        id: data.user.username,
        email: data.user.email,
        username: data.user.username,
        role: 'user',
        status: 'active',
        lastLogin: data.user.created
      }];
    } else if (toolName.includes('SparkPost') && data.results) {
      users = data.results.map(user => ({
        id: user.id,
        email: user.email,
        username: user.name,
        role: 'user',
        status: 'active',
        lastLogin: user.created
      }));
    } else if (toolName.includes('Mailgun') && data.items) {
      users = data.items.map(domain => ({
        id: domain.name,
        email: domain.name + '@mailgun.com',
        username: domain.name,
        role: 'admin',
        status: 'active',
        lastLogin: domain.created_at
      }));
    } else if (toolName.includes('Twilio') && data.friendly_name) {
      users = [{
        id: data.sid,
        email: data.friendly_name + '@twilio.com',
        username: data.friendly_name,
        role: 'admin',
        status: 'active',
        lastLogin: data.date_created
      }];
    }
    
    // AI & Productivity Tools
    else if (toolName.includes('Open AI') && data.id) {
      users = [{
        id: data.id,
        email: data.email,
        username: data.name,
        role: 'user',
        status: 'active',
        lastLogin: data.created
      }];
    } else if (toolName === 'Claude.ai' && data.id) {
      users = [{
        id: data.id,
        email: data.email,
        username: data.name,
        role: 'user',
        status: 'active',
        lastLogin: data.created_at
      }];
    } else if (toolName === 'Perplexity AI' && data.user) {
      users = [{
        id: data.user.id,
        email: data.user.email,
        username: data.user.name,
        role: 'user',
        status: 'active',
        lastLogin: data.user.created_at
      }];
    }
    
    // Data & Integration Tools
    else if (toolName === 'Fivetran' && data.data) {
      users = data.data.map(connector => ({
        id: connector.id,
        email: connector.schema + '@fivetran.com',
        username: connector.schema,
        role: 'admin',
        status: 'active',
        lastLogin: connector.created_at
      }));
    } else if (toolName === 'Airtable' && data.id) {
      users = [{
        id: data.id,
        email: data.email,
        username: data.name,
        role: 'user',
        status: 'active',
        lastLogin: data.createdTime
      }];
    }
    
    // Customer Support Tools
    else if (toolName === 'Intercom' && data.id) {
      users = [{
        id: data.id,
        email: data.email,
        username: data.name,
        role: 'user',
        status: 'active',
        lastLogin: data.last_seen_at
      }];
    } else if (toolName === 'Discourse' && data.user) {
      users = [{
        id: data.user.id,
        email: data.user.email,
        username: data.user.username,
        role: data.user.admin ? 'admin' : 'user',
        status: data.user.active ? 'active' : 'inactive',
        lastLogin: data.user.last_seen_at
      }];
    }
    
    // Business & Productivity Tools
    else if (toolName === 'Dropbox Sign' && data.account) {
      users = [{
        id: data.account.account_id,
        email: data.account.email_address,
        username: data.account.name,
        role: 'admin',
        status: 'active',
        lastLogin: data.account.created_at
      }];
    } else if (toolName === 'Dropbox Storage' && data.account_id) {
      users = [{
        id: data.account_id,
        email: data.email,
        username: data.name?.display_name || data.email,
        role: 'user',
        status: 'active',
        lastLogin: data.created
      }];
    }
    
    // Access Review Tools
    else if (toolName === 'Zuluri' && data.users) {
      users = data.users.map(user => ({
        id: user.id,
        email: user.email,
        username: user.name || user.username,
        role: user.role || user.permission_level || 'user',
        status: user.status === 'active' ? 'active' : 'inactive',
        lastLogin: user.last_login_at || user.last_activity_at,
        department: user.department,
        manager: user.manager,
        joinDate: user.created_at,
        permissions: user.permissions || []
      }));
    }
    
    // Generic fallback for any tool with user data
    else if (data.users && Array.isArray(data.users)) {
      users = data.users.map(user => ({
        id: user.id || user.user_id || user.account_id,
        email: user.email || user.email_address || user.primary_email,
        username: user.username || user.name || user.display_name || user.handle,
        role: user.role || user.account_type || user.type || 'user',
        status: user.status === 'active' || user.active ? 'active' : 'inactive',
        lastLogin: user.last_login || user.last_login_at || user.updated_at || user.created_at,
        department: user.department,
        manager: user.manager,
        joinDate: user.created_at || user.join_date,
        permissions: user.permissions || []
      }));
    } else if (data.user) {
      users = [{
        id: data.user.id || data.user.user_id,
        email: data.user.email || data.user.email_address,
        username: data.user.username || data.user.name || data.user.display_name,
        role: data.user.role || data.user.account_type || 'user',
        status: data.user.status === 'active' || data.user.active ? 'active' : 'inactive',
        lastLogin: data.user.last_login || data.user.updated_at,
        department: data.user.department,
        manager: data.user.manager,
        joinDate: data.user.created_at,
        permissions: data.user.permissions || []
      }];
    }

    res.json({
      success: true,
      tool: toolName,
      users: users,
      totalUsers: users.length,
      rawData: data
    });

  } catch (error) {
    console.error('Tool test error:', error);
    res.status(500).json({
      error: 'Tool test failed',
      message: error.message || 'An error occurred while testing the tool'
    });
  }
});

// CSV Comparison Analysis endpoint
router.post('/csv-comparison', authenticateToken, async (req, res) => {
  try {
    const { userList, exitUsers, toolName } = req.body;

    if (!userList || !exitUsers || !Array.isArray(userList) || !Array.isArray(exitUsers)) {
      return res.status(400).json({
        error: 'Invalid data',
        message: 'userList and exitUsers must be arrays'
      });
    }

    // Create sets for efficient lookup
    const exitEmails = new Set(exitUsers.map(user => user.email?.toLowerCase()).filter(Boolean));
    
    // Perform comparison analysis
    const results = {
      matched: [],
      unmatched: [],
      duplicates: [],
      flagged: [],
      summary: {
        totalUsers: userList.length,
        totalExitUsers: exitUsers.length,
        matchedCount: 0,
        unmatchedCount: 0,
        duplicateCount: 0,
        flaggedCount: 0
      }
    };

    // Find matched users (users in both lists)
    results.matched = userList.filter(user => 
      user.email && exitEmails.has(user.email.toLowerCase())
    );

    // Find unmatched users (users in userList but not in exitUsers)
    results.unmatched = userList.filter(user => 
      user.email && !exitEmails.has(user.email.toLowerCase())
    );

    // Find duplicates in userList
    const emailCounts = new Map();
    userList.forEach(user => {
      if (user.email) {
        const email = user.email.toLowerCase();
        emailCounts.set(email, (emailCounts.get(email) || 0) + 1);
      }
    });
    results.duplicates = userList.filter(user => 
      user.email && emailCounts.get(user.email.toLowerCase()) > 1
    );

    // Find flagged users (admin/owner roles or non-org emails)
    results.flagged = userList.filter(user => {
      const isAdmin = user.role?.toLowerCase().includes('admin') || 
                     user.role?.toLowerCase().includes('owner') ||
                     user.role?.toLowerCase().includes('manager');
      const isNonOrg = user.email && !user.email.toLowerCase().endsWith('@surveysparrow.com');
      return isAdmin || isNonOrg;
    });

    // Update summary counts
    results.summary.matchedCount = results.matched.length;
    results.summary.unmatchedCount = results.unmatched.length;
    results.summary.duplicateCount = results.duplicates.length;
    results.summary.flaggedCount = results.flagged.length;

    // Log the analysis for audit
    console.log(`CSV comparison analysis completed for ${toolName}:`, results.summary);

    res.json({
      success: true,
      tool: toolName,
      results: results,
      analyzedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('CSV comparison error:', error);
    res.status(500).json({
      error: 'CSV comparison failed',
      message: error.message || 'An error occurred during CSV comparison analysis'
    });
  }
});

export default router;
