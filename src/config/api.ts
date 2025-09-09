// API Configuration for Sparrow Vision IGA Platform

// Production API URL - Replace with your Railway backend URL
export const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://your-backend.railway.app/api'  // Replace with your actual Railway URL
  : 'http://localhost:3001/api';

// API Endpoints
export const API_ENDPOINTS = {
  // Authentication
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  PROFILE: '/auth/profile',
  LOGOUT: '/auth/logout',
  VERIFY: '/auth/verify',
  
  // Dashboard
  DASHBOARD_STATS: '/dashboard/stats',
  DASHBOARD_AUDIT_LOGS: '/dashboard/audit-logs',
  DASHBOARD_RISK_ASSESSMENT: '/dashboard/risk-assessment',
  
  // Users
  USERS: '/users',
  
  // Roles
  ROLES: '/roles',
  
  // Audit
  AUDIT_LOGS: '/audit',
  
  // Policies
  POLICIES: '/policies',
  POLICY_VIOLATIONS: '/policies/violations',
  
  // Health
  HEALTH: '/health'
};

// Helper function to get full API URL
export const getApiUrl = (endpoint: string): string => {
  return `${API_BASE_URL}${endpoint}`;
};

// API Request helper
export const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const url = getApiUrl(endpoint);
  
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  // Add authorization header if token exists
  const token = localStorage.getItem('authToken');
  if (token) {
    defaultOptions.headers = {
      ...defaultOptions.headers,
      'Authorization': `Bearer ${token}`,
    };
  }

  const response = await fetch(url, { ...defaultOptions, ...options });
  
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
};
