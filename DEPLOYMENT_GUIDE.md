# 🚀 SparrowVision Complete Production Deployment Guide

## Step 1: Database Setup on Neon.tech

### 1.1 Create Neon Account & Database
1. **Go to:** https://neon.tech
2. **Sign up** with GitHub (recommended for easy integration)
3. **Create new project:**
   - Project name: `sparrowvision-iga`
   - Database name: `sparrowvision`
   - Region: Choose closest to your users (US East recommended)
4. **Copy connection string** (format: `postgresql://username:password@host/database?sslmode=require`)

### 1.2 Database Configuration
Once you have the connection string, we'll set up the schema automatically via Railway deployment.

---

## Step 2: Backend Deployment to Railway.app

### 2.1 Railway Setup
1. **Go to:** https://railway.app
2. **Sign up** with GitHub
3. **Create new project:** "Deploy from GitHub repo"
4. **Select repository:** `access-review` (your repo)
5. **Configure deployment:**
   - **Root directory:** `backend`
   - **Build command:** `npm install && npx prisma generate`
   - **Start command:** `node src/server.js`

### 2.2 Environment Variables
Add these variables in Railway dashboard:

```bash
DATABASE_URL=your_neon_connection_string_here
JWT_SECRET=your_super_secure_jwt_secret_key_2024
JWT_EXPIRES_IN=24h
NODE_ENV=production
FRONTEND_URL=https://sparrowvision-iga.netlify.app
BACKEND_URL=https://your-project-name.railway.app

# Email Configuration (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Team Notifications
IT_SECURITY_EMAILS=security@company.com
HR_TEAM_EMAILS=hr@company.com
ENGINEERING_EMAILS=engineering@company.com

# Performance
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
BCRYPT_ROUNDS=12
```

### 2.3 Database Migration
Railway will automatically run:
1. `npm install` - Install dependencies
2. `npx prisma generate` - Generate Prisma client
3. `npx prisma db push` - Create database schema
4. `node src/server.js` - Start server

---

## Step 3: API Integration & Final Configuration

### 3.1 Update Frontend API Configuration
After Railway deployment, update the API endpoint in your frontend.

### 3.2 Test Endpoints
Railway will provide a URL like: `https://sparrowvision-backend-production.railway.app`

**Health Check:** `GET /health`
**Expected Response:**
```json
{
  "status": "OK",
  "database": { "status": "healthy" },
  "version": "2.0.0",
  "service": "SparrowVision Backend"
}
```

---

## Step 4: Verification & Testing

### 4.1 Backend Health Check
```bash
curl https://your-backend.railway.app/health
```

### 4.2 Frontend Access
- **URL:** https://sparrowvision-iga.netlify.app
- **Test Login:** admin@surveysparrow.com / admin123

### 4.3 Full Integration Test
1. **Dashboard:** Should load with metrics
2. **App Center:** 150+ tools displayed
3. **Users:** JumpCloud integration UI
4. **Access Review:** Custom exit employee options
5. **Rep-Doc:** Team notification features

---

## 🎯 Expected Timeline

- **Neon Setup:** 2-3 minutes
- **Railway Deployment:** 5-7 minutes
- **API Configuration:** 1-2 minutes
- **Testing:** 2-3 minutes

**Total:** ~15 minutes to full production! 🚀

---

## 🆘 Troubleshooting

### Common Issues:
1. **Database Connection:** Ensure Neon connection string is correct
2. **CORS Errors:** Verify FRONTEND_URL matches your Netlify URL
3. **Build Failures:** Check Node.js version (should be 18+)
4. **Schema Issues:** Railway logs will show Prisma migration status

### Support Resources:
- **Railway Logs:** https://railway.app/project/your-project/logs
- **Neon Dashboard:** https://console.neon.tech
- **Netlify Deploy Logs:** https://app.netlify.com/sites/sparrowvision-iga/deploys

---

## 🎉 Success Indicators

✅ **Backend Health:** `/health` returns 200 OK
✅ **Database:** Schema created successfully
✅ **Frontend:** Loads without errors
✅ **Authentication:** Login works
✅ **Features:** All sections functional

When all indicators are green, your **SparrowVision IGA platform is fully live!** 🌟
