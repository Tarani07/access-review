// SparrowVision API Configuration
export const API_CONFIG = {
  // Development API URL (local backend)
  DEV_API_URL: 'http://localhost:3001',
  
  // Production API URL - UPDATE THIS after Railway deployment
  PROD_API_URL: 'https://sparrowvision-backend-production.railway.app',
  
  // Current environment detection
  isDevelopment: import.meta.env.MODE === 'development',
  
  // Get the appropriate API URL based on environment
  get baseURL() {
    return this.isDevelopment ? this.DEV_API_URL : this.PROD_API_URL;
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