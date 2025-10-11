import { getPrismaClient } from './utils/database.js';
import { authenticateUser } from './utils/auth.js';
import logger from './utils/logger.js';

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

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
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
    const path = event.path.replace('/.netlify/functions/dashboard', '');

    // GET /dashboard/stats
    if (path === '/stats' || path === '') {
      const [
        totalUsers,
        activeUsers,
        totalTools,
        activeTools,
        pendingReviews,
        completedReviews,
        recentLogs
      ] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { status: 'ACTIVE' } }),
        prisma.tool.count(),
        prisma.tool.count({ where: { isActive: true } }),
        prisma.accessReview.count({ where: { status: 'PENDING' } }),
        prisma.accessReview.count({ where: { status: 'COMPLETED' } }),
        prisma.log.findMany({
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            action: true,
            category: true,
            userEmail: true,
            createdAt: true
          }
        })
      ]);

      const stats = {
        users: {
          total: totalUsers,
          active: activeUsers,
          inactive: totalUsers - activeUsers
        },
        tools: {
          total: totalTools,
          active: activeTools,
          inactive: totalTools - activeTools
        },
        reviews: {
          pending: pendingReviews,
          completed: completedReviews,
          total: pendingReviews + completedReviews
        },
        recentActivity: recentLogs
      };

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          data: stats
        })
      };
    }

    // GET /dashboard/overview
    if (path === '/overview') {
      const [tools, reviews, riskScores] = await Promise.all([
        prisma.tool.findMany({
          select: {
            id: true,
            name: true,
            type: true,
            status: true,
            userCount: true,
            lastSync: true
          },
          orderBy: { name: 'asc' }
        }),
        prisma.accessReview.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            title: true,
            status: true,
            createdAt: true,
            totalUsers: true,
            reviewedItems: true
          }
        }),
        prisma.user.groupBy({
          by: ['riskScore'],
          _count: true,
          orderBy: { riskScore: 'desc' }
        })
      ]);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          data: {
            tools,
            recentReviews: reviews,
            riskDistribution: riskScores
          }
        })
      };
    }

    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: 'Route not found' })
    };

  } catch (error) {
    logger.error('Dashboard function error', { error: error.message });
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
}
