import express from 'express';
import logger from '../utils/logger.js';
import { getPrismaClient } from '../utils/database.js';

const router = express.Router();
const prisma = getPrismaClient();

// Validation function to check if tool users exist in active user list
async function validateToolUsers(toolUsers, activeUserList) {
  const validatedUsers = [];
  const invalidUsers = [];
  
  for (const toolUser of toolUsers) {
    const activeUser = activeUserList.find(user => 
      user.email.toLowerCase() === toolUser.email.toLowerCase()
    );
    
    if (activeUser) {
      validatedUsers.push({
        ...toolUser,
        activeUserId: activeUser.id,
        status: activeUser.status,
        isValid: true
      });
    } else {
      invalidUsers.push({
        ...toolUser,
        isValid: false,
        reason: 'User not found in active directory'
      });
    }
  }
  
  return { validatedUsers, invalidUsers };
}

// Get all users with enhanced filtering and exit employee highlighting
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      status, 
      department, 
      search,
      riskLevel,
      includeExit = false
    } = req.query;
    
    const offset = (page - 1) * limit;
    
    const whereClause = {
      ...(status && status !== 'ALL' && { status }),
      ...(department && department !== 'ALL' && { department }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { employeeId: { contains: search, mode: 'insensitive' } }
        ]
      }),
      ...(riskLevel && {
        riskScore: {
          gte: riskLevel === 'HIGH' ? 70 : riskLevel === 'MEDIUM' ? 30 : 0,
          lt: riskLevel === 'HIGH' ? 100 : riskLevel === 'MEDIUM' ? 70 : 30
        }
      })
    };

    // Include exit users only if explicitly requested
    if (!includeExit && !status) {
      whereClause.status = { not: 'EXIT' };
    }

    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        where: whereClause,
        include: {
          userAccess: {
            include: {
              tool: {
                select: {
                  name: true,
                  category: true
                }
              }
            }
          },
          _count: {
            select: { userAccess: true }
          }
        },
        orderBy: [
          { status: 'asc' }, // Exit users first if included
          { riskScore: 'desc' },
          { name: 'asc' }
        ],
        skip: offset,
        take: parseInt(limit)
      }),
      prisma.user.count({ where: whereClause })
    ]);

    // Enhance user data with exit employee highlighting
    const enhancedUsers = users.map(user => ({
      ...user,
      isExitEmployee: user.status === 'EXIT',
      daysAfterExit: user.exitDate ? 
        Math.floor((new Date() - new Date(user.exitDate)) / (1000 * 60 * 60 * 24)) : null,
      activeAccessCount: user.userAccess.filter(access => access.status === 'ACTIVE').length,
      riskLevel: user.riskScore >= 70 ? 'HIGH' : user.riskScore >= 30 ? 'MEDIUM' : 'LOW',
      toolsAccess: user.userAccess.map(access => ({
        toolName: access.tool.name,
        toolCategory: access.tool.category,
        role: access.role,
        status: access.status,
        permissions: access.permissions,
        grantedAt: access.grantedAt,
        lastAccessed: access.lastAccessed,
        riskScore: access.riskScore
      }))
    }));

    res.json({
      success: true,
      data: enhancedUsers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      },
      summary: {
        totalUsers: totalCount,
        exitEmployees: enhancedUsers.filter(u => u.isExitEmployee).length,
        highRiskUsers: enhancedUsers.filter(u => u.riskLevel === 'HIGH').length
      }
    });
  } catch (error) {
    logger.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch users'
    });
  }
});

// Get user details with tool access
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        userAccess: {
          include: {
            tool: true
          },
          orderBy: { grantedAt: 'desc' }
        }
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Get user's recent activity logs
    const recentLogs = await prisma.log.findMany({
      where: {
        OR: [
          { userId: id },
          { details: { contains: user.email } }
        ]
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    const enhancedUser = {
      ...user,
      isExitEmployee: user.status === 'EXIT',
      daysAfterExit: user.exitDate ? 
        Math.floor((new Date() - new Date(user.exitDate)) / (1000 * 60 * 60 * 24)) : null,
      activeAccessCount: user.userAccess.filter(access => access.status === 'ACTIVE').length,
      riskLevel: user.riskScore >= 70 ? 'HIGH' : user.riskScore >= 30 ? 'MEDIUM' : 'LOW',
      recentActivity: recentLogs
    };

    res.json({
      success: true,
      data: enhancedUser
    });
  } catch (error) {
    logger.error('Error fetching user details:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user details'
    });
  }
});

