import express from 'express';
import logger from '../utils/logger.js';
import { getPrismaClient } from '../utils/database.js';

const router = express.Router();
const prisma = getPrismaClient();

// Get audit logs with advanced filtering
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      action,
      entityType,
      userId,
      startDate,
      endDate,
      search,
      severity
    } = req.query;

    const offset = (page - 1) * limit;

    // Build where clause
    const whereClause = {
      ...(action && action !== 'ALL' && { action: { contains: action, mode: 'insensitive' } }),
      ...(entityType && entityType !== 'ALL' && { entityType }),
      ...(userId && { userId }),
      ...(startDate && endDate && {
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      }),
      ...(search && {
        OR: [
          { action: { contains: search, mode: 'insensitive' } },
          { details: { contains: search, mode: 'insensitive' } },
          { ipAddress: { contains: search, mode: 'insensitive' } },
          { userAgent: { contains: search, mode: 'insensitive' } }
        ]
      }),
      ...(severity && severity !== 'ALL' && { severity })
    };

    const [logs, totalCount] = await Promise.all([
      prisma.log.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              email: true,
              name: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: parseInt(limit)
      }),
      prisma.log.count({ where: whereClause })
    ]);

    // Enhance logs with parsed details and risk assessment
    const enhancedLogs = logs.map(log => {
      let parsedDetails = {};
      try {
        parsedDetails = log.details ? JSON.parse(log.details) : {};
      } catch (e) {
        parsedDetails = { rawDetails: log.details };
      }

      // Determine risk level based on action
      const riskLevel = determineRiskLevel(log.action, parsedDetails);

      return {
        ...log,
        parsedDetails,
        riskLevel,
        userName: log.user?.name || 'System',
        userEmail: log.user?.email || 'system@platform.com'
      };
    });

    res.json({
      success: true,
      data: enhancedLogs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      },
      summary: {
        totalLogs: totalCount,
        highRiskLogs: enhancedLogs.filter(l => l.riskLevel === 'HIGH').length,
        mediumRiskLogs: enhancedLogs.filter(l => l.riskLevel === 'MEDIUM').length,
        lowRiskLogs: enhancedLogs.filter(l => l.riskLevel === 'LOW').length
      }
    });
  } catch (error) {
    logger.error('Error fetching logs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch audit logs'
    });
  }
});

// Get log statistics for dashboard
router.get('/stats', async (req, res) => {
  try {
    const { timeRange = '24h' } = req.query;
    
    let startDate;
    switch (timeRange) {
      case '1h':
        startDate = new Date(Date.now() - 1 * 60 * 60 * 1000);
        break;
      case '24h':
        startDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
    }

    const [
      totalLogs,
      userActions,
      systemActions,
      errorLogs,
      securityEvents,
      actionBreakdown,
      userActivity,
      timelineData
    ] = await Promise.all([
      // Total logs in timeframe
      prisma.log.count({
        where: { createdAt: { gte: startDate } }
      }),
      
      // User-initiated actions
      prisma.log.count({
        where: {
          createdAt: { gte: startDate },
          userId: { not: 'system' }
        }
      }),
      
      // System-initiated actions
      prisma.log.count({
        where: {
          createdAt: { gte: startDate },
          userId: 'system'
        }
      }),
      
      // Error logs
      prisma.log.count({
        where: {
          createdAt: { gte: startDate },
          severity: 'ERROR'
        }
      }),
      
      // Security-related events
      prisma.log.count({
        where: {
          createdAt: { gte: startDate },
          action: {
            in: ['USER_LOGIN', 'USER_LOGOUT', 'USER_LOGIN_FAILED', 'USER_ROLE_CHANGED', 'USER_DEACTIVATED']
          }
        }
      }),
      
      // Action breakdown
      prisma.log.groupBy({
        by: ['action'],
        where: { createdAt: { gte: startDate } },
        _count: { action: true },
        orderBy: { _count: { action: 'desc' } },
        take: 10
      }),
      
      // Top active users
      prisma.log.groupBy({
        by: ['userId'],
        where: {
          createdAt: { gte: startDate },
          userId: { not: 'system' }
        },
        _count: { userId: true },
        orderBy: { _count: { userId: 'desc' } },
        take: 10
      }),
      
      // Timeline data (hourly breakdown for last 24h)
      prisma.$queryRaw`
        SELECT 
          DATE_TRUNC('hour', created_at) as hour,
          COUNT(*) as count,
          COUNT(CASE WHEN severity = 'ERROR' THEN 1 END) as errors,
          COUNT(CASE WHEN action LIKE '%LOGIN%' THEN 1 END) as logins
        FROM logs 
        WHERE created_at >= ${startDate}
        GROUP BY DATE_TRUNC('hour', created_at)
        ORDER BY hour ASC
      `
    ]);

    // Get user names for user activity
    const userIds = userActivity.map(u => u.userId).filter(id => id !== 'system');
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true }
    });

    const userActivityWithNames = userActivity.map(activity => {
      const user = users.find(u => u.id === activity.userId);
      return {
        ...activity,
        userName: user?.name || 'Unknown User',
        userEmail: user?.email || 'unknown@platform.com'
      };
    });

    res.json({
      success: true,
      data: {
        summary: {
          totalLogs,
          userActions,
          systemActions,
          errorLogs,
          securityEvents,
          timeRange
        },
        breakdown: {
          actions: actionBreakdown,
          users: userActivityWithNames,
          timeline: timelineData
        }
      }
    });
  } catch (error) {
    logger.error('Error fetching log statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch log statistics'
    });
  }
});

