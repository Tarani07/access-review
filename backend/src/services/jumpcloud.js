import fetch from 'node-fetch';
import logger from '../utils/logger.js';

/**
 * JumpCloud API Integration Service
 * Handles real JumpCloud API calls for user directory synchronization
 */
class JumpCloudService {
  constructor() {
    this.baseUrl = 'https://console.jumpcloud.com/api';
    this.apiVersion = 'v1';
  }

  /**
   * Test JumpCloud API connection
   */
  async testConnection(apiKey, orgId = null) {
    try {
      const headers = {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'Accept': 'application/json'
      };

      // Test with a simple API call to get organization info or users
      const testUrl = orgId 
        ? `${this.baseUrl}/${this.apiVersion}/organizations/${orgId}`
        : `${this.baseUrl}/${this.apiVersion}/systemusers?limit=1`;

      logger.info(`Testing JumpCloud connection: ${testUrl}`);

      const response = await fetch(testUrl, {
        method: 'GET',
        headers,
        timeout: 10000 // 10 second timeout
      });

      const data = await response.json();

      if (!response.ok) {
        logger.error(`JumpCloud API error: ${response.status} - ${JSON.stringify(data)}`);
        
        let errorMessage = 'Connection failed';
        if (response.status === 401) {
          errorMessage = 'Invalid API Key - Please check your JumpCloud API key';
        } else if (response.status === 403) {
          errorMessage = 'Access denied - API key does not have required permissions';
        } else if (response.status === 404) {
          errorMessage = 'Organization not found - Please verify your Organization ID';
        } else if (data.message) {
          errorMessage = data.message;
        }

        return {
          success: false,
          error: errorMessage,
          statusCode: response.status
        };
      }

      logger.info('JumpCloud connection test successful');
      return {
        success: true,
        message: 'Connection successful',
        data: {
          organizationId: orgId,
          userCount: data.totalCount || (Array.isArray(data.results) ? data.results.length : 0),
          apiVersion: this.apiVersion
        }
      };

    } catch (error) {
      logger.error('JumpCloud connection test failed:', error);
      
      let errorMessage = 'Connection failed';
      if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        errorMessage = 'Cannot reach JumpCloud API - Check your internet connection';
      } else if (error.name === 'AbortError') {
        errorMessage = 'Connection timeout - JumpCloud API took too long to respond';
      } else {
        errorMessage = error.message || 'Unknown connection error';
      }

      return {
        success: false,
        error: errorMessage,
        technical: error.message
      };
    }
  }

  /**
   * Fetch all users from JumpCloud
   */
  async fetchUsers(apiKey, options = {}) {
    try {
      const {
        limit = 100,
        skip = 0,
        fields = null,
        filter = null
      } = options;

      const headers = {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'Accept': 'application/json'
      };

      // Build query parameters
      const params = new URLSearchParams({
        limit: limit.toString(),
        skip: skip.toString()
      });

      if (fields) {
        params.append('fields', Array.isArray(fields) ? fields.join(' ') : fields);
      }

      if (filter) {
        params.append('filter', JSON.stringify(filter));
      }

      const url = `${this.baseUrl}/${this.apiVersion}/systemusers?${params}`;
      
      logger.info(`Fetching JumpCloud users: ${url}`);

      const response = await fetch(url, {
        method: 'GET',
        headers,
        timeout: 30000 // 30 second timeout for user fetch
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`JumpCloud API error: ${response.status} - ${errorData.message || response.statusText}`);
      }

      const data = await response.json();

      // Transform JumpCloud user data to our format
      const transformedUsers = this.transformUsers(data.results || []);

      logger.info(`Successfully fetched ${transformedUsers.length} users from JumpCloud`);

      return {
        success: true,
        users: transformedUsers,
        pagination: {
          total: data.totalCount || transformedUsers.length,
          limit,
          skip,
          hasMore: (skip + transformedUsers.length) < (data.totalCount || 0)
        }
      };

    } catch (error) {
      logger.error('Failed to fetch JumpCloud users:', error);
      return {
        success: false,
        error: error.message,
        users: []
      };
    }
  }

  /**
   * Fetch all users with automatic pagination
   */
  async fetchAllUsers(apiKey) {
    try {
      let allUsers = [];
      let skip = 0;
      const limit = 100;
      let hasMore = true;

      logger.info('Starting to fetch all JumpCloud users with pagination');

      while (hasMore) {
        const result = await this.fetchUsers(apiKey, { limit, skip });
        
        if (!result.success) {
          throw new Error(result.error);
        }

        allUsers = allUsers.concat(result.users);
        hasMore = result.pagination.hasMore;
        skip += limit;

        logger.info(`Fetched ${result.users.length} users (total so far: ${allUsers.length})`);

        // Add small delay to be respectful to API
        if (hasMore) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      logger.info(`Successfully fetched all ${allUsers.length} users from JumpCloud`);

      return {
        success: true,
        users: allUsers,
        totalCount: allUsers.length
      };

    } catch (error) {
      logger.error('Failed to fetch all JumpCloud users:', error);
      return {
        success: false,
        error: error.message,
        users: []
      };
    }
  }

  /**
   * Transform JumpCloud user data to our internal format
   */
  transformUsers(jumpcloudUsers) {
    return jumpcloudUsers.map(user => ({
      // Core identifiers
      externalId: user._id || user.id,
      email: user.email,
      username: user.username,
      
      // Personal information
      firstName: user.firstname || user.firstName,
      lastName: user.lastname || user.lastName,
      name: this.buildFullName(user.firstname || user.firstName, user.lastname || user.lastName),
      
      // Employment details
      employeeId: user.employeeIdentifier || user.username || user.email,
      department: user.department || 'Unknown',
      jobTitle: user.jobTitle || user.title || 'Unknown',
      manager: user.manager || user.managedApprovedBy,
      location: user.location || user.city || user.state,
      
      // Contact information
      phoneNumber: user.phoneNumber || user.phone,
      
      // Account status
      status: this.mapJumpCloudStatus(user.activated, user.suspended),
      activated: user.activated,
      suspended: user.suspended,
      
      // Timestamps
      createdAt: user.created ? new Date(user.created).toISOString() : null,
      lastLogin: user.lastLogin ? new Date(user.lastLogin).toISOString() : null,
      passwordExpired: user.passwordExpired,
      
      // Groups and permissions
      groups: user.groups || [],
      tags: user.tags || [],
      
      // Additional metadata
      ldapBinding: user.ldap_binding_user || false,
      mfaEnabled: user.mfa?.configured || false,
      sshRootEnabled: user.sshroot_enabled || false,
      
      // Source tracking
      source: 'JUMPCLOUD',
      syncedAt: new Date().toISOString()
    }));
  }

  /**
   * Build full name from first and last name
   */
  buildFullName(firstName, lastName) {
    const first = firstName || '';
    const last = lastName || '';
    return `${first} ${last}`.trim() || 'Unknown User';
  }

  /**
   * Map JumpCloud status to our internal status
   */
  mapJumpCloudStatus(activated, suspended) {
    if (suspended) return 'SUSPENDED';
    if (!activated) return 'INACTIVE';
    return 'ACTIVE';
  }

  /**
   * Get user groups/roles from JumpCloud
   */
  async fetchUserGroups(apiKey, userId) {
    try {
      const headers = {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'Accept': 'application/json'
      };

      const url = `${this.baseUrl}/${this.apiVersion}/systemusers/${userId}/memberof`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers,
        timeout: 15000
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch user groups: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        groups: data.results || []
      };

    } catch (error) {
      logger.error(`Failed to fetch groups for user ${userId}:`, error);
      return {
        success: false,
        error: error.message,
        groups: []
      };
    }
  }

  /**
   * Validate JumpCloud configuration
   */
  validateConfig(config) {
    const errors = [];

    if (!config.apiKey) {
      errors.push('API Key is required');
    }

    if (config.apiKey && config.apiKey.length < 32) {
      errors.push('API Key appears to be invalid (too short)');
    }

    if (config.baseUrl && !config.baseUrl.startsWith('https://')) {
      errors.push('Base URL must use HTTPS');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

export default new JumpCloudService();
