import jwt from 'jsonwebtoken';
import { query } from '../config/database.js';

// Authentication middleware
export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        error: 'Access denied',
        message: 'No token provided'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // Check if user still exists and is active
    const userResult = await query(
      'SELECT id, email, is_active FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (userResult.rows.length === 0 || !userResult.rows[0].is_active) {
      return res.status(401).json({
        error: 'Access denied',
        message: 'User not found or inactive'
      });
    }

    // Add user info to request
    req.user = decoded;
    next();

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Invalid token',
        message: 'Token is malformed or invalid'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expired',
        message: 'Token has expired, please login again'
      });
    }

    console.error('Auth middleware error:', error);
    res.status(500).json({
      error: 'Authentication failed',
      message: 'An error occurred during authentication'
    });
  }
};

// Authorization middleware - check if user has required permission
export const requirePermission = (permission) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Access denied',
          message: 'Authentication required'
        });
      }

      const userPermissions = req.user.permissions || [];
      
      // Check if user has the required permission or is super admin
      if (userPermissions.includes('*') || userPermissions.includes(permission)) {
        next();
      } else {
        res.status(403).json({
          error: 'Access denied',
          message: `Permission '${permission}' required`
        });
      }
    } catch (error) {
      console.error('Permission check error:', error);
      res.status(500).json({
        error: 'Authorization failed',
        message: 'An error occurred during authorization'
      });
    }
  };
};

// Role-based authorization middleware
export const requireRole = (roles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Access denied',
          message: 'Authentication required'
        });
      }

      const userRole = req.user.role;
      const allowedRoles = Array.isArray(roles) ? roles : [roles];
      
      if (allowedRoles.includes(userRole)) {
        next();
      } else {
        res.status(403).json({
          error: 'Access denied',
          message: `Role '${userRole}' not authorized. Required: ${allowedRoles.join(' or ')}`
        });
      }
    } catch (error) {
      console.error('Role check error:', error);
      res.status(500).json({
        error: 'Authorization failed',
        message: 'An error occurred during role authorization'
      });
    }
  };
};

// Admin only middleware
export const requireAdmin = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: 'Access denied',
        message: 'Authentication required'
      });
    }

    const adminRoles = ['super_admin', 'admin'];
    
    if (adminRoles.includes(req.user.role)) {
      next();
    } else {
      res.status(403).json({
        error: 'Access denied',
        message: 'Admin access required'
      });
    }
  } catch (error) {
    console.error('Admin check error:', error);
    res.status(500).json({
      error: 'Authorization failed',
      message: 'An error occurred during admin authorization'
    });
  }
};

// Super admin only middleware
export const requireSuperAdmin = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: 'Access denied',
        message: 'Authentication required'
      });
    }

    if (req.user.role === 'super_admin') {
      next();
    } else {
      res.status(403).json({
        error: 'Access denied',
        message: 'Super admin access required'
      });
    }
  } catch (error) {
    console.error('Super admin check error:', error);
    res.status(500).json({
      error: 'Authorization failed',
      message: 'An error occurred during super admin authorization'
    });
  }
};
