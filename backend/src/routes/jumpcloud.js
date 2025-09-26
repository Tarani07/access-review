import express from 'express';
import logger from '../utils/logger.js';
import { getPrismaClient } from '../utils/database.js';
import jumpcloudService from '../services/jumpcloud.js';

const router = express.Router();
const prisma = getPrismaClient();

// Test JumpCloud API connection
router.post('/test-connection', async (req, res) => {
  try {
    const { apiKey, orgId } = req.body;

    if (!apiKey) {
      return res.status(400).json({
        success: false,
        error: 'API Key is required'
      });
    }

    // Validate configuration
    const validation = jumpcloudService.validateConfig({ apiKey, orgId });
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: 'Invalid configuration',
        details: validation.errors
      });
    }

    logger.info('Testing JumpCloud connection...');
    const result = await jumpcloudService.testConnection(apiKey, orgId);

    if (result.success) {
      // Log successful connection test
      await prisma.auditLog.create({
        data: {
          action: 'JUMPCLOUD_CONNECTION_TEST',
          category: 'INTEGRATION',
          details: {
            success: true,
            orgId,
            userCount: result.data?.userCount
          },
          timestamp: new Date()
        }
      }).catch(err => logger.error('Failed to log audit event:', err));

      res.json({
        success: true,
        message: 'JumpCloud connection successful',
        data: result.data
      });
    } else {
      // Log failed connection test
      await prisma.auditLog.create({
        data: {
          action: 'JUMPCLOUD_CONNECTION_TEST_FAILED',
          category: 'INTEGRATION',
          details: {
            success: false,
            error: result.error,
            statusCode: result.statusCode
          },
          timestamp: new Date()
        }
      }).catch(err => logger.error('Failed to log audit event:', err));

      res.status(400).json({
        success: false,
        error: result.error,
        technical: result.technical
      });
    }

  } catch (error) {
    logger.error('JumpCloud connection test error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during connection test'
    });
  }
});

// Save JumpCloud configuration
router.post('/configure', async (req, res) => {
  try {
    const { apiKey, orgId, baseUrl, isActive } = req.body;

    if (!apiKey) {
      return res.status(400).json({
        success: false,
        error: 'API Key is required'
      });
    }

    // Validate configuration
    const validation = jumpcloudService.validateConfig({ apiKey, orgId, baseUrl });
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: 'Invalid configuration',
        details: validation.errors
      });
    }

    // Test connection before saving
    const connectionTest = await jumpcloudService.testConnection(apiKey, orgId);
    if (!connectionTest.success) {
      return res.status(400).json({
        success: false,
        error: 'Configuration test failed',
        details: connectionTest.error
      });
    }

    // Create or update JumpCloud tool configuration
    const jumpcloudTool = await prisma.tool.upsert({
      where: { name: 'JumpCloud' },
      update: {
        apiKey: apiKey, // Note: In production, encrypt this
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
        apiKey: apiKey, // Note: In production, encrypt this
        isActive: isActive !== false,
        syncStatus: 'IDLE',
        userCount: 0,
        createdAt: new Date()
      }
    });

    // Log configuration update
    await prisma.auditLog.create({
      data: {
        action: 'JUMPCLOUD_CONFIGURED',
        category: 'INTEGRATION',
        resourceId: jumpcloudTool.id,
        resourceType: 'Tool',
        details: {
          orgId,
          baseUrl: baseUrl || 'https://console.jumpcloud.com/api',
          isActive: isActive !== false
        },
        timestamp: new Date()
      }
    }).catch(err => logger.error('Failed to log audit event:', err));

    res.json({
      success: true,
      message: 'JumpCloud configuration saved successfully',
      data: {
        id: jumpcloudTool.id,
        configured: true,
        connectionStatus: 'CONNECTED',
        lastTested: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('JumpCloud configuration error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save JumpCloud configuration'
    });
  }
});

// Get JumpCloud configuration status
router.get('/status', async (req, res) => {
  try {
    const jumpcloudTool = await prisma.tool.findFirst({
      where: { name: 'JumpCloud' }
    });

    if (!jumpcloudTool) {
      return res.json({
        success: true,
        data: {
          configured: false,
          connectionStatus: 'NOT_CONFIGURED',
          isActive: false
        }
      });
    }

    res.json({
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
    });

  } catch (error) {
    logger.error('JumpCloud status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get JumpCloud status'
    });
  }
});

