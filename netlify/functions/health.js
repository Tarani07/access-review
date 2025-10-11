import { getPrismaClient, checkDatabaseHealth } from './utils/database.js';
import logger from './utils/logger.js';

export async function handler(event, context) {
  // Set connection reuse
  context.callbackWaitsForEmptyEventLoop = false;

  const headers = {
    'Access-Control-Allow-Origin': process.env.FRONTEND_URL || '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const dbHealth = await checkDatabaseHealth();
    const memoryUsage = process.memoryUsage();
    
    const healthData = { 
      status: dbHealth.status === 'healthy' ? 'OK' : 'DEGRADED',
      timestamp: new Date().toISOString(),
      version: '2.0.0',
      service: 'SparrowVision Backend (Netlify Functions)',
      database: dbHealth,
      system: {
        memory: {
          rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
          heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
          heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`
        },
        node: process.version,
        env: process.env.NODE_ENV || 'production',
        platform: 'Netlify Functions'
      }
    };

    logger.info('Health check completed', healthData);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(healthData)
    };
  } catch (error) {
    logger.error('Health check failed', { error: error.message });
    
    return {
      statusCode: 503,
      headers,
      body: JSON.stringify({
        status: 'ERROR',
        error: 'Health check failed',
        timestamp: new Date().toISOString(),
        platform: 'Netlify Functions'
      })
    };
  }
}