// Get specific log entry details
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const log = await prisma.log.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            email: true,
            name: true,
            role: true
          }
        }
      }
    });

    if (!log) {
      return res.status(404).json({
        success: false,
        error: 'Log entry not found'
      });
    }

    // Parse details
    let parsedDetails = {};
    try {
      parsedDetails = log.details ? JSON.parse(log.details) : {};
    } catch (e) {
      parsedDetails = { rawDetails: log.details };
    }

    // Get related logs (same user and entity within 1 hour)
    const relatedLogs = await prisma.log.findMany({
      where: {
        id: { not: id },
        OR: [
          { userId: log.userId },
          { entityId: log.entityId }
        ],
        createdAt: {
          gte: new Date(log.createdAt.getTime() - 60 * 60 * 1000), // 1 hour before
          lte: new Date(log.createdAt.getTime() + 60 * 60 * 1000)  // 1 hour after
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        user: {
          select: { name: true, email: true }
        }
      }
    });

    const enhancedLog = {
      ...log,
      parsedDetails,
      riskLevel: determineRiskLevel(log.action, parsedDetails),
      relatedLogs: relatedLogs.map(related => ({
        ...related,
        parsedDetails: related.details ? JSON.parse(related.details) : {}
      }))
    };

    res.json({
      success: true,
      data: enhancedLog
    });
  } catch (error) {
    logger.error('Error fetching log details:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch log details'
    });
  }
});

