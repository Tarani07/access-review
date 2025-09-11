import express from 'express';
import fetch from 'node-fetch';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

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
      'Slack': {
        url: `${endpoint}/users.list`,
        headers: { 'Authorization': `Bearer ${apiKey}` }
      },
      'Zoom': {
        url: `${endpoint}/users`,
        headers: { 'Authorization': `Bearer ${apiKey}` }
      },
      'GitHub': {
        url: `${endpoint}/user`,
        headers: { 'Authorization': `token ${apiKey}` }
      },
      'Microsoft Teams': {
        url: `${endpoint}/users`,
        headers: { 'Authorization': `Bearer ${apiKey}` }
      },
      'Google Workspace': {
        url: `${endpoint}/users`,
        headers: { 'Authorization': `Bearer ${apiKey}` }
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
    if (toolName === 'Slack' && data.members) {
      users = data.members.map(member => ({
        id: member.id,
        email: member.profile?.email || member.name,
        username: member.name,
        role: member.is_admin ? 'admin' : 'user',
        status: member.deleted ? 'inactive' : 'active',
        lastLogin: member.updated ? new Date(member.updated * 1000).toISOString() : null
      }));
    } else if (toolName === 'Zoom' && data.users) {
      users = data.users.map(user => ({
        id: user.id,
        email: user.email,
        username: user.first_name + ' ' + user.last_name,
        role: user.type === 2 ? 'admin' : 'user',
        status: user.status === 'active' ? 'active' : 'inactive',
        lastLogin: user.last_login_time ? new Date(user.last_login_time).toISOString() : null
      }));
    } else if (toolName === 'GitHub' && data.login) {
      users = [{
        id: data.id,
        email: data.email || data.login + '@github.com',
        username: data.login,
        role: data.type === 'User' ? 'user' : 'admin',
        status: 'active',
        lastLogin: data.updated_at
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

export default router;
