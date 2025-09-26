import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import logger from '../utils/logger.js';
import { getPrismaClient } from '../utils/database.js';

const router = express.Router();
const prisma = getPrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password, rememberMe = false } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!user || user.status !== 'ACTIVE') {
      // Log failed login attempt
      await prisma.log.create({
        data: {
          action: 'USER_LOGIN_FAILED',
          entityType: 'USER',
          userId: 'anonymous',
          details: JSON.stringify({
            email,
            reason: user ? 'Account inactive' : 'User not found'
          }),
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
          severity: 'WARNING'
        }
      });

      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);

    if (!isValidPassword) {
      // Log failed login attempt
      await prisma.log.create({
        data: {
          action: 'USER_LOGIN_FAILED',
          entityType: 'USER',
          entityId: user.id,
          userId: user.id,
          details: JSON.stringify({
            email,
            reason: 'Invalid password'
          }),
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
          severity: 'WARNING'
        }
      });

      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    // Generate JWT token
    const tokenExpiry = rememberMe ? '30d' : JWT_EXPIRES_IN;
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: tokenExpiry }
    );

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { 
        lastLogin: new Date(),
        loginCount: { increment: 1 }
      }
    });

    // Log successful login
    await prisma.log.create({
      data: {
        action: 'USER_LOGIN',
        entityType: 'USER',
        entityId: user.id,
        userId: user.id,
        details: JSON.stringify({
          email,
          rememberMe,
          tokenExpiry
        }),
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        severity: 'INFO'
      }
    });

    logger.info(`User logged in: ${email}`);

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          lastLogin: user.lastLogin
        },
        expiresIn: tokenExpiry
      },
      message: 'Login successful'
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during login'
    });
  }
});

// Logout
router.post('/logout', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        
        // Log logout
        await prisma.log.create({
          data: {
            action: 'USER_LOGOUT',
            entityType: 'USER',
            entityId: decoded.id,
            userId: decoded.id,
            details: JSON.stringify({
              email: decoded.email
            }),
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
            severity: 'INFO'
          }
        });

        logger.info(`User logged out: ${decoded.email}`);
      } catch (jwtError) {
        // Invalid token, but still return success
      }
    }

    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during logout'
    });
  }
});

// Verify token
router.get('/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No token provided'
      });
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      
      // Check if user still exists and is active
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          status: true,
          lastLogin: true
        }
      });

      if (!user || user.status !== 'ACTIVE') {
        return res.status(401).json({
          success: false,
          error: 'User account is inactive or not found'
        });
      }

      res.json({
        success: true,
        data: {
          user,
          tokenValid: true
        }
      });
    } catch (jwtError) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token'
      });
    }
  } catch (error) {
    logger.error('Token verification error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during token verification'
    });
  }
});

// Refresh token
router.post('/refresh', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No token provided'
      });
    }

    try {
      // Verify current token (even if expired)
      const decoded = jwt.verify(token, JWT_SECRET, { ignoreExpiration: true });
      
      // Check if user still exists and is active
      const user = await prisma.user.findUnique({
        where: { id: decoded.id }
      });

      if (!user || user.status !== 'ACTIVE') {
        return res.status(401).json({
          success: false,
          error: 'User account is inactive or not found'
        });
      }

      // Generate new token
      const newToken = jwt.sign(
        {
          id: user.id,
          email: user.email,
          role: user.role
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      // Log token refresh
      await prisma.log.create({
        data: {
          action: 'TOKEN_REFRESHED',
          entityType: 'USER',
          entityId: user.id,
          userId: user.id,
          details: JSON.stringify({
            email: user.email
          }),
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
          severity: 'INFO'
        }
      });

      res.json({
        success: true,
        data: {
          token: newToken,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role
          },
          expiresIn: JWT_EXPIRES_IN
        },
        message: 'Token refreshed successfully'
      });
    } catch (jwtError) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token'
      });
    }
  } catch (error) {
    logger.error('Token refresh error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during token refresh'
    });
  }
});

// Change password
router.post('/change-password', async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Current password and new password are required'
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'New password must be at least 8 characters long'
      });
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      
      const user = await prisma.user.findUnique({
        where: { id: decoded.id }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      // Verify current password
      const isValidPassword = await bcrypt.compare(currentPassword, user.passwordHash);
      
      if (!isValidPassword) {
        return res.status(400).json({
          success: false,
          error: 'Current password is incorrect'
        });
      }

      // Hash new password
      const hashedNewPassword = await bcrypt.hash(newPassword, 12);

      // Update password
      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash: hashedNewPassword,
          passwordChangedAt: new Date()
        }
      });

      // Log password change
      await prisma.log.create({
        data: {
          action: 'PASSWORD_CHANGED',
          entityType: 'USER',
          entityId: user.id,
          userId: user.id,
          details: JSON.stringify({
            email: user.email
          }),
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
          severity: 'INFO'
        }
      });

      logger.info(`Password changed for user: ${user.email}`);

      res.json({
        success: true,
        message: 'Password changed successfully'
      });
    } catch (jwtError) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token'
      });
    }
  } catch (error) {
    logger.error('Password change error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during password change'
    });
  }
});

// Request password reset
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return res.json({
        success: true,
        message: 'If the email exists, a password reset link has been sent'
      });
    }

    // Generate reset token
    const resetToken = require('crypto').randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour

    // Store reset token (in production, store hashed version)
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry
      }
    });

    // Log password reset request
    await prisma.log.create({
      data: {
        action: 'PASSWORD_RESET_REQUESTED',
        entityType: 'USER',
        entityId: user.id,
        userId: user.id,
        details: JSON.stringify({
          email: user.email,
          resetTokenExpiry
        }),
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        severity: 'INFO'
      }
    });

    // In production, send actual email
    logger.info(`Password reset requested for: ${email}`);
    logger.info(`Reset link: ${process.env.FRONTEND_URL}/reset-password/${resetToken}`);

    res.json({
      success: true,
      message: 'If the email exists, a password reset link has been sent'
    });
  } catch (error) {
    logger.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during password reset request'
    });
  }
});

// Reset password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Reset token and new password are required'
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'New password must be at least 8 characters long'
      });
    }

    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: {
          gt: new Date()
        }
      }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired reset token'
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password and clear reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: hashedPassword,
        passwordChangedAt: new Date(),
        resetToken: null,
        resetTokenExpiry: null
      }
    });

    // Log password reset
    await prisma.log.create({
      data: {
        action: 'PASSWORD_RESET_COMPLETED',
        entityType: 'USER',
        entityId: user.id,
        userId: user.id,
        details: JSON.stringify({
          email: user.email
        }),
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        severity: 'INFO'
      }
    });

    logger.info(`Password reset completed for: ${user.email}`);

    res.json({
      success: true,
      message: 'Password has been reset successfully'
    });
  } catch (error) {
    logger.error('Password reset error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during password reset'
    });
  }
});

export default router;