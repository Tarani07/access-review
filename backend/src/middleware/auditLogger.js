import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger.js';

const prisma = new PrismaClient();

export const auditLogger = async (req, res, next) => {
  // Skip audit logging for health checks and static files
  if (req.path === '/health' || req.path.startsWith('/static/')) {
    return next();
  }

  const originalSend = res.send;
  
  res.send = function(data) {
    // Only log successful API calls and important actions
    if (req.path.startsWith('/api/') && res.statusCode < 400) {
      logAuditEvent(req, res).catch(err => 
        logger.error('Failed to log audit event:', err)
      );
    }
    originalSend.call(this, data);
  };

  next();
};

async function logAuditEvent(req, res) {
  try {
    const action = getActionFromRequest(req);
    const category = getCategoryFromPath(req.path);
    
    if (!action || !category) return;

    await prisma.auditLog.create({
      data: {
        action,
        category,
        userId: req.user?.id || null,
        userEmail: req.user?.email || null,
        resourceId: getResourceId(req),
        resourceType: getResourceType(req.path),
        details: {
          method: req.method,
          path: req.path,
          query: req.query,
          statusCode: res.statusCode
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      }
    });
  } catch (error) {
    logger.error('Audit logging failed:', error);
  }
}

function getActionFromRequest(req) {
  const path = req.path;
  const method = req.method;

  if (path.includes('/auth/login')) return 'LOGIN';
  if (path.includes('/auth/logout')) return 'LOGOUT';
  if (path.includes('/tools') && method === 'POST') return 'TOOL_CREATED';
  if (path.includes('/tools') && path.includes('/sync')) return 'TOOL_SYNCED';
  if (path.includes('/reviews') && method === 'POST') return 'REVIEW_STARTED';
  if (path.includes('/reviews') && path.includes('/complete')) return 'REVIEW_COMPLETED';
  if (path.includes('/admin/invite')) return 'USER_INVITED';
  if (path.includes('/reports')) return 'REPORT_GENERATED';

  return null;
}

function getCategoryFromPath(path) {
  if (path.includes('/auth/')) return 'AUTH';
  if (path.includes('/tools/') || path.includes('/sync')) return 'SYNC';
  if (path.includes('/reviews/')) return 'REVIEW';
  if (path.includes('/admin/')) return 'ADMIN';
  if (path.includes('/reports/')) return 'SYSTEM';
  return 'SYSTEM';
}

function getResourceId(req) {
  const pathParts = req.path.split('/');
  const idIndex = pathParts.findIndex(part => part.match(/^[a-zA-Z0-9_-]{10,}$/));
  return idIndex !== -1 ? pathParts[idIndex] : null;
}

function getResourceType(path) {
  if (path.includes('/tools/')) return 'Tool';
  if (path.includes('/reviews/')) return 'Review';
  if (path.includes('/users/')) return 'User';
  if (path.includes('/admin/')) return 'Admin';
  return null;
}
