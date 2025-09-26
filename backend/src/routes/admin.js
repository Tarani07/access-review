import express from 'express';
import bcrypt from 'bcryptjs';
import logger from '../utils/logger.js';
import { getPrismaClient } from '../utils/database.js';

const router = express.Router();
const prisma = getPrismaClient();

// Get all admin users and invites
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 20, role } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {
      ...(role && role !== 'ALL' && { role })
    };

    const [users, invites, totalCount] = await Promise.all([
      prisma.user.findMany({
        where: {
          ...whereClause,
          role: { in: ['ADMIN', 'AUDITOR', 'MANAGER'] }
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          status: true,
          createdAt: true,
          lastLogin: true
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: parseInt(limit)
      }),
      prisma.invite.findMany({
        where: {
          status: 'PENDING'
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.count({
        where: {
          ...whereClause,
          role: { in: ['ADMIN', 'AUDITOR', 'MANAGER'] }
        }
      })
    ]);

    res.json({
      success: true,
      data: {
        users,
        pendingInvites: invites
      },
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    logger.error('Error fetching admin users:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch admin users'
    });
  }
});

// Send user invite
router.post('/invite', async (req, res) => {
  try {
    const {
      email,
      role,
      message,
      expiresInDays = 7
    } = req.body;

    if (!email || !role) {
      return res.status(400).json({
        success: false,
        error: 'Email and role are required'
      });
    }

    if (!['ADMIN', 'AUDITOR', 'MANAGER', 'USER'].includes(role)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid role specified'
      });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'User already exists'
      });
    }

    // Check for existing pending invite
    const existingInvite = await prisma.invite.findFirst({
      where: {
        email,
        status: 'PENDING'
      }
    });

    if (existingInvite) {
      return res.status(409).json({
        success: false,
        error: 'Pending invite already exists for this email'
      });
    }

    // Create invite
    const invite = await prisma.invite.create({
      data: {
        email,
        role,
        message,
        invitedBy: req.user?.id || 'system',
        expiresAt: new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000),
        token: require('crypto').randomBytes(32).toString('hex')
      }
    });

    // In production, send actual email
    // For now, just log the invite details
    logger.info(`User invite created for ${email} with role ${role}`);

    // Log invite creation
    await prisma.log.create({
      data: {
        action: 'USER_INVITED',
        entityType: 'INVITE',
        entityId: invite.id,
        userId: req.user?.id || 'system',
        details: JSON.stringify({
          inviteEmail: email,
          role,
          expiresAt: invite.expiresAt
        })
      }
    });

    res.status(201).json({
      success: true,
      data: {
        id: invite.id,
        email: invite.email,
        role: invite.role,
        expiresAt: invite.expiresAt,
        inviteLink: `${process.env.FRONTEND_URL}/accept-invite/${invite.token}`
      },
      message: 'User invite sent successfully'
    });
  } catch (error) {
    logger.error('Error creating user invite:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create user invite'
    });
  }
});

// Accept user invite
router.post('/invite/accept', async (req, res) => {
  try {
    const {
      token,
      name,
      password
    } = req.body;

    if (!token || !name || !password) {
      return res.status(400).json({
        success: false,
        error: 'Token, name, and password are required'
      });
    }

    // Find invite
    const invite = await prisma.invite.findFirst({
      where: {
        token,
        status: 'PENDING',
        expiresAt: { gt: new Date() }
      }
    });

    if (!invite) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired invite token'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: invite.email,
        name,
        passwordHash: hashedPassword,
        role: invite.role,
        status: 'ACTIVE',
        createdAt: new Date()
      }
    });

    // Update invite status
    await prisma.invite.update({
      where: { id: invite.id },
      data: {
        status: 'ACCEPTED',
        acceptedAt: new Date()
      }
    });

    // Log user creation from invite
    await prisma.log.create({
      data: {
        action: 'USER_CREATED_FROM_INVITE',
        entityType: 'USER',
        entityId: user.id,
        userId: user.id,
        details: JSON.stringify({
          inviteId: invite.id,
          userEmail: user.email,
          role: user.role
        })
      }
    });

    logger.info(`User created from invite: ${user.email} with role ${user.role}`);

    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      },
      message: 'Account created successfully'
    });
  } catch (error) {
    logger.error('Error accepting invite:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to accept invite'
    });
  }
});

// Update user role
router.patch('/users/:id/role', async (req, res) => {
  try {
    const { id } = req.params;
    const { role, reason } = req.body;

    if (!role || !['ADMIN', 'AUDITOR', 'MANAGER', 'USER'].includes(role)) {
      return res.status(400).json({
        success: false,
        error: 'Valid role is required'
      });
    }

    const user = await prisma.user.findUnique({
      where: { id }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const previousRole = user.role;
    
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { role }
    });

    // Log role change
    await prisma.log.create({
      data: {
        action: 'USER_ROLE_CHANGED',
        entityType: 'USER',
        entityId: id,
        userId: req.user?.id || 'system',
        details: JSON.stringify({
          userEmail: user.email,
          previousRole,
          newRole: role,
          reason
        })
      }
    });

    logger.info(`User role updated: ${user.email} from ${previousRole} to ${role}`);

    res.json({
      success: true,
      data: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role
      },
      message: 'User role updated successfully'
    });
  } catch (error) {
    logger.error('Error updating user role:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update user role'
    });
  }
});

