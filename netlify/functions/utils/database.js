import { PrismaClient } from '@prisma/client';

// Global Prisma instance for serverless functions
let prisma = null;

export function getPrismaClient() {
  if (!prisma) {
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });
  }
  return prisma;
}

export async function disconnectDatabase() {
  if (prisma) {
    await prisma.$disconnect();
    prisma = null;
  }
}

export async function checkDatabaseHealth() {
  try {
    const prisma = getPrismaClient();
    await prisma.$queryRaw`SELECT 1`;
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      connection: 'active'
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message,
      connection: 'failed'
    };
  }
}

// Connection with retry logic for serverless
export async function connectWithRetry(maxRetries = 3) {
  let retries = 0;
  while (retries < maxRetries) {
    try {
      const prisma = getPrismaClient();
      await prisma.$connect();
      return prisma;
    } catch (error) {
      retries++;
      if (retries === maxRetries) {
        throw new Error(`Database connection failed after ${maxRetries} retries: ${error.message}`);
      }
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, retries) * 1000));
    }
  }
}
