import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { getPrismaClient } from './database.js';
import logger from './logger.js';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

export async function hashPassword(password) {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
}

export async function comparePassword(password, hashedPassword) {
  return await bcrypt.compare(password, hashedPassword);
}

export function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    logger.error('Token verification failed', { error: error.message });
    return null;
  }
}

export async function authenticateUser(event) {
  try {
    const authHeader = event.headers.authorization || event.headers.Authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { 
        success: false, 
        error: 'No token provided',
        statusCode: 401 
      };
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return { 
        success: false, 
        error: 'Invalid token',
        statusCode: 401 
      };
    }

    // Get user from database
    const prisma = getPrismaClient();
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true
      }
    });

    if (!user) {
      return { 
        success: false, 
        error: 'User not found',
        statusCode: 401 
      };
    }

    if (user.status !== 'ACTIVE') {
      return { 
        success: false, 
        error: 'User account is not active',
        statusCode: 403 
      };
    }

    return { 
      success: true, 
      user,
      decoded 
    };
  } catch (error) {
    logger.error('Authentication error', { error: error.message });
    return { 
      success: false, 
      error: 'Authentication failed',
      statusCode: 500 
    };
  }
}

export function requireRole(allowedRoles) {
  return (user) => {
    if (!allowedRoles.includes(user.role)) {
      return {
        success: false,
        error: 'Insufficient permissions',
        statusCode: 403
      };
    }
    return { success: true };
  };
}
