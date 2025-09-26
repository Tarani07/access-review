import { PrismaClient } from '@prisma/client';
import logger from './logger.js';

// Railway deployment health check utility
const prisma = new PrismaClient();

export async function checkRailwayConnection() {
  const healthCheck = {
    timestamp: new Date().toISOString(),
    service: 'SparrowVision Backend',
    version: '2.0.0',
    environment: process.env.NODE_ENV || 'development',
    railway: {
      connected: false,
      deployment: process.env.RAILWAY_DEPLOYMENT_ID || 'local',
      environment: process.env.RAILWAY_ENVIRONMENT || 'development',
      service: process.env.RAILWAY_SERVICE_NAME || 'sparrowvision-backend'
    },
    database: {
      connected: false,
      url: process.env.DATABASE_URL ? 'configured' : 'not configured',
      type: 'postgresql'
    },
    apis: {
      frontend: process.env.FRONTEND_URL || 'http://localhost:5173',
      backend: process.env.BACKEND_URL || 'http://localhost:3001'
    },
    features: {
      authentication: true,
      userManagement: true,
      toolIntegration: true,
      accessReviews: true,
      reports: true,
      auditLogs: true,
      slackIntegration: true,
      jumpcloudSync: true
    },
    status: 'checking'
  };

  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    healthCheck.database.connected = true;
    logger.info('✅ Database connection successful');

    // Check if running on Railway
    if (process.env.RAILWAY_DEPLOYMENT_ID) {
      healthCheck.railway.connected = true;
      logger.info('✅ Running on Railway platform');
    } else {
      logger.info('ℹ️  Running in local environment');
    }

    // Test basic database operations
    const userCount = await prisma.user.count();
    const toolCount = await prisma.tool.count();
    const reviewCount = await prisma.accessReview.count();

    healthCheck.stats = {
      users: userCount,
      tools: toolCount,
      reviews: reviewCount
    };

    // Check environment variables
    const requiredEnvVars = [
      'DATABASE_URL',
      'JWT_SECRET',
      'FRONTEND_URL'
    ];

    const optionalEnvVars = [
      'SMTP_HOST',
      'SMTP_USER',
      'SMTP_PASS',
      'RAILWAY_DEPLOYMENT_ID',
      'IT_SECURITY_EMAILS',
      'HR_TEAM_EMAILS'
    ];

    healthCheck.env = {
      required: {},
      optional: {}
    };

    requiredEnvVars.forEach(envVar => {
      healthCheck.env.required[envVar] = !!process.env[envVar];
    });

    optionalEnvVars.forEach(envVar => {
      healthCheck.env.optional[envVar] = !!process.env[envVar];
    });

    // Overall status
    const allRequiredEnvConfigured = Object.values(healthCheck.env.required).every(v => v);
    healthCheck.status = healthCheck.database.connected && allRequiredEnvConfigured ? 'healthy' : 'warning';

    logger.info('🎯 Railway health check completed', {
      status: healthCheck.status,
      database: healthCheck.database.connected,
      users: healthCheck.stats.users,
      tools: healthCheck.stats.tools
    });

    return healthCheck;
  } catch (error) {
    healthCheck.status = 'error';
    healthCheck.error = error.message;
    
    logger.error('❌ Railway health check failed:', error);
    
    return healthCheck;
  } finally {
    await prisma.$disconnect();
  }
}