// Sync users from JumpCloud
router.post('/sync', async (req, res) => {
  try {
    const { fullSync = false } = req.body;

    // Get JumpCloud configuration
    const jumpcloudTool = await prisma.tool.findFirst({
      where: { name: 'JumpCloud' }
    });

    if (!jumpcloudTool || !jumpcloudTool.apiKey) {
      return res.status(400).json({
        success: false,
        error: 'JumpCloud not configured. Please configure JumpCloud first.'
      });
    }

    if (!jumpcloudTool.isActive) {
      return res.status(400).json({
        success: false,
        error: 'JumpCloud integration is disabled'
      });
    }

    // Update sync status
    await prisma.tool.update({
      where: { id: jumpcloudTool.id },
      data: {
        syncStatus: 'SYNCING',
        errorMessage: null
      }
    });

    logger.info(`Starting JumpCloud sync (fullSync: ${fullSync})`);

    // Fetch users from JumpCloud
    const result = await jumpcloudService.fetchAllUsers(jumpcloudTool.apiKey);

    if (!result.success) {
      // Update tool with error status
      await prisma.tool.update({
        where: { id: jumpcloudTool.id },
        data: {
          syncStatus: 'ERROR',
          errorMessage: result.error,
          lastSync: new Date()
        }
      });

      return res.status(400).json({
        success: false,
        error: 'Failed to fetch users from JumpCloud',
        details: result.error
      });
    }

    // Process and save users
    const syncResults = {
      totalFetched: result.users.length,
      created: 0,
      updated: 0,
      errors: 0,
      skipped: 0
    };

    for (const jcUser of result.users) {
      try {
        // Check if user already exists
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
          // Update existing user
          await prisma.user.update({
            where: { id: existingUser.id },
            data: userData
          });
          syncResults.updated++;
        } else {
          // Create new user
          await prisma.user.create({
            data: {
              ...userData,
              role: 'VIEW', // Default role for synced users
              riskScore: 10, // Default low risk
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

    // Update tool with success status
    await prisma.tool.update({
      where: { id: jumpcloudTool.id },
      data: {
        syncStatus: 'SUCCESS',
        lastSync: new Date(),
        userCount: syncResults.totalFetched,
        errorMessage: null
      }
    });

    // Log sync completion
    await prisma.auditLog.create({
      data: {
        action: 'JUMPCLOUD_SYNC_COMPLETED',
        category: 'SYNC',
        resourceId: jumpcloudTool.id,
        resourceType: 'Tool',
        details: {
          ...syncResults,
          fullSync,
          duration: Date.now() // Could track actual duration
        },
        timestamp: new Date()
      }
    }).catch(err => logger.error('Failed to log sync completion:', err));

    logger.info(`JumpCloud sync completed: ${JSON.stringify(syncResults)}`);

    res.json({
      success: true,
      message: 'JumpCloud sync completed successfully',
      data: {
        ...syncResults,
        syncedAt: new Date().toISOString(),
        nextSyncRecommended: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString() // 6 hours
      }
    });

  } catch (error) {
    logger.error('JumpCloud sync error:', error);

    // Update tool with error status
    try {
      const jumpcloudTool = await prisma.tool.findFirst({
        where: { name: 'JumpCloud' }
      });
      
      if (jumpcloudTool) {
        await prisma.tool.update({
          where: { id: jumpcloudTool.id },
          data: {
            syncStatus: 'ERROR',
            errorMessage: error.message,
            lastSync: new Date()
          }
        });
      }
    } catch (updateError) {
      logger.error('Failed to update tool error status:', updateError);
    }

    res.status(500).json({
      success: false,
      error: 'JumpCloud sync failed',
      details: error.message
    });
  }
});

// Get sync history
router.get('/sync-history', async (req, res) => {
  try {
    const { limit = 10, offset = 0 } = req.query;

    const jumpcloudTool = await prisma.tool.findFirst({
      where: { name: 'JumpCloud' }
    });

    if (!jumpcloudTool) {
      return res.json({
        success: true,
        data: []
      });
    }

    const syncHistory = await prisma.auditLog.findMany({
      where: {
        resourceId: jumpcloudTool.id,
        action: { in: ['JUMPCLOUD_SYNC_COMPLETED', 'JUMPCLOUD_SYNC_FAILED'] }
      },
      orderBy: { timestamp: 'desc' },
      take: parseInt(limit),
      skip: parseInt(offset)
    });

    res.json({
      success: true,
      data: syncHistory.map(log => ({
        id: log.id,
        action: log.action,
        timestamp: log.timestamp,
        details: log.details,
        success: log.action === 'JUMPCLOUD_SYNC_COMPLETED'
      }))
    });

  } catch (error) {
    logger.error('Failed to get JumpCloud sync history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get sync history'
    });
  }
});

export default router;
