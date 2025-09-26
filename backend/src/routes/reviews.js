import express from 'express';
import logger from '../utils/logger.js';
import { getPrismaClient } from '../utils/database.js';

const router = express.Router();
const prisma = getPrismaClient();

// Get all access reviews
router.get('/', async (req, res) => {
  try {
    const { 
      status, 
      type, 
      page = 1, 
      limit = 20,
      search 
    } = req.query;
    
    const offset = (page - 1) * limit;
    
    const whereClause = {
      ...(status && status !== 'ALL' && { status }),
      ...(type && type !== 'ALL' && { type }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { targetUser: { contains: search, mode: 'insensitive' } },
          { targetTool: { contains: search, mode: 'insensitive' } }
        ]
      })
    };

    const [reviews, totalCount] = await Promise.all([
      prisma.accessReview.findMany({
        where: whereClause,
        include: {
          entries: {
            select: {
              id: true,
              shouldRemove: true,
              reviewedBy: true,
              reviewedAt: true
            }
          },
          _count: {
            select: { entries: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: parseInt(limit)
      }),
      prisma.accessReview.count({ where: whereClause })
    ]);

    // Calculate progress for each review
    const reviewsWithProgress = reviews.map(review => {
      const totalItems = review._count.entries;
      const reviewedItems = review.entries.filter(entry => entry.reviewedAt).length;
      const flaggedItems = review.entries.filter(entry => entry.shouldRemove).length;
      
      return {
        ...review,
        totalItems,
        reviewedItems,
        flaggedItems,
        progressPercentage: totalItems > 0 ? Math.round((reviewedItems / totalItems) * 100) : 0,
        _count: undefined,
        entries: undefined // Remove entries from response to reduce payload
      };
    });

    res.json({
      success: true,
      data: reviewsWithProgress,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    logger.error('Error fetching access reviews:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch access reviews'
    });
  }
});

// Create new access review
router.post('/', async (req, res) => {
  try {
    const {
      title,
      type,
      targetUser,
      targetTool,
      description,
      dueDate,
      exitEmployeeEmails
    } = req.body;

    const review = await prisma.accessReview.create({
      data: {
        title,
        type,
        status: 'PENDING',
        targetUser,
        targetTool,
        description,
        dueDate: dueDate ? new Date(dueDate) : null,
        createdBy: req.user?.id || 'system',
        createdAt: new Date()
      }
    });

    // Generate review entries based on type
    let userAccessEntries = [];

    if (type === 'EXIT_EMPLOYEE' && exitEmployeeEmails) {
      // Find users by email and get their access
      const exitUsers = await prisma.user.findMany({
        where: {
          email: { in: exitEmployeeEmails.filter(email => email.trim()) },
          status: 'EXIT'
        },
        include: {
          userAccess: {
            where: { status: 'ACTIVE' },
            include: { tool: true }
          }
        }
      });

      // Create entries for each exit user's active access
      for (const user of exitUsers) {
        for (const access of user.userAccess) {
          userAccessEntries.push({
            reviewId: review.id,
            userId: user.id,
            toolId: access.toolId,
            userEmail: user.email,
            userName: user.name,
            toolName: access.tool.name,
            role: access.role,
            permissions: access.permissions || [],
            status: access.status,
            lastAccess: access.lastAccessed,
            shouldRemove: false,
            riskScore: access.riskScore || 0
          });
        }
      }
    } else if (type === 'USER_WISE' && targetUser) {
      // Get user's access
      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { email: targetUser },
            { name: targetUser },
            { employeeId: targetUser }
          ]
        },
        include: {
          userAccess: {
            where: { status: 'ACTIVE' },
            include: { tool: true }
          }
        }
      });

      if (user) {
        userAccessEntries = user.userAccess.map(access => ({
          reviewId: review.id,
          userId: user.id,
          toolId: access.toolId,
          userEmail: user.email,
          userName: user.name,
          toolName: access.tool.name,
          role: access.role,
          permissions: access.permissions || [],
          status: access.status,
          lastAccess: access.lastAccessed,
          shouldRemove: false,
          riskScore: access.riskScore || 0
        }));
      }
    } else if (type === 'TOOL_WISE' && targetTool) {
      // Get tool's users
      const toolAccess = await prisma.userAccess.findMany({
        where: {
          tool: {
            OR: [
              { name: { contains: targetTool, mode: 'insensitive' } },
              { id: targetTool }
            ]
          },
          status: 'ACTIVE'
        },
        include: {
          user: true,
          tool: true
        }
      });

      userAccessEntries = toolAccess.map(access => ({
        reviewId: review.id,
        userId: access.userId,
        toolId: access.toolId,
        userEmail: access.user.email,
        userName: access.user.name,
        toolName: access.tool.name,
        role: access.role,
        permissions: access.permissions || [],
        status: access.status,
        lastAccess: access.lastAccessed,
        shouldRemove: false,
        riskScore: access.riskScore || 0
      }));
    } else if (type === 'CUSTOM') {
      // For custom reviews, entries will be added separately
      // This is a placeholder for custom filter logic
    }

    // Create review entries
    if (userAccessEntries.length > 0) {
      await prisma.accessReviewEntry.createMany({
        data: userAccessEntries
      });
    }

    // Update review with entry count
    await prisma.accessReview.update({
      where: { id: review.id },
      data: {
        totalItems: userAccessEntries.length
      }
    });

    // Log review creation
    await prisma.log.create({
      data: {
        action: 'ACCESS_REVIEW_CREATED',
        entityType: 'ACCESS_REVIEW',
        entityId: review.id,
        userId: req.user?.id || 'system',
        details: JSON.stringify({
          title,
          type,
          entriesCount: userAccessEntries.length
        })
      }
    });

    logger.info(`Access review created: ${title} with ${userAccessEntries.length} entries`);

    res.status(201).json({
      success: true,
      data: {
        ...review,
        entriesCount: userAccessEntries.length
      },
      message: 'Access review created successfully'
    });
  } catch (error) {
    logger.error('Error creating access review:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create access review'
    });
  }
});