// Sync users from external source (e.g., JumpCloud)
router.post('/sync', async (req, res) => {
  try {
    const { source = 'JUMPCLOUD', users: externalUsers } = req.body;

    if (!externalUsers || !Array.isArray(externalUsers)) {
      return res.status(400).json({
        success: false,
        error: 'Users array is required'
      });
    }

    // Get existing active users for validation
    const activeUsers = await prisma.user.findMany({
      where: { status: { not: 'EXIT' } },
      select: { id: true, email: true, status: true }
    });

    // Validate external users against active directory
    const { validatedUsers, invalidUsers } = await validateToolUsers(externalUsers, activeUsers);

    // Process validated users
    const syncResults = {
      created: 0,
      updated: 0,
      errors: 0,
      invalidUsers: invalidUsers.length
    };

    for (const user of validatedUsers) {
      try {
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email }
        });

        if (existingUser) {
          // Update existing user
          await prisma.user.update({
            where: { id: existingUser.id },
            data: {
              name: user.name || existingUser.name,
              department: user.department || existingUser.department,
              jobTitle: user.jobTitle || existingUser.jobTitle,
              manager: user.manager || existingUser.manager,
              location: user.location || existingUser.location,
              phoneNumber: user.phoneNumber || existingUser.phoneNumber,
              lastSyncAt: new Date(),
              syncSource: source
            }
          });
          syncResults.updated++;
        } else {
          // Create new user
          await prisma.user.create({
            data: {
              email: user.email,
              name: user.name,
              employeeId: user.employeeId || user.email,
              department: user.department || 'Unknown',
              jobTitle: user.jobTitle || 'Unknown',
              manager: user.manager,
              location: user.location || 'Unknown',
              phoneNumber: user.phoneNumber,
              status: 'ACTIVE',
              riskScore: 10, // Default low risk for new users
              createdDate: new Date(),
              lastSyncAt: new Date(),
              syncSource: source
            }
          });
          syncResults.created++;
        }
      } catch (userError) {
        logger.error(`Error processing user ${user.email}:`, userError);
        syncResults.errors++;
      }
    }

    // Log sync activity
    await prisma.log.create({
      data: {
        action: 'USER_SYNC',
        entityType: 'USER',
        userId: req.user?.id || 'system',
        details: JSON.stringify({
          source,
          totalUsers: externalUsers.length,
          validatedUsers: validatedUsers.length,
          invalidUsers: invalidUsers.length,
          results: syncResults
        })
      }
    });

    logger.info('User sync completed', { source, results: syncResults });

    res.json({
      success: true,
      data: {
        ...syncResults,
        invalidUsers: invalidUsers
      },
      message: `Sync completed: ${syncResults.created} created, ${syncResults.updated} updated, ${syncResults.errors} errors`
    });
  } catch (error) {
    logger.error('Error syncing users:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to sync users'
    });
  }
});

// Mark user as exit employee
router.patch('/:id/exit', async (req, res) => {
  try {
    const { id } = req.params;
    const { exitDate, reason, removeAccess = false } = req.body;

    const user = await prisma.user.findUnique({ where: { id } });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Update user status to EXIT
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        status: 'EXIT',
        exitDate: exitDate ? new Date(exitDate) : new Date(),
        exitReason: reason
      }
    });

    // Optionally remove all active access
    if (removeAccess) {
      await prisma.userAccess.updateMany({
        where: {
          userId: id,
          status: 'ACTIVE'
        },
        data: {
          status: 'REMOVED',
          removedAt: new Date()
        }
      });
    }

    // Log exit employee action
    await prisma.log.create({
      data: {
        action: 'USER_EXIT_MARKED',
        entityType: 'USER',
        entityId: id,
        userId: req.user?.id || 'system',
        details: JSON.stringify({
          userEmail: user.email,
          exitDate,
          reason,
          accessRemoved: removeAccess
        })
      }
    });

    logger.info(`User marked as exit: ${user.email}`);

    res.json({
      success: true,
      data: updatedUser,
      message: `User ${user.name} marked as exit employee`
    });
  } catch (error) {
    logger.error('Error marking user as exit:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark user as exit employee'
    });
  }
});