// Deactivate user
router.patch('/users/:id/deactivate', async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const user = await prisma.user.findUnique({
      where: { id }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { 
        status: 'INACTIVE',
        deactivatedAt: new Date(),
        deactivatedBy: req.user?.id || 'system',
        deactivationReason: reason
      }
    });

    // Log deactivation
    await prisma.log.create({
      data: {
        action: 'USER_DEACTIVATED',
        entityType: 'USER',
        entityId: id,
        userId: req.user?.id || 'system',
        details: JSON.stringify({
          userEmail: user.email,
          reason
        })
      }
    });

    logger.info(`User deactivated: ${user.email}`);

    res.json({
      success: true,
      data: {
        id: updatedUser.id,
        email: updatedUser.email,
        status: updatedUser.status
      },
      message: 'User deactivated successfully'
    });
  } catch (error) {
    logger.error('Error deactivating user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to deactivate user'
    });
  }
});

// Reactivate user
router.patch('/users/:id/activate', async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { 
        status: 'ACTIVE',
        reactivatedAt: new Date(),
        reactivatedBy: req.user?.id || 'system'
      }
    });

    // Log reactivation
    await prisma.log.create({
      data: {
        action: 'USER_REACTIVATED',
        entityType: 'USER',
        entityId: id,
        userId: req.user?.id || 'system',
        details: JSON.stringify({
          userEmail: user.email
        })
      }
    });

    logger.info(`User reactivated: ${user.email}`);

    res.json({
      success: true,
      data: {
        id: updatedUser.id,
        email: updatedUser.email,
        status: updatedUser.status
      },
      message: 'User reactivated successfully'
    });
  } catch (error) {
    logger.error('Error reactivating user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reactivate user'
    });
  }
});

// Cancel pending invite
router.delete('/invite/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const invite = await prisma.invite.findUnique({
      where: { id }
    });

    if (!invite) {
      return res.status(404).json({
        success: false,
        error: 'Invite not found'
      });
    }

    await prisma.invite.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancelledBy: req.user?.id || 'system'
      }
    });

    // Log invite cancellation
    await prisma.log.create({
      data: {
        action: 'INVITE_CANCELLED',
        entityType: 'INVITE',
        entityId: id,
        userId: req.user?.id || 'system',
        details: JSON.stringify({
          inviteEmail: invite.email,
          role: invite.role
        })
      }
    });

    logger.info(`Invite cancelled: ${invite.email}`);

    res.json({
      success: true,
      message: 'Invite cancelled successfully'
    });
  } catch (error) {
    logger.error('Error cancelling invite:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cancel invite'
    });
  }
});

// Get system settings
router.get('/settings', async (req, res) => {
  try {
    // In production, these would be stored in database
    const settings = {
      platform: {
        name: 'SparrowVision',
        version: '2.0.0',
        environment: process.env.NODE_ENV || 'development'
      },
      security: {
        passwordMinLength: 8,
        sessionTimeout: 60, // minutes
        maxLoginAttempts: 5,
        lockoutDuration: 15 // minutes
      },
      notifications: {
        emailEnabled: true,
        slackEnabled: true,
        webhooksEnabled: true
      },
      compliance: {
        framework: 'ISO 27001',
        auditLogRetention: 2555, // days (7 years)
        reviewFrequency: 90, // days
        autoExitEmployeeReview: true
      },
      integrations: {
        jumpcloudEnabled: true,
        railwayEnabled: true,
        maxApiCalls: 1000, // per hour
        syncFrequency: 24 // hours
      }
    };

    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    logger.error('Error fetching system settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch system settings'
    });
  }
});

// Update system settings
router.patch('/settings', async (req, res) => {
  try {
    const { section, settings } = req.body;

    if (!section || !settings) {
      return res.status(400).json({
        success: false,
        error: 'Section and settings are required'
      });
    }

    // Log settings update
    await prisma.log.create({
      data: {
        action: 'SYSTEM_SETTINGS_UPDATED',
        entityType: 'SYSTEM',
        userId: req.user?.id || 'system',
        details: JSON.stringify({
          section,
          changes: settings
        })
      }
    });

    logger.info(`System settings updated: ${section}`, { settings });

    res.json({
      success: true,
      message: `${section} settings updated successfully`
    });
  } catch (error) {
    logger.error('Error updating system settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update system settings'
    });
  }
});

// Get admin dashboard stats
router.get('/stats', async (req, res) => {
  try {
    const [
      totalUsers,
      adminUsers,
      pendingInvites,
      activeReviews,
      totalTools,
      connectedTools,
      recentLogs
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: { in: ['ADMIN', 'AUDITOR', 'MANAGER'] } } }),
      prisma.invite.count({ where: { status: 'PENDING' } }),
      prisma.accessReview.count({ where: { status: { in: ['PENDING', 'IN_PROGRESS'] } } }),
      prisma.tool.count(),
      prisma.tool.count({ where: { status: 'CONNECTED' } }),
      prisma.log.count({
        where: {
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        }
      })
    ]);

    res.json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          admins: adminUsers,
          regular: totalUsers - adminUsers
        },
        invites: {
          pending: pendingInvites
        },
        reviews: {
          active: activeReviews
        },
        tools: {
          total: totalTools,
          connected: connectedTools,
          disconnected: totalTools - connectedTools
        },
        activity: {
          logsLast24h: recentLogs
        }
      }
    });
  } catch (error) {
    logger.error('Error fetching admin stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch admin statistics'
    });
  }
});

export default router;