// Get review details with entries
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 50, status: entryStatus } = req.query;
    
    const offset = (page - 1) * limit;

    const review = await prisma.accessReview.findUnique({
      where: { id },
      include: {
        _count: {
          select: { entries: true }
        }
      }
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        error: 'Access review not found'
      });
    }

    // Get entries with pagination
    const whereClause = {
      reviewId: id,
      ...(entryStatus && entryStatus !== 'ALL' && { status: entryStatus })
    };

    const [entries, entriesCount] = await Promise.all([
      prisma.accessReviewEntry.findMany({
        where: whereClause,
        orderBy: [
          { shouldRemove: 'desc' },
          { riskScore: 'desc' },
          { userName: 'asc' }
        ],
        skip: offset,
        take: parseInt(limit)
      }),
      prisma.accessReviewEntry.count({ where: whereClause })
    ]);

    const reviewedCount = await prisma.accessReviewEntry.count({
      where: { reviewId: id, reviewedAt: { not: null } }
    });

    const flaggedCount = await prisma.accessReviewEntry.count({
      where: { reviewId: id, shouldRemove: true }
    });

    res.json({
      success: true,
      data: {
        ...review,
        entries,
        progress: {
          totalItems: review._count.entries,
          reviewedItems: reviewedCount,
          flaggedItems: flaggedCount,
          progressPercentage: review._count.entries > 0 
            ? Math.round((reviewedCount / review._count.entries) * 100) : 0
        },
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: entriesCount,
          pages: Math.ceil(entriesCount / limit)
        }
      }
    });
  } catch (error) {
    logger.error('Error fetching review details:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch review details'
    });
  }
});

// Update review entry (approve, flag, or remove)
router.patch('/:id/entries/:entryId', async (req, res) => {
  try {
    const { id, entryId } = req.params;
    const { action, notes } = req.body;

    if (!['approve', 'flag', 'remove'].includes(action)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid action. Must be approve, flag, or remove'
      });
    }

    const entry = await prisma.accessReviewEntry.findUnique({
      where: { id: entryId }
    });

    if (!entry || entry.reviewId !== id) {
      return res.status(404).json({
        success: false,
        error: 'Review entry not found'
      });
    }

    const updatedEntry = await prisma.accessReviewEntry.update({
      where: { id: entryId },
      data: {
        status: action === 'approve' ? 'APPROVED' : 
               action === 'flag' ? 'FLAGGED' : 'REMOVED',
        shouldRemove: action === 'remove',
        reviewedBy: req.user?.id || 'system',
        reviewedAt: new Date(),
        notes: notes || entry.notes
      }
    });

    // Update review progress
    const reviewedCount = await prisma.accessReviewEntry.count({
      where: { reviewId: id, reviewedAt: { not: null } }
    });

    const totalCount = await prisma.accessReviewEntry.count({
      where: { reviewId: id }
    });

    // Update review status if all entries are reviewed
    if (reviewedCount === totalCount) {
      await prisma.accessReview.update({
        where: { id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date()
        }
      });
    } else {
      await prisma.accessReview.update({
        where: { id },
        data: {
          status: 'IN_PROGRESS'
        }
      });
    }

    // Log the action
    await prisma.log.create({
      data: {
        action: `ACCESS_REVIEW_ENTRY_${action.toUpperCase()}`,
        entityType: 'ACCESS_REVIEW_ENTRY',
        entityId: entryId,
        userId: req.user?.id || 'system',
        details: JSON.stringify({
          reviewId: id,
          userEmail: entry.userEmail,
          toolName: entry.toolName,
          action,
          notes
        })
      }
    });

    res.json({
      success: true,
      data: updatedEntry,
      message: `Entry ${action}ed successfully`
    });
  } catch (error) {
    logger.error('Error updating review entry:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update review entry'
    });
  }
});

// Complete access review
router.patch('/:id/complete', async (req, res) => {
  try {
    const { id } = req.params;
    const { generateReport = true } = req.body;

    const review = await prisma.accessReview.findUnique({
      where: { id },
      include: {
        entries: true,
        _count: { select: { entries: true } }
      }
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        error: 'Access review not found'
      });
    }

    const reviewedCount = review.entries.filter(entry => entry.reviewedAt).length;
    const flaggedCount = review.entries.filter(entry => entry.shouldRemove).length;
    const removedCount = review.entries.filter(entry => entry.status === 'REMOVED').length;

    const updatedReview = await prisma.accessReview.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        reviewedItems: reviewedCount,
        flaggedItems: flaggedCount,
        removedItems: removedCount
      }
    });

    // Generate report if requested
    let reportId = null;
    if (generateReport) {
      const report = await prisma.report.create({
        data: {
          title: `${review.title} - Final Report`,
          type: 'ACCESS_REVIEW',
          reviewId: id,
          status: 'GENERATED',
          generatedAt: new Date(),
          generatedBy: req.user?.id || 'system',
          toolsReviewed: [...new Set(review.entries.map(e => e.toolName))],
          usersReviewed: reviewedCount,
          removals: removedCount,
          flags: flaggedCount
        }
      });
      reportId = report.id;
    }

    // Log completion
    await prisma.log.create({
      data: {
        action: 'ACCESS_REVIEW_COMPLETED',
        entityType: 'ACCESS_REVIEW',
        entityId: id,
        userId: req.user?.id || 'system',
        details: JSON.stringify({
          title: review.title,
          totalItems: review._count.entries,
          reviewedItems: reviewedCount,
          flaggedItems: flaggedCount,
          removedItems: removedCount,
          reportGenerated: generateReport,
          reportId
        })
      }
    });

    logger.info(`Access review completed: ${review.title}`);

    res.json({
      success: true,
      data: {
        ...updatedReview,
        reportId
      },
      message: 'Access review completed successfully'
    });
  } catch (error) {
    logger.error('Error completing access review:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to complete access review'
    });
  }
});

// Export review data
router.get('/:id/export', async (req, res) => {
  try {
    const { id } = req.params;
    const { format = 'json' } = req.query;

    const review = await prisma.accessReview.findUnique({
      where: { id },
      include: {
        entries: {
          orderBy: { userName: 'asc' }
        }
      }
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        error: 'Access review not found'
      });
    }

    // Format data for export
    const exportData = {
      review: {
        id: review.id,
        title: review.title,
        type: review.type,
        status: review.status,
        createdAt: review.createdAt,
        completedAt: review.completedAt,
        totalItems: review.entries.length,
        reviewedItems: review.entries.filter(e => e.reviewedAt).length,
        flaggedItems: review.entries.filter(e => e.shouldRemove).length
      },
      entries: review.entries.map(entry => ({
        userEmail: entry.userEmail,
        userName: entry.userName,
        toolName: entry.toolName,
        role: entry.role,
        permissions: entry.permissions,
        status: entry.status,
        shouldRemove: entry.shouldRemove,
        lastAccess: entry.lastAccess,
        reviewedAt: entry.reviewedAt,
        reviewedBy: entry.reviewedBy,
        notes: entry.notes,
        riskScore: entry.riskScore
      }))
    };

    if (format === 'csv') {
      // Generate CSV format
      const csv = [
        // CSV headers
        'User Email,User Name,Tool Name,Role,Status,Should Remove,Last Access,Reviewed At,Notes,Risk Score',
        // CSV data
        ...exportData.entries.map(entry => [
          entry.userEmail,
          entry.userName,
          entry.toolName,
          entry.role,
          entry.status,
          entry.shouldRemove ? 'Yes' : 'No',
          entry.lastAccess || '',
          entry.reviewedAt || '',
          (entry.notes || '').replace(/,/g, ';'),
          entry.riskScore || 0
        ].join(','))
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${review.title.replace(/[^a-zA-Z0-9]/g, '_')}.csv"`);
      res.send(csv);
    } else {
      res.json({
        success: true,
        data: exportData
      });
    }

    // Log export
    await prisma.log.create({
      data: {
        action: 'ACCESS_REVIEW_EXPORTED',
        entityType: 'ACCESS_REVIEW',
        entityId: id,
        userId: req.user?.id || 'system',
        details: JSON.stringify({
          reviewTitle: review.title,
          format,
          entriesCount: review.entries.length
        })
      }
    });
  } catch (error) {
    logger.error('Error exporting review:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export review'
    });
  }
});

export default router;
