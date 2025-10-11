# SparrowVision Netlify Deployment Guide

## Overview

This guide covers the complete deployment of SparrowVision IGA Platform on Netlify using serverless functions. The application has been fully migrated from Railway to Netlify for improved performance, scalability, and cost-effectiveness.

## Architecture

- **Frontend**: React + TypeScript (Vite) deployed to Netlify CDN
- **Backend**: Serverless functions using Netlify Functions
- **Database**: PostgreSQL (Neon, Supabase, or any PostgreSQL provider)
- **Deployment**: Continuous deployment from GitHub

## Prerequisites

- GitHub repository with your code
- Netlify account (free tier available)
- PostgreSQL database (Neon recommended for serverless)
- Domain name (optional)

## Step 1: Database Setup

### Option A: Neon PostgreSQL (Recommended)

1. Go to [neon.tech](https://neon.tech) and create an account
2. Create a new project: "SparrowVision IGA"
3. Copy the connection string from the dashboard
4. The format will be: `postgresql://username:password@hostname:5432/database?sslmode=require`

### Option B: Supabase PostgreSQL

1. Go to [supabase.com](https://supabase.com) and create a project
2. Navigate to Settings → Database
3. Copy the connection string under "Connection string"

## Step 2: Netlify Deployment

### 2.1 Connect GitHub Repository

1. Go to [netlify.com](https://netlify.com) and sign in
2. Click "New site from Git"
3. Choose GitHub and authorize Netlify
4. Select your repository
5. Configure build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
   - **Functions directory**: `netlify/functions`

### 2.2 Environment Variables

In Netlify dashboard, go to Site settings → Environment variables and add:

#### Required Variables:
```
DATABASE_URL=your_postgresql_connection_string
JWT_SECRET=your-super-secure-jwt-secret-key-at-least-32-characters
NODE_ENV=production
```

#### Optional Variables:
```
FRONTEND_URL=https://your-site-name.netlify.app
VITE_API_URL=/.netlify/functions
LOG_LEVEL=info
JWT_EXPIRES_IN=24h
```

#### Email Configuration (Optional):
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
IT_SECURITY_EMAILS=security@yourcompany.com,admin@yourcompany.com
```

#### JumpCloud Integration (Optional):
```
JUMPCLOUD_API_KEY=your-jumpcloud-api-key
JUMPCLOUD_ORG_ID=your-organization-id
```

### 2.3 Build & Deploy

1. Click "Deploy site"
2. Netlify will automatically:
   - Install dependencies
   - Build the frontend
   - Deploy functions
   - Set up CDN

## Step 3: Database Schema Setup

After deployment, initialize your database:

1. In your local development environment:
```bash
# Install dependencies
npm install

# Navigate to functions directory
cd netlify/functions

# Install function dependencies
npm install

# Generate Prisma client
npm run generate

# Push database schema
npm run db:push
```

2. Or use Netlify CLI:
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Link to your site
netlify link

# Run database setup
netlify dev
```

## Step 4: Create Admin User

Create your first admin user by adding this temporary function or using Prisma Studio:

```sql
INSERT INTO users (id, email, name, role, status, "passwordHash", "createdAt", "updatedAt")
VALUES (
  'admin-user-id',
  'admin@yourcompany.com',
  'Admin User',
  'ADMIN',
  'ACTIVE',
  '$2b$12$hash-of-your-password',  -- Use bcrypt to hash your password
  NOW(),
  NOW()
);
```

## Step 5: Custom Domain (Optional)

1. In Netlify dashboard, go to Domain settings
2. Add custom domain
3. Follow DNS configuration instructions
4. Update `FRONTEND_URL` environment variable

## Development Workflow

### Local Development

```bash
# Install dependencies
npm install

# Start development server with Netlify Functions
npm run dev:netlify

# Or use regular Vite dev server (uses localhost:3001 for API)
npm run dev
```

### Environment Variables for Development

Create `.env.local` file:
```
VITE_USE_NETLIFY_FUNCTIONS=true
VITE_API_URL=http://localhost:8888/.netlify/functions
DATABASE_URL=your_local_or_dev_database_url
JWT_SECRET=your-dev-jwt-secret
```

### Building and Testing

```bash
# Build for production
npm run build

# Test functions locally
netlify dev

# Deploy to production
npm run deploy
```

## API Endpoints

All API endpoints are now serverless functions:

- `/.netlify/functions/health` - Health check
- `/.netlify/functions/auth` - Authentication
- `/.netlify/functions/dashboard` - Dashboard data
- `/.netlify/functions/tools` - Tool management
- `/.netlify/functions/users` - User management
- `/.netlify/functions/reviews` - Access reviews

## Monitoring & Debugging

### Netlify Dashboard

- **Functions tab**: Monitor function invocations and errors
- **Deploy log**: Check build and deployment logs
- **Site analytics**: Traffic and performance metrics

### Debugging Functions

```bash
# View function logs
netlify functions:log

# Test function locally
netlify dev
```

## Security Features

- **CORS**: Configured for your domain
- **Rate limiting**: Built into Netlify
- **Environment variables**: Encrypted at rest
- **HTTPS**: Automatic SSL certificates
- **Headers**: Security headers automatically added

## Performance Optimizations

- **CDN**: Global content delivery network
- **Function optimization**: Cold start minimization
- **Database connection pooling**: Prisma connection management
- **Asset optimization**: Automatic image and code optimization

## Backup & Recovery

### Database Backups
- Enable automated backups in your PostgreSQL provider
- Export data regularly using Prisma Studio or pg_dump

### Code Backups
- Code is backed up in GitHub
- Netlify maintains deployment history

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Check DATABASE_URL format
   - Ensure database is accessible
   - Verify SSL requirements

2. **Function Timeout**
   - Optimize database queries
   - Use connection pooling
   - Check function memory limits

3. **Build Failures**
   - Check Node.js version compatibility
   - Verify all dependencies are listed
   - Review build logs in Netlify

### Getting Help

- Netlify Community: [community.netlify.com](https://community.netlify.com)
- Documentation: [docs.netlify.com](https://docs.netlify.com)
- Support: [support.netlify.com](https://support.netlify.com)

## Migration Checklist

- [x] Remove Railway dependencies
- [x] Convert Express routes to Netlify Functions
- [x] Update frontend API configuration
- [x] Create netlify.toml configuration
- [x] Set up database connections for serverless
- [x] Configure environment variables
- [x] Create deployment documentation
- [ ] Test all functionality
- [ ] Update DNS records (if using custom domain)
- [ ] Monitor performance and fix issues

## Cost Comparison

**Netlify Advantages:**
- Free tier: 125,000 function requests/month
- Automatic scaling
- Global CDN included
- No server maintenance
- Pay-per-use pricing

**Performance Benefits:**
- Faster cold starts
- Global edge deployment
- Automatic optimization
- Built-in monitoring

## Next Steps

1. Deploy to Netlify following this guide
2. Test all functionality thoroughly
3. Set up monitoring and alerts
4. Configure custom domain if needed
5. Train team on new deployment process
6. Archive old Railway deployment

---

**Note**: This migration provides better scalability, performance, and cost-effectiveness compared to the previous Railway deployment.