// Test all API endpoints
export async function testApiEndpoints() {
  const baseUrl = process.env.BACKEND_URL || 'http://localhost:3001';
  const endpoints = [
    { path: '/health', method: 'GET', auth: false },
    { path: '/api/dashboard/stats', method: 'GET', auth: false },
    { path: '/api/tools', method: 'GET', auth: false },
    { path: '/api/users', method: 'GET', auth: false },
    { path: '/api/reviews', method: 'GET', auth: false },
    { path: '/api/reports', method: 'GET', auth: false },
    { path: '/api/logs', method: 'GET', auth: false },
    { path: '/api/admin/stats', method: 'GET', auth: false }
  ];

  const results = [];

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${baseUrl}${endpoint.path}`, {
        method: endpoint.method,
        headers: {
          'Content-Type': 'application/json',
          ...(endpoint.auth && { 'Authorization': 'Bearer test-token' })
        }
      });

      results.push({
        endpoint: endpoint.path,
        method: endpoint.method,
        status: response.status,
        ok: response.ok,
        responseTime: response.headers.get('X-Response-Time') || 'N/A'
      });

      logger.info(`✅ ${endpoint.method} ${endpoint.path}: ${response.status}`);
    } catch (error) {
      results.push({
        endpoint: endpoint.path,
        method: endpoint.method,
        status: 'error',
        ok: false,
        error: error.message
      });

      logger.error(`❌ ${endpoint.method} ${endpoint.path}: ${error.message}`);
    }
  }

  return results;
}

// Database integrity check
export async function checkDatabaseIntegrity() {
  try {
    const checks = {
      timestamp: new Date().toISOString(),
      tables: {},
      indexes: {},
      constraints: {},
      status: 'checking'
    };

    // Check table counts
    const tables = [
      'users',
      'tools',
      'user_access',
      'access_reviews',
      'access_review_entries',
      'reports',
      'certifications',
      'logs',
      'audit_logs',
      'slack_settings',
      'invites',
      'sync_history'
    ];

    for (const table of tables) {
      try {
        const count = await prisma.$queryRawUnsafe(`SELECT COUNT(*) as count FROM ${table}`);
        checks.tables[table] = parseInt(count[0].count);
      } catch (error) {
        checks.tables[table] = `ERROR: ${error.message}`;
      }
    }

    // Check foreign key constraints
    const constraintChecks = [
      'SELECT COUNT(*) as count FROM user_access ua LEFT JOIN users u ON ua.user_id = u.id WHERE u.id IS NULL',
      'SELECT COUNT(*) as count FROM user_access ua LEFT JOIN tools t ON ua.tool_id = t.id WHERE t.id IS NULL',
      'SELECT COUNT(*) as count FROM access_review_entries are LEFT JOIN access_reviews ar ON are.review_id = ar.id WHERE ar.id IS NULL'
    ];

    checks.constraints.orphanedUserAccess = 0;
    checks.constraints.orphanedToolAccess = 0;
    checks.constraints.orphanedReviewEntries = 0;

    try {
      const [userAccessCheck, toolAccessCheck, reviewEntriesCheck] = await Promise.all(
        constraintChecks.map(query => prisma.$queryRawUnsafe(query))
      );

      checks.constraints.orphanedUserAccess = parseInt(userAccessCheck[0].count);
      checks.constraints.orphanedToolAccess = parseInt(toolAccessCheck[0].count);
      checks.constraints.orphanedReviewEntries = parseInt(reviewEntriesCheck[0].count);
    } catch (error) {
      checks.constraints.error = error.message;
    }

    // Overall status
    const hasOrphanedData = checks.constraints.orphanedUserAccess > 0 || 
                           checks.constraints.orphanedToolAccess > 0 || 
                           checks.constraints.orphanedReviewEntries > 0;
    
    checks.status = hasOrphanedData ? 'warning' : 'healthy';

    logger.info('🔍 Database integrity check completed', {
      status: checks.status,
      tables: Object.keys(checks.tables).length,
      orphanedRecords: hasOrphanedData
    });

    return checks;
  } catch (error) {
    logger.error('❌ Database integrity check failed:', error);
    return {
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

// Performance check
export async function checkPerformance() {
  const performanceCheck = {
    timestamp: new Date().toISOString(),
    queries: {},
    status: 'testing'
  };

  try {
    // Test query performance
    const queries = [
      { name: 'userCount', query: () => prisma.user.count() },
      { name: 'toolCount', query: () => prisma.tool.count() },
      { name: 'activeReviews', query: () => prisma.accessReview.count({ where: { status: 'IN_PROGRESS' } }) },
      { name: 'recentLogs', query: () => prisma.log.count({ 
        where: { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } } 
      }) },
      { name: 'exitUsersWithAccess', query: () => prisma.user.count({
        where: {
          status: 'EXIT',
          userAccess: { some: { status: 'ACTIVE' } }
        }
      }) }
    ];

    for (const { name, query } of queries) {
      const startTime = Date.now();
      const result = await query();
      const duration = Date.now() - startTime;

      performanceCheck.queries[name] = {
        result,
        duration,
        status: duration < 1000 ? 'fast' : duration < 5000 ? 'acceptable' : 'slow'
      };
    }

    // Overall performance status
    const slowQueries = Object.values(performanceCheck.queries).filter(q => q.status === 'slow').length;
    performanceCheck.status = slowQueries === 0 ? 'optimal' : slowQueries <= 2 ? 'acceptable' : 'needs_optimization';

    logger.info('⚡ Performance check completed', {
      status: performanceCheck.status,
      slowQueries,
      avgDuration: Object.values(performanceCheck.queries).reduce((sum, q) => sum + q.duration, 0) / queries.length
    });

    return performanceCheck;
  } catch (error) {
    logger.error('❌ Performance check failed:', error);
    return {
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

export default {
  checkRailwayConnection,
  testApiEndpoints,
  checkDatabaseIntegrity,
  checkPerformance
};