// Export audit logs
router.get('/export', async (req, res) => {
  try {
    const {
      format = 'csv',
      startDate,
      endDate,
      action,
      entityType,
      maxRecords = 10000
    } = req.query;

    // Build where clause
    const whereClause = {
      ...(action && action !== 'ALL' && { action }),
      ...(entityType && entityType !== 'ALL' && { entityType }),
      ...(startDate && endDate && {
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      })
    };

    const logs = await prisma.log.findMany({
      where: whereClause,
      include: {
        user: {
          select: { email: true, name: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(maxRecords)
    });

    if (format === 'csv') {
      // Generate CSV
      const csvHeaders = [
        'Timestamp',
        'Action',
        'Entity Type',
        'Entity ID',
        'User Email',
        'User Name',
        'IP Address',
        'User Agent',
        'Severity',
        'Details'
      ];

      const csvRows = logs.map(log => [
        log.createdAt.toISOString(),
        log.action,
        log.entityType || '',
        log.entityId || '',
        log.user?.email || 'system@platform.com',
        log.user?.name || 'System',
        log.ipAddress || '',
        log.userAgent || '',
        log.severity || 'INFO',
        (log.details || '').replace(/"/g, '""') // Escape quotes for CSV
      ]);

      const csvContent = [
        csvHeaders.join(','),
        ...csvRows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      const filename = `audit_logs_${new Date().toISOString().split('T')[0]}.csv`;
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(csvContent);
    } else {
      // JSON format
      const filename = `audit_logs_${new Date().toISOString().split('T')[0]}.json`;
      
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.json({
        exportedAt: new Date().toISOString(),
        totalRecords: logs.length,
        filters: { startDate, endDate, action, entityType },
        logs: logs.map(log => ({
          ...log,
          parsedDetails: log.details ? JSON.parse(log.details) : {}
        }))
      });
    }

    // Log the export
    await prisma.log.create({
      data: {
        action: 'AUDIT_LOGS_EXPORTED',
        entityType: 'LOG',
        userId: req.user?.id || 'system',
        details: JSON.stringify({
          format,
          recordCount: logs.length,
          filters: { startDate, endDate, action, entityType }
        })
      }
    });
  } catch (error) {
    logger.error('Error exporting logs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export audit logs'
    });
  }
});

// Search logs with advanced filtering
router.post('/search', async (req, res) => {
  try {
    const {
      query,
      filters = {},
      page = 1,
      limit = 50,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.body;

    const offset = (page - 1) * limit;

    // Build complex search query
    const searchConditions = [];
    
    if (query) {
      searchConditions.push({
        OR: [
          { action: { contains: query, mode: 'insensitive' } },
          { details: { contains: query, mode: 'insensitive' } },
          { ipAddress: { contains: query, mode: 'insensitive' } },
          { user: { email: { contains: query, mode: 'insensitive' } } },
          { user: { name: { contains: query, mode: 'insensitive' } } }
        ]
      });
    }

    if (filters.actions?.length > 0) {
      searchConditions.push({ action: { in: filters.actions } });
    }

    if (filters.users?.length > 0) {
      searchConditions.push({ userId: { in: filters.users } });
    }

    if (filters.dateRange) {
      searchConditions.push({
        createdAt: {
          gte: new Date(filters.dateRange.start),
          lte: new Date(filters.dateRange.end)
        }
      });
    }

    if (filters.severity) {
      searchConditions.push({ severity: filters.severity });
    }

    const whereClause = searchConditions.length > 0 
      ? { AND: searchConditions }
      : {};

    const [logs, totalCount] = await Promise.all([
      prisma.log.findMany({
        where: whereClause,
        include: {
          user: {
            select: { email: true, name: true }
          }
        },
        orderBy: { [sortBy]: sortOrder },
        skip: offset,
        take: parseInt(limit)
      }),
      prisma.log.count({ where: whereClause })
    ]);

    const enhancedLogs = logs.map(log => ({
      ...log,
      parsedDetails: log.details ? JSON.parse(log.details) : {},
      riskLevel: determineRiskLevel(log.action, log.details ? JSON.parse(log.details) : {})
    }));

    res.json({
      success: true,
      data: enhancedLogs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      },
      searchQuery: query,
      appliedFilters: filters
    });
  } catch (error) {
    logger.error('Error searching logs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search logs'
    });
  }
});

// Helper function to determine risk level based on action and details
function determineRiskLevel(action, details = {}) {
  const highRiskActions = [
    'USER_ROLE_CHANGED',
    'USER_DEACTIVATED',
    'USER_LOGIN_FAILED',
    'ACCESS_REVIEW_ENTRY_REMOVED',
    'SYSTEM_SETTINGS_UPDATED',
    'USER_REMOVED_FROM_TOOL'
  ];

  const mediumRiskActions = [
    'USER_CREATED',
    'USER_INVITED',
    'ACCESS_REVIEW_CREATED',
    'TOOL_SYNC',
    'USER_ADDED_TO_TOOL'
  ];

  if (highRiskActions.includes(action)) {
    return 'HIGH';
  } else if (mediumRiskActions.includes(action)) {
    return 'MEDIUM';
  } else if (action.includes('LOGIN') || action.includes('ACCESS')) {
    return 'MEDIUM';
  } else {
    return 'LOW';
  }
}

export default router;
