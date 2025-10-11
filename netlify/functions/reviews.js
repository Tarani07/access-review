import { getPrismaClient } from './utils/database.js';
import { authenticateUser, requireRole } from './utils/auth.js';
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
    const path = event.path.replace('/.netlify/functions/reviews', '');
    const method = event.httpMethod;

    // GET /reviews - List all reviews
    if (method === 'GET' && (path === '' || path === '/')) {
      const reviews = await prisma.accessReview.findMany({
        include: {
          creator: {
            select: {
              id: true,
              email: true,
              name: true
            }
          },
          tool: {
            select: {
              id: true,
              name: true,
              type: true
            }
          },
          _count: {
            select: {
              reviewItems: true,
              entries: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          data: reviews
        })
      };
    }

    // POST /reviews - Create new review
    if (method === 'POST' && (path === '' || path === '/')) {
      const roleCheck = requireRole(['ADMIN', 'AUDITOR', 'MANAGER'])(authResult.user);
      if (!roleCheck.success) {
        return {
          statusCode: roleCheck.statusCode,
          headers,
          body: JSON.stringify({ error: roleCheck.error })
        };
      }

      const { title, reviewType, toolId, targetUser, description, dueDate } = JSON.parse(event.body || '{}');

      if (!title || !reviewType) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Title and review type are required' })
        };
      }

      const review = await prisma.accessReview.create({
        data: {
          title,
          reviewType,
          toolId,
          targetUser,
          description,
          dueDate: dueDate ? new Date(dueDate) : null,
          createdBy: authResult.user.id,
          status: 'PENDING'
        },
        include: {
          creator: {
            select: {
              email: true,
              name: true
            }
          },
          tool: {
            select: {
              name: true,
              type: true
            }
          }
        }
      });

      // Log the creation
      await prisma.log.create({
        data: {
          action: 'Create Access Review',
          category: 'REVIEW',
          userId: authResult.user.id,
          userEmail: authResult.user.email,
          resourceId: review.id,
          resourceType: 'AccessReview',
          details: { 
            title: review.title,
            reviewType: review.reviewType,
            toolId: review.toolId
          }
        }
      });

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({
          success: true,
          data: review
        })
      };
    }

    // GET /reviews/:id - Get specific review
    if (method === 'GET' && path.startsWith('/') && path.length > 1) {
      const reviewId = path.substring(1);
      
      const review = await prisma.accessReview.findUnique({
        where: { id: reviewId },
        include: {
          creator: {
            select: {
              email: true,
              name: true
            }
          },
          tool: {
            select: {
              name: true,
              type: true
            }
          },
          reviewItems: {
            orderBy: { reviewedAt: 'desc' }
          },
          entries: {
            orderBy: { reviewedAt: 'desc' }
          }
        }
      });

      if (!review) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'Review not found' })
        };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          data: review
        })
      };
    }

    // PUT /reviews/:id - Update review
    if (method === 'PUT' && path.startsWith('/') && path.length > 1) {
      const roleCheck = requireRole(['ADMIN', 'AUDITOR', 'MANAGER'])(authResult.user);
      if (!roleCheck.success) {
        return {
          statusCode: roleCheck.statusCode,
          headers,
          body: JSON.stringify({ error: roleCheck.error })
        };
      }

      const reviewId = path.substring(1);
      const updateData = JSON.parse(event.body || '{}');

      const review = await prisma.accessReview.findUnique({
        where: { id: reviewId }
      });

      if (!review) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'Review not found' })
        };
      }

      const updatedReview = await prisma.accessReview.update({
        where: { id: reviewId },
        data: {
          ...updateData,
          completedAt: updateData.status === 'COMPLETED' ? new Date() : review.completedAt
        },
        include: {
          creator: {
            select: {
              email: true,
              name: true
            }
          }
        }
      });

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          data: updatedReview
        })
      };
    }

    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: 'Route not found' })
    };

  } catch (error) {
    logger.error('Reviews function error', { error: error.message });
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
}
