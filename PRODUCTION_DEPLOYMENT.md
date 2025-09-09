# 🚀 Sparrow Vision IGA - Production Deployment Guide

## Overview
This guide will help you deploy the Sparrow Vision IGA platform to production using Neon PostgreSQL and Railway.

## Prerequisites
- GitHub account
- Neon account (neon.tech)
- Railway account (railway.app)

## Step 1: Set up Neon PostgreSQL Database

### 1.1 Create Neon Account
1. Go to [neon.tech](https://neon.tech)
2. Sign up with GitHub
3. Create a new project named "sparrow-vision-iga"

### 1.2 Get Database Connection String
1. In your Neon dashboard, go to "Connection Details"
2. Copy the connection string (looks like: `postgresql://username:password@host:port/database?sslmode=require`)
3. Save this for later use

## Step 2: Deploy Backend to Railway

### 2.1 Connect GitHub to Railway
1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your repository

### 2.2 Configure Environment Variables
In Railway dashboard, add these environment variables:

```
DATABASE_URL=your_neon_connection_string_here
JWT_SECRET=your_super_secure_jwt_secret_here
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://your-frontend-url.netlify.app
```

### 2.3 Deploy
1. Railway will automatically detect the Node.js app
2. It will run `npm install` and `npm start`
3. Your backend will be available at `https://your-app.railway.app`

## Step 3: Update Frontend Configuration

### 3.1 Update API Endpoints
In your frontend, update the API base URL to point to your Railway backend:

```typescript
const API_BASE_URL = 'https://your-backend.railway.app/api';
```

### 3.2 Update CORS Settings
Make sure your Railway backend has the correct FRONTEND_URL in environment variables.

## Step 4: Test Production Setup

### 4.1 Test Backend Health
```bash
curl https://your-backend.railway.app/health
```

### 4.2 Test API Endpoints
```bash
# Test login
curl -X POST https://your-backend.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@sparrowvision.com","password":"admin123"}'

# Test dashboard stats
curl https://your-backend.railway.app/api/dashboard/stats
```

## Step 5: Database Schema Setup

The backend will automatically create the required tables when it starts. You can verify by:

1. Going to your Neon dashboard
2. Opening the SQL Editor
3. Running: `SELECT * FROM users;`

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | Neon PostgreSQL connection string | `postgresql://user:pass@host:port/db?sslmode=require` |
| `JWT_SECRET` | Secret key for JWT tokens | `your-super-secure-secret` |
| `NODE_ENV` | Environment mode | `production` |
| `PORT` | Server port | `3001` |
| `FRONTEND_URL` | Frontend URL for CORS | `https://your-app.netlify.app` |

## Security Checklist

- ✅ Strong JWT secret (32+ characters)
- ✅ HTTPS enabled
- ✅ CORS configured
- ✅ Rate limiting enabled
- ✅ Input validation
- ✅ SQL injection prevention
- ✅ Password hashing

## Monitoring

### Railway Dashboard
- View logs in Railway dashboard
- Monitor resource usage
- Set up alerts

### Neon Dashboard
- Monitor database performance
- View query metrics
- Set up backups

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check DATABASE_URL format
   - Verify Neon database is running
   - Check SSL settings

2. **CORS Errors**
   - Verify FRONTEND_URL is correct
   - Check CORS configuration

3. **JWT Errors**
   - Verify JWT_SECRET is set
   - Check token expiration

### Logs
View logs in Railway dashboard or run:
```bash
railway logs
```

## Next Steps

1. Set up monitoring and alerts
2. Configure automated backups
3. Set up CI/CD pipeline
4. Add performance monitoring
5. Implement logging aggregation

## Support

For issues:
1. Check Railway logs
2. Check Neon database status
3. Verify environment variables
4. Test API endpoints individually

---

**Your Sparrow Vision IGA platform is now production-ready! 🎉**
