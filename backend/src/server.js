import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import logger from './utils/logger.js';
import { getPrismaClient, disconnectDatabase, checkDatabaseHealth } from './utils/database.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import { auditLogger } from './middleware/auditLogger.js';

// Routes
import authRoutes from './routes/auth.js';
import dashboardRoutes from './routes/dashboard.js';
import toolsRoutes from './routes/tools.js';
import usersRoutes from './routes/users.js';
import reviewsRoutes from './routes/reviews.js';
import reportsRoutes from './routes/reports.js';
import adminRoutes from './routes/admin.js';
import logsRoutes from './routes/logs.js';
import slackRoutes from './routes/slack.js';

dotenv.config();

const app = express();
const prisma = getPrismaClient();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https:"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});
app.use(limiter);

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Audit logging middleware
app.use(auditLogger);

// Enhanced health check with database validation
app.get('/health', async (req, res) => {
  try {
    const dbHealth = await checkDatabaseHealth();
    const memoryUsage = process.memoryUsage();
    const uptime = process.uptime();
    
    res.json({ 
      status: dbHealth.status === 'healthy' ? 'OK' : 'DEGRADED',
      timestamp: new Date().toISOString(),
      version: '2.0.0',
      service: 'SparrowVision Backend',
      database: dbHealth,
      system: {
        uptime: Math.floor(uptime),
        memory: {
          rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
          heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
          heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`
        },
        node: process.version,
        env: process.env.NODE_ENV || 'development'
      }
    });
  } catch (error) {
    logger.error('Health check failed', error);
    res.status(503).json({
      status: 'ERROR',
      error: 'Health check failed',
      timestamp: new Date().toISOString()
    });
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/tools', toolsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/logs', logsRoutes);
app.use('/api/slack', slackRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

// Enhanced graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Received SIGINT. Shutting down gracefully...');
  try {
    await disconnectDatabase();
    logger.info('Database disconnected successfully');
  } catch (error) {
    logger.error('Error during database disconnect', error);
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM. Shutting down gracefully...');
  try {
    await disconnectDatabase();
    logger.info('Database disconnected successfully');
  } catch (error) {
    logger.error('Error during database disconnect', error);
  }
  process.exit(0);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start server
app.listen(PORT, () => {
  logger.info(`🚀 SparrowVision Backend running on port ${PORT}`);
  logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`🔗 Health check: http://localhost:${PORT}/health`);
});

export { app, prisma };