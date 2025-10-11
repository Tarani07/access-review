// SparrowVision API Configuration - Netlify Functions
export const API_CONFIG = {
  // Development API URL (local backend or Netlify dev)
  DEV_API_URL: import.meta.env.VITE_DEV_API_URL || 'http://localhost:3001',
  
  // Production API URL - Netlify Functions
  PROD_API_URL: import.meta.env.VITE_API_URL || '/.netlify/functions',
  
  // Current environment detection
  isDevelopment: import.meta.env.MODE === 'development',
  isNetlifyDev: import.meta.env.VITE_NETLIFY_DEV === 'true',
  
  // Get the appropriate API URL based on environment
  get baseURL() {
    // Force Netlify Functions in production or when explicitly set
    if (!this.isDevelopment || this.isNetlifyDev || import.meta.env.VITE_USE_NETLIFY_FUNCTIONS === 'true') {
      return this.PROD_API_URL;
    }
    return this.DEV_API_URL;
  },
  
  // API endpoints
  endpoints: {
    auth: {
      login: '/api/auth/login',
      logout: '/api/auth/logout',
      verify: '/api/auth/verify'
    },
    dashboard: {
      stats: '/api/dashboard/stats',
      exitEmployees: '/api/dashboard/exit-employees'
    },
    tools: {
      list: '/api/tools',
      sync: '/api/tools/sync',
      add: '/api/tools/add',
      delete: '/api/tools'
    },
    users: {
      list: '/api/users',
      jumpcloud: '/api/users/jumpcloud',
      validation: '/api/users/validate'
    },
    reviews: {
      list: '/api/reviews',
      create: '/api/reviews',
      complete: '/api/reviews',
      export: '/api/reviews/export'
    },
    reports: {
      generate: '/api/reports/generate',
      list: '/api/reports',
      download: '/api/reports/download',
      notifications: '/api/reports/notifications'
    },
    admin: {
      users: '/api/admin/users',
      roles: '/api/admin/roles',
      invites: '/api/admin/invites'
    },
    logs: {
      audit: '/api/logs',
      system: '/api/logs/system'
    },
    slack: {
      configure: '/api/slack/configure',
      test: '/api/slack/test',
      send: '/api/slack/send'
    },
    jumpcloud: {
      testConnection: '/api/jumpcloud/test-connection',
      configure: '/api/jumpcloud/configure',
      status: '/api/jumpcloud/status',
      sync: '/api/jumpcloud/sync',
      syncHistory: '/api/jumpcloud/sync-history'
    }
  },
  
  // Helper function to build full URL
  buildUrl(endpoint: string): string {
    return `${this.baseURL}${endpoint}`;
  },
  
  // Common headers for API requests
  getHeaders(includeAuth: boolean = true): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (includeAuth) {
      const token = localStorage.getItem('authToken');
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
    }
    
    return headers;
  },
  
  // HTTP client configuration
  defaultOptions: {
    timeout: 30000, // 30 seconds
    retries: 3,
    retryDelay: 1000 // 1 second
  }
};

// Export individual components for convenience
export const { baseURL, endpoints, buildUrl, getHeaders } = API_CONFIG;

export default API_CONFIG;