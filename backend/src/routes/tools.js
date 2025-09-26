import express from 'express';
import logger from '../utils/logger.js';
import { getPrismaClient } from '../utils/database.js';

const router = express.Router();
const prisma = getPrismaClient();

// Get all tools with user counts and status
router.get('/', async (req, res) => {
  try {
    const { category, status, search } = req.query;
    
    const whereClause = {
      ...(category && category !== 'ALL' && { category }),
      ...(status && status !== 'ALL' && { status }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } }
        ]
      })
    };

    const tools = await prisma.tool.findMany({
      where: whereClause,
      include: {
        _count: {
          select: { userAccess: true }
        }
      },
      orderBy: { name: 'asc' }
    });

    const toolsWithCounts = tools.map(tool => ({
      ...tool,
      userCount: tool._count.userAccess,
      _count: undefined
    }));

    res.json({
      success: true,
      data: toolsWithCounts,
      total: tools.length
    });
  } catch (error) {
    logger.error('Error fetching tools:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tools'
    });
  }
});

// Get custom tools (internal/purchased)
router.get('/custom', async (req, res) => {
  try {
    const customTools = await prisma.tool.findMany({
      where: {
        OR: [
          { category: 'CUSTOM' },
          { category: 'PURCHASED' }
        ]
      },
      include: {
        _count: {
          select: { userAccess: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: customTools.map(tool => ({
        ...tool,
        userCount: tool._count.userAccess
      }))
    });
  } catch (error) {
    logger.error('Error fetching custom tools:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch custom tools'
    });
  }
});

// Add new tool/integration
router.post('/', async (req, res) => {
  try {
    const {
      name,
      description,
      category,
      integrationType,
      apiConfig,
      webhookConfig,
      csvConfig,
      logo
    } = req.body;

    const tool = await prisma.tool.create({
      data: {
        name,
        description,
        category: category || 'INTEGRATION',
        integrationType,
        status: 'INACTIVE',
        apiConfig: apiConfig ? JSON.stringify(apiConfig) : null,
        webhookConfig: webhookConfig ? JSON.stringify(webhookConfig) : null,
        csvConfig: csvConfig ? JSON.stringify(csvConfig) : null,
        logo,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    logger.info(`Tool created: ${name} by user ${req.user?.email || 'system'}`);
    
    res.status(201).json({
      success: true,
      data: tool,
      message: 'Tool added successfully'
    });
  } catch (error) {
    logger.error('Error creating tool:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create tool'
    });
  }
});

// Update tool configuration
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const tool = await prisma.tool.update({
      where: { id },
      data: {
        ...updateData,
        updatedAt: new Date()
      }
    });

    logger.info(`Tool updated: ${tool.name} by user ${req.user?.email || 'system'}`);
    
    res.json({
      success: true,
      data: tool,
      message: 'Tool updated successfully'
    });
  } catch (error) {
    logger.error('Error updating tool:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update tool'
    });
  }
});

// Test tool connection
router.post('/:id/test', async (req, res) => {
  try {
    const { id } = req.params;
    const tool = await prisma.tool.findUnique({
      where: { id }
    });

    if (!tool) {
      return res.status(404).json({
        success: false,
        error: 'Tool not found'
      });
    }

    // Mock connection test - in production, implement actual connection testing
    const isConnected = Math.random() > 0.2; // 80% success rate
    
    await prisma.tool.update({
      where: { id },
      data: {
        status: isConnected ? 'CONNECTED' : 'ERROR',
        lastSyncAt: isConnected ? new Date() : null,
        updatedAt: new Date()
      }
    });

    res.json({
      success: true,
      connected: isConnected,
      message: isConnected ? 'Connection successful' : 'Connection failed'
    });
  } catch (error) {
    logger.error('Error testing tool connection:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to test connection'
    });
  }
});

// Sync tool users
router.post('/:id/sync', async (req, res) => {
  try {
    const { id } = req.params;
    const tool = await prisma.tool.findUnique({
      where: { id }
    });

    if (!tool) {
      return res.status(404).json({
        success: false,
        error: 'Tool not found'
      });
    }

    // Mock sync process - in production, implement actual syncing
    const syncedUsers = Math.floor(Math.random() * 100) + 50;
    
    await prisma.tool.update({
      where: { id },
      data: {
        lastSyncAt: new Date(),
        updatedAt: new Date()
      }
    });

    // Log sync activity
    await prisma.log.create({
      data: {
        action: 'TOOL_SYNC',
        entityType: 'TOOL',
        entityId: id,
        userId: req.user?.id || 'system',
        details: JSON.stringify({
          toolName: tool.name,
          syncedUsers,
          timestamp: new Date()
        })
      }
    });

    logger.info(`Tool synced: ${tool.name}, users: ${syncedUsers}`);
    
    res.json({
      success: true,
      syncedUsers,
      message: `Synced ${syncedUsers} users successfully`
    });
  } catch (error) {
    logger.error('Error syncing tool:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to sync tool'
    });
  }
});

// Add user to tool
router.post('/:id/users', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, role, permissions } = req.body;

    const userAccess = await prisma.userAccess.create({
      data: {
        userId,
        toolId: id,
        role: role || 'USER',
        permissions: permissions || [],
        status: 'ACTIVE',
        grantedAt: new Date()
      }
    });

    // Log user addition
    await prisma.log.create({
      data: {
        action: 'USER_ADDED_TO_TOOL',
        entityType: 'USER_ACCESS',
        entityId: userAccess.id,
        userId: req.user?.id || 'system',
        details: JSON.stringify({
          targetUserId: userId,
          toolId: id,
          role,
          permissions
        })
      }
    });

    logger.info(`User ${userId} added to tool ${id} with role ${role}`);
    
    res.status(201).json({
      success: true,
      data: userAccess,
      message: 'User added to tool successfully'
    });
  } catch (error) {
    logger.error('Error adding user to tool:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add user to tool'
    });
  }
});

// Remove user from tool
router.delete('/:id/users/:userId', async (req, res) => {
  try {
    const { id, userId } = req.params;

    const userAccess = await prisma.userAccess.findFirst({
      where: {
        userId,
        toolId: id
      }
    });

    if (!userAccess) {
      return res.status(404).json({
        success: false,
        error: 'User access not found'
      });
    }

    await prisma.userAccess.update({
      where: { id: userAccess.id },
      data: {
        status: 'REMOVED',
        removedAt: new Date()
      }
    });

    // Log user removal
    await prisma.log.create({
      data: {
        action: 'USER_REMOVED_FROM_TOOL',
        entityType: 'USER_ACCESS',
        entityId: userAccess.id,
        userId: req.user?.id || 'system',
        details: JSON.stringify({
          targetUserId: userId,
          toolId: id,
          removedBy: req.user?.email || 'system'
        })
      }
    });

    logger.info(`User ${userId} removed from tool ${id}`);
    
    res.json({
      success: true,
      message: 'User removed from tool successfully'
    });
  } catch (error) {
    logger.error('Error removing user from tool:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove user from tool'
    });
  }
});

// Delete tool
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Remove all user access records first
    await prisma.userAccess.deleteMany({
      where: { toolId: id }
    });

    // Delete the tool
    await prisma.tool.delete({
      where: { id }
    });

    logger.info(`Tool deleted: ${id} by user ${req.user?.email || 'system'}`);
    
    res.json({
      success: true,
      message: 'Tool deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting tool:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete tool'
    });
  }
});

export default router;
