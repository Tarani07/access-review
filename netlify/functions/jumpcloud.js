import { getPrismaClient } from './utils/database.js';
import { authenticateUser } from './utils/auth.js';
import logger from './utils/logger.js';

// JumpCloud Service (inline for serverless)
class JumpCloudService {
  constructor() {
    this.baseUrl = 'https://console.jumpcloud.com/api';
    this.apiVersion = 'v1';
  }

  async testConnection(apiKey, orgId = null) {
    try {
      const headers = {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'Accept': 'application/json'
      };

      const testUrl = orgId 
        ? `${this.baseUrl}/${this.apiVersion}/organizations/${orgId}`
        : `${this.baseUrl}/${this.apiVersion}/systemusers?limit=1`;

      const response = await fetch(testUrl, {
        method: 'GET',
        headers,
        signal: AbortSignal.timeout(10000)
      });

      const data = await response.json();

      if (!response.ok) {
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
      let errorMessage = 'Connection failed';
      if (error.name === 'AbortError') {
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

      const response = await fetch(url, {
        method: 'GET',
        headers,
        signal: AbortSignal.timeout(30000)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`JumpCloud API error: ${response.status} - ${errorData.message || response.statusText}`);
      }

      const data = await response.json();
      const transformedUsers = this.transformUsers(data.results || []);

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
      return {
        success: false,
        error: error.message,
        users: []
      };
    }
  }

  async fetchAllUsers(apiKey) {
    try {
      let allUsers = [];
      let skip = 0;
      const limit = 100;
      let hasMore = true;

      while (hasMore) {
        const result = await this.fetchUsers(apiKey, { limit, skip });
        
        if (!result.success) {
          throw new Error(result.error);
        }

        allUsers = allUsers.concat(result.users);
        hasMore = result.pagination.hasMore;
        skip += limit;

        if (hasMore) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      return {
        success: true,
        users: allUsers,
        totalCount: allUsers.length
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        users: []
      };
    }
  }

  transformUsers(jumpcloudUsers) {
    return jumpcloudUsers.map(user => ({
      externalId: user._id || user.id,
      email: user.email,
      username: user.username,
      firstName: user.firstname || user.firstName,
      lastName: user.lastname || user.lastName,
      name: this.buildFullName(user.firstname || user.firstName, user.lastname || user.lastName),
      employeeId: user.employeeIdentifier || user.username || user.email,
      department: user.department || 'Unknown',
      jobTitle: user.jobTitle || user.title || 'Unknown',
      manager: user.manager || user.managedApprovedBy,
      location: user.location || user.city || user.state,
      phoneNumber: user.phoneNumber || user.phone,
      status: this.mapJumpCloudStatus(user.activated, user.suspended),
      activated: user.activated,
      suspended: user.suspended,
      createdAt: user.created ? new Date(user.created).toISOString() : null,
      lastLogin: user.lastLogin ? new Date(user.lastLogin).toISOString() : null,
      passwordExpired: user.passwordExpired,
      groups: user.groups || [],
      tags: user.tags || [],
      ldapBinding: user.ldap_binding_user || false,
      mfaEnabled: user.mfa?.configured || false,
      sshRootEnabled: user.sshroot_enabled || false,
      source: 'JUMPCLOUD',
      syncedAt: new Date().toISOString()
    }));
  }

  buildFullName(firstName, lastName) {
    const first = firstName || '';
    const last = lastName || '';
    return `${first} ${last}`.trim() || 'Unknown User';
  }

  mapJumpCloudStatus(activated, suspended) {
    if (suspended) return 'SUSPENDED';
    if (!activated) return 'INACTIVE';
    return 'ACTIVE';
  }

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

const jumpcloudService = new JumpCloudService();

export async function handler(event, context) {
  context.callbackWaitsForEmptyEventLoop = false;

  const headers = {
    'Access-Control-Allow-Origin': process.env.FRONTEND_URL || '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const authResult = await authenticateUser(event);
    if (!authResult.success) {
      return {
        statusCode: authResult.statusCode,
        headers,
        body: JSON.stringify({ error: authResult.error })
      };
    }

    const prisma = getPrismaClient();
    const path = event.path.replace('/.netlify/functions/jumpcloud', '');
    const method = event.httpMethod;

    // POST /test-connection - Test JumpCloud API connection
    if (method === 'POST' && path === '/test-connection') {
      const { apiKey, orgId } = JSON.parse(event.body || '{}');

      if (!apiKey) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            success: false,
            error: 'API Key is required'
          })
        };
      }

      const validation = jumpcloudService.validateConfig({ apiKey, orgId });
      if (!validation.valid) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            success: false,
            error: 'Invalid configuration',
            details: validation.errors
          })
        };
      }

      const result = await jumpcloudService.testConnection(apiKey, orgId);

      if (result.success) {
        await prisma.log.create({
          data: {
            action: 'JumpCloud Connection Test',
            category: 'INTEGRATION',
            userId: authResult.user.id,
            userEmail: authResult.user.email,
            details: {
              success: true,
              orgId,
              userCount: result.data?.userCount
            }
          }
        }).catch(err => logger.error('Failed to log audit event:', err));

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            message: 'JumpCloud connection successful',
            data: result.data
          })
        };
      } else {
        await prisma.log.create({
          data: {
            action: 'JumpCloud Connection Test Failed',
            category: 'INTEGRATION',
            userId: authResult.user.id,
            userEmail: authResult.user.email,
            details: {
              success: false,
              error: result.error,
              statusCode: result.statusCode
            }
          }
        }).catch(err => logger.error('Failed to log audit event:', err));

        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            success: false,
            error: result.error,
            technical: result.technical
          })
        };
      }
    }

    // POST /configure - Save JumpCloud configuration
    if (method === 'POST' && path === '/configure') {
      const { apiKey, orgId, baseUrl, isActive } = JSON.parse(event.body || '{}');

      if (!apiKey) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            success: false,
            error: 'API Key is required'
          })
        };
      }

      const validation = jumpcloudService.validateConfig({ apiKey, orgId, baseUrl });
      if (!validation.valid) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            success: false,
            error: 'Invalid configuration',
            details: validation.errors
          })
        };
      }

      const connectionTest = await jumpcloudService.testConnection(apiKey, orgId);
      if (!connectionTest.success) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            success: false,
            error: 'Configuration test failed',
            details: connectionTest.error
          })
        };
      }

      const jumpcloudTool = await prisma.tool.upsert({
        where: { name: 'JumpCloud' },
        update: {
          apiKey: apiKey,
          isActive: isActive !== false,
          lastSync: null,
          syncStatus: 'IDLE',
          errorMessage: null,
          updatedAt: new Date()
        },
        create: {
          name: 'JumpCloud',
          type: 'API',
          category: 'Identity Management',
          description: 'JumpCloud Directory Service Integration',
          integrationUrl: baseUrl || 'https://console.jumpcloud.com/api',
          apiKey: apiKey,
          isActive: isActive !== false,
          syncStatus: 'IDLE',
          userCount: 0,
          createdAt: new Date()
        }
      });

      await prisma.log.create({
        data: {
          action: 'JumpCloud Configured',
          category: 'INTEGRATION',
          userId: authResult.user.id,
          userEmail: authResult.user.email,
          resourceId: jumpcloudTool.id,
          resourceType: 'Tool',
          details: {
            orgId,
            baseUrl: baseUrl || 'https://console.jumpcloud.com/api',
            isActive: isActive !== false
          }
        }
      }).catch(err => logger.error('Failed to log audit event:', err));

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: 'JumpCloud configuration saved successfully',
          data: {
            id: jumpcloudTool.id,
            configured: true,
            connectionStatus: 'CONNECTED',
            lastTested: new Date().toISOString()
          }
        })
      };
    }

    // GET /status - Get JumpCloud configuration status
    if (method === 'GET' && path === '/status') {
      const jumpcloudTool = await prisma.tool.findFirst({
        where: { name: 'JumpCloud' }
      });

      if (!jumpcloudTool) {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            data: {
              configured: false,
              connectionStatus: 'NOT_CONFIGURED',
              isActive: false
            }
          })
        };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          data: {
            id: jumpcloudTool.id,
            configured: !!jumpcloudTool.apiKey,
            connectionStatus: jumpcloudTool.syncStatus === 'ERROR' ? 'ERROR' : 'CONFIGURED',
            isActive: jumpcloudTool.isActive,
            lastSync: jumpcloudTool.lastSync,
            userCount: jumpcloudTool.userCount,
            errorMessage: jumpcloudTool.errorMessage,
            updatedAt: jumpcloudTool.updatedAt
          }
        })
      };
    }

    // POST /sync - Sync users from JumpCloud
    if (method === 'POST' && path === '/sync') {
      const { fullSync = false } = JSON.parse(event.body || '{}');

      const jumpcloudTool = await prisma.tool.findFirst({
        where: { name: 'JumpCloud' }
      });

      if (!jumpcloudTool || !jumpcloudTool.apiKey) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            success: false,
            error: 'JumpCloud not configured. Please configure JumpCloud first.'
          })
        };
      }

      if (!jumpcloudTool.isActive) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            success: false,
            error: 'JumpCloud integration is disabled'
          })
        };
      }

      await prisma.tool.update({
        where: { id: jumpcloudTool.id },
        data: {
          syncStatus: 'SYNCING',
          errorMessage: null
        }
      });

      const result = await jumpcloudService.fetchAllUsers(jumpcloudTool.apiKey);

      if (!result.success) {
        await prisma.tool.update({
          where: { id: jumpcloudTool.id },
          data: {
            syncStatus: 'ERROR',
            errorMessage: result.error,
            lastSync: new Date()
          }
        });

        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            success: false,
            error: 'Failed to fetch users from JumpCloud',
            details: result.error
          })
        };
      }

      const syncResults = {
        totalFetched: result.users.length,
        created: 0,
        updated: 0,
        errors: 0,
        skipped: 0
      };

      for (const jcUser of result.users) {
        try {
          const existingUser = await prisma.user.findFirst({
            where: {
              OR: [
                { email: jcUser.email },
                { employeeId: jcUser.employeeId }
              ]
            }
          });

          const userData = {
            email: jcUser.email,
            name: jcUser.name,
            employeeId: jcUser.employeeId,
            department: jcUser.department,
            jobTitle: jcUser.jobTitle,
            manager: jcUser.manager,
            location: jcUser.location,
            phoneNumber: jcUser.phoneNumber,
            status: jcUser.status,
            lastSyncAt: new Date(),
            syncSource: 'JUMPCLOUD'
          };

          if (existingUser) {
            await prisma.user.update({
              where: { id: existingUser.id },
              data: userData
            });
            syncResults.updated++;
          } else {
            await prisma.user.create({
              data: {
                ...userData,
                role: 'VIEW',
                riskScore: 10,
                createdDate: new Date()
              }
            });
            syncResults.created++;
          }

        } catch (userError) {
          logger.error(`Error processing JumpCloud user ${jcUser.email}:`, userError);
          syncResults.errors++;
        }
      }

      await prisma.tool.update({
        where: { id: jumpcloudTool.id },
        data: {
          syncStatus: 'SUCCESS',
          lastSync: new Date(),
          userCount: syncResults.totalFetched,
          errorMessage: null
        }
      });

      await prisma.log.create({
        data: {
          action: 'JumpCloud Sync Completed',
          category: 'SYNC',
          userId: authResult.user.id,
          userEmail: authResult.user.email,
          resourceId: jumpcloudTool.id,
          resourceType: 'Tool',
          details: {
            ...syncResults,
            fullSync
          }
        }
      }).catch(err => logger.error('Failed to log sync completion:', err));

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: 'JumpCloud sync completed successfully',
          data: {
            ...syncResults,
            syncedAt: new Date().toISOString(),
            nextSyncRecommended: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString()
          }
        })
      };
    }

    // GET /sync-history - Get sync history
    if (method === 'GET' && path === '/sync-history') {
      const limit = parseInt(event.queryStringParameters?.limit || '10');
      const offset = parseInt(event.queryStringParameters?.offset || '0');

      const jumpcloudTool = await prisma.tool.findFirst({
        where: { name: 'JumpCloud' }
      });

      if (!jumpcloudTool) {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            data: []
          })
        };
      }

      const syncHistory = await prisma.log.findMany({
        where: {
          resourceId: jumpcloudTool.id,
          action: { in: ['JumpCloud Sync Completed', 'JumpCloud Sync Failed'] }
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      });

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          data: syncHistory.map(log => ({
            id: log.id,
            action: log.action,
            timestamp: log.createdAt,
            details: log.details,
            success: log.action === 'JumpCloud Sync Completed'
          }))
        })
      };
    }

    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: 'Route not found' })
    };

  } catch (error) {
    logger.error('JumpCloud function error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        success: false,
        error: 'Internal server error',
        details: error.message 
      })
    };
  }
}



