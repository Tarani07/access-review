import { PrismaClient } from '@prisma/client';
import logger from './logger.js';

// Singleton Prisma Client instance
let prisma = null;

export function getPrismaClient() {
  if (!prisma) {
    prisma = new PrismaClient({
      log: [
        {
          emit: 'event',
          level: 'query',
        },
        {
          emit: 'event',
          level: 'error',
        },
        {
          emit: 'event',
          level: 'info',
        },
        {
          emit: 'event',
          level: 'warn',
        },
      ],
    });

    // Log database queries in development
    if (process.env.NODE_ENV === 'development') {
      prisma.$on('query', (e) => {
        logger.debug('Database Query', {
          duration: e.duration,
          query: e.query.slice(0, 100) + (e.query.length > 100 ? '...' : ''),
          params: e.params
        });
      });
    }

    prisma.$on('error', (e) => {
      logger.error('Database Error', e);
    });

    prisma.$on('info', (e) => {
      logger.info('Database Info', e);
    });

    prisma.$on('warn', (e) => {
      logger.warn('Database Warning', e);
    });

    // Connect to database
    prisma.$connect()
      .then(() => {
        logger.info('Database connected successfully');
      })
      .catch((error) => {
        logger.error('Failed to connect to database', error);
        process.exit(1);
      });
  }

  return prisma;
}

// Graceful disconnect
export async function disconnectDatabase() {
  if (prisma) {
    await prisma.$disconnect();
    prisma = null;
    logger.info('Database disconnected');
  }
}

// Health check
export async function checkDatabaseHealth() {
  try {
    const client = getPrismaClient();
    await client.$queryRaw`SELECT 1`;
    return { status: 'healthy', timestamp: new Date().toISOString() };
  } catch (error) {
    logger.error('Database health check failed', error);
    return { 
      status: 'unhealthy', 
      error: error.message, 
      timestamp: new Date().toISOString() 
    };
  }
}

export default getPrismaClient;
