import { getPrismaClient } from './utils/database.js';
import { authenticateUser, hashPassword, comparePassword, generateToken } from './utils/auth.js';
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

  const path = event.path.replace('/.netlify/functions/auth', '');
  const method = event.httpMethod;

  try {
    const prisma = getPrismaClient();

    // POST /auth/login
    if (method === 'POST' && (path === '/login' || path === '')) {
      const { email, password } = JSON.parse(event.body || '{}');

      if (!email || !password) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Email and password are required' })
        };
      }

      const user = await prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          status: true,
          passwordHash: true,
          lastLogin: true,
          loginCount: true
        }
      });

      if (!user || !user.passwordHash) {
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({ error: 'Invalid credentials' })
        };
      }

      if (user.status !== 'ACTIVE') {
        return {
          statusCode: 403,
          headers,
          body: JSON.stringify({ error: 'Account is not active' })
        };
      }

      const isValidPassword = await comparePassword(password, user.passwordHash);
      if (!isValidPassword) {
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({ error: 'Invalid credentials' })
        };
      }

      // Update login info
      await prisma.user.update({
        where: { id: user.id },
        data: {
          lastLogin: new Date(),
          loginCount: { increment: 1 }
        }
      });

      // Log the login
      await prisma.log.create({
        data: {
          action: 'Login',
          category: 'AUTH',
          userId: user.id,
          userEmail: user.email,
          ipAddress: event.headers['x-forwarded-for'] || event.headers['x-real-ip'],
          userAgent: event.headers['user-agent'],
          details: { success: true }
        }
      });

      const token = generateToken({ 
        userId: user.id, 
        email: user.email, 
        role: user.role 
      });

      const { passwordHash, ...userWithoutPassword } = user;

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          token,
          user: userWithoutPassword
        })
      };
    }

    // GET /auth/me
    if (method === 'GET' && path === '/me') {
      const authResult = await authenticateUser(event);
      if (!authResult.success) {
        return {
          statusCode: authResult.statusCode,
          headers,
          body: JSON.stringify({ error: authResult.error })
        };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          user: authResult.user
        })
      };
    }

    // POST /auth/register
    if (method === 'POST' && path === '/register') {
      const { email, password, name, role = 'VIEW' } = JSON.parse(event.body || '{}');

      if (!email || !password) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Email and password are required' })
        };
      }

      const existingUser = await prisma.user.findUnique({
        where: { email }
      });

      if (existingUser) {
        return {
          statusCode: 409,
          headers,
          body: JSON.stringify({ error: 'User already exists' })
        };
      }

      const passwordHash = await hashPassword(password);

      const user = await prisma.user.create({
        data: {
          email,
          name,
          role,
          passwordHash,
          status: 'ACTIVE'
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

      const token = generateToken({ 
        userId: user.id, 
        email: user.email, 
        role: user.role 
      });

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({
          success: true,
          token,
          user
        })
      };
    }

    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: 'Route not found' })
    };

  } catch (error) {
    logger.error('Auth function error', { error: error.message, path, method });
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
}