// Get exit employees with active access (for reports)
router.get('/exit/with-access', async (req, res) => {
  try {
    const exitUsersWithAccess = await prisma.user.findMany({
      where: {
        status: 'EXIT',
        userAccess: {
          some: {
            status: 'ACTIVE'
          }
        }
      },
      include: {
        userAccess: {
          where: { status: 'ACTIVE' },
          include: {
            tool: {
              select: {
                name: true,
                category: true
              }
            }
          }
        }
      },
      orderBy: { exitDate: 'desc' }
    });

    const highlightedUsers = exitUsersWithAccess.map(user => ({
      ...user,
      daysAfterExit: user.exitDate ? 
        Math.floor((new Date() - new Date(user.exitDate)) / (1000 * 60 * 60 * 24)) : 0,
      activeToolsCount: user.userAccess.length,
      riskLevel: user.userAccess.length > 5 ? 'HIGH' : 
                 user.userAccess.length > 2 ? 'MEDIUM' : 'LOW',
      highlighted: true // Mark for highlighting in reports
    }));

    res.json({
      success: true,
      data: highlightedUsers,
      summary: {
        totalExitUsersWithAccess: exitUsersWithAccess.length,
        highRisk: highlightedUsers.filter(u => u.riskLevel === 'HIGH').length,
        mediumRisk: highlightedUsers.filter(u => u.riskLevel === 'MEDIUM').length,
        lowRisk: highlightedUsers.filter(u => u.riskLevel === 'LOW').length
      }
    });
  } catch (error) {
    logger.error('Error fetching exit users with access:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch exit users with access'
    });
  }
});

// Validate tool users against active directory
router.post('/validate-tool-users', async (req, res) => {
  try {
    const { toolId, toolUsers } = req.body;

    if (!toolUsers || !Array.isArray(toolUsers)) {
      return res.status(400).json({
        success: false,
        error: 'Tool users array is required'
      });
    }

    // Get active users from database
    const activeUsers = await prisma.user.findMany({
      where: { status: { in: ['ACTIVE', 'SUSPENDED'] } },
      select: { id: true, email: true, name: true, status: true }
    });

    // Validate tool users
    const { validatedUsers, invalidUsers } = await validateToolUsers(toolUsers, activeUsers);

    // If tool ID provided, check existing access
    let existingAccess = [];
    if (toolId) {
      existingAccess = await prisma.userAccess.findMany({
        where: { toolId },
        select: { userId: true, status: true }
      });
    }

    const enrichedValidatedUsers = validatedUsers.map(user => ({
      ...user,
      hasExistingAccess: existingAccess.some(access => 
        access.userId === user.activeUserId && access.status === 'ACTIVE'
      )
    }));

    res.json({
      success: true,
      data: {
        validatedUsers: enrichedValidatedUsers,
        invalidUsers,
        summary: {
          totalUsers: toolUsers.length,
          validUsers: validatedUsers.length,
          invalidUsers: invalidUsers.length,
          duplicateAccess: enrichedValidatedUsers.filter(u => u.hasExistingAccess).length
        }
      }
    });
  } catch (error) {
    logger.error('Error validating tool users:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to validate tool users'
    });
  }
});

// Update user risk score
router.patch('/:id/risk-score', async (req, res) => {
  try {
    const { id } = req.params;
    const { riskScore, reason } = req.body;

    if (riskScore < 0 || riskScore > 100) {
      return res.status(400).json({
        success: false,
        error: 'Risk score must be between 0 and 100'
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { riskScore }
    });

    // Log risk score update
    await prisma.log.create({
      data: {
        action: 'RISK_SCORE_UPDATED',
        entityType: 'USER',
        entityId: id,
        userId: req.user?.id || 'system',
        details: JSON.stringify({
          userEmail: updatedUser.email,
          newRiskScore: riskScore,
          reason
        })
      }
    });

    res.json({
      success: true,
      data: updatedUser,
      message: 'Risk score updated successfully'
    });
  } catch (error) {
    logger.error('Error updating risk score:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update risk score'
    });
  }
});

export default router;