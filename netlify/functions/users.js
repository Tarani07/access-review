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
    const path = event.path.replace('/.netlify/functions/users', '');
    const method = event.httpMethod;

    // GET /users - List all users
    if (method === 'GET' && (path === '' || path === '/')) {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          employeeId: true,
          department: true,
          jobTitle: true,
          manager: true,
          role: true,
          status: true,
          riskScore: true,
          lastLogin: true,
          createdAt: true,
          lastSyncAt: true,
          syncSource: true
        },
        orderBy: { name: 'asc' }
      });

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          data: users
        })
      };
    }

    // POST /users - Create new user
    if (method === 'POST' && (path === '' || path === '/')) {
      const roleCheck = requireRole(['ADMIN'])(authResult.user);
      if (!roleCheck.success) {
        return {
          statusCode: roleCheck.statusCode,
          headers,
          body: JSON.stringify({ error: roleCheck.error })
        };
      }

      const userData = JSON.parse(event.body || '{}');
      
      if (!userData.email) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Email is required' })
        };
      }

      const existingUser = await prisma.user.findUnique({
        where: { email: userData.email }
      });

      if (existingUser) {
        return {
          statusCode: 409,
          headers,
          body: JSON.stringify({ error: 'User already exists' })
        };
      }

      const user = await prisma.user.create({
        data: {
          ...userData,
          status: userData.status || 'ACTIVE',
          role: userData.role || 'VIEW',
          riskScore: userData.riskScore || 10
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          status: true,
          createdAt: true
        }
      });

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({
          success: true,
          data: user
        })
      };
    }

    // GET /users/:id - Get specific user
    if (method === 'GET' && path.startsWith('/') && path.length > 1) {
      const userId = path.substring(1);
      
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          userAccess: {
            include: {
              tool: {
                select: {
                  id: true,
                  name: true,
                  type: true,
                  status: true
                }
              }
            }
          }
        }
      });

      if (!user) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'User not found' })
        };
      }

      const { passwordHash, resetToken, ...userWithoutSensitiveData } = user;

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          data: userWithoutSensitiveData
        })
      };
    }

    // PUT /users/:id - Update user
    if (method === 'PUT' && path.startsWith('/') && path.length > 1) {
      const roleCheck = requireRole(['ADMIN'])(authResult.user);
      if (!roleCheck.success) {
        return {
          statusCode: roleCheck.statusCode,
          headers,
          body: JSON.stringify({ error: roleCheck.error })
        };
      }

      const userId = path.substring(1);
      const updateData = JSON.parse(event.body || '{}');

      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'User not found' })
        };
      }

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          ...updateData,
          updatedAt: new Date()
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          status: true,
          updatedAt: true
        }
      });

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          data: updatedUser
        })
      };
    }

    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: 'Route not found' })
    };

  } catch (error) {
    logger.error('Users function error', { error: error.message });
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
}
