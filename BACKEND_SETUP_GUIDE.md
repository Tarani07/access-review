# 🚀 Backend Setup Guide - SparrowVision IGA Platform

## Current Status
- ✅ **Frontend**: Deployed on Netlify
- ✅ **Netlify Functions**: Working (basic serverless functions)
- ❌ **Express Backend**: Not deployed/running
- ❌ **Database**: Not connected to Express backend

## Quick Setup Options

### Option 1: Deploy Express Backend to Railway (Recommended)

1. **Go to Railway.app**
   - Visit: https://railway.app
   - Sign up with GitHub

2. **Create New Project**
   - Click "Deploy from GitHub repo"
   - Select your `access-review` repository
   - Set root directory to `backend`

3. **Set Environment Variables**
   ```
   DATABASE_URL=your_neon_database_url
   JWT_SECRET=sparrowvision-super-secret-jwt-key-2024-iga-platform
   PORT=3001
   NODE_ENV=production
   FRONTEND_URL=https://sparrowvision-iga.netlify.app
   LOG_LEVEL=info
   ```

4. **Deploy**
   - Railway will automatically build and deploy
   - Get your Railway URL (e.g., `https://your-app.railway.app`)

### Option 2: Deploy to Render

1. **Go to Render.com**
   - Visit: https://render.com
   - Sign up with GitHub

2. **Create Web Service**
   - Connect your GitHub repository
   - Set root directory to `backend`
   - Build command: `npm install && npm run build`
   - Start command: `npm start`

3. **Set Environment Variables** (same as above)

### Option 3: Deploy to Heroku

1. **Install Heroku CLI**
   ```bash
   npm install -g heroku
   ```

2. **Create Heroku App**
   ```bash
   cd backend
   heroku create sparrowvision-backend
   ```

3. **Set Environment Variables**
   ```bash
   heroku config:set DATABASE_URL=your_neon_database_url
   heroku config:set JWT_SECRET=sparrowvision-super-secret-jwt-key-2024-iga-platform
   heroku config:set NODE_ENV=production
   heroku config:set FRONTEND_URL=https://sparrowvision-iga.netlify.app
   ```

4. **Deploy**
   ```bash
   git add .
   git commit -m "Deploy backend"
   git push heroku main
   ```

## Database Setup

### If you don't have a Neon database:

1. **Go to Neon.tech**
   - Visit: https://neon.tech
   - Sign up with GitHub

2. **Create Project**
   - Project name: `sparrowvision-iga`
   - Copy the connection string

3. **Update Environment Variables**
   - Use the Neon connection string as `DATABASE_URL`

## After Backend Deployment

### Update Frontend Configuration

1. **Get your backend URL** (e.g., `https://your-app.railway.app`)

2. **Update `src/config/api.ts`**
   ```typescript
   export const API_CONFIG = {
     // Change this to your backend URL
     DEV_API_URL: 'https://your-backend.railway.app',
     PROD_API_URL: 'https://your-backend.railway.app',
     // ... rest of config
   };
   ```

3. **Rebuild and redeploy frontend**
   ```bash
   npm run build
   netlify deploy --prod
   ```

## Testing the Complete Setup

1. **Test Backend Health**
   ```bash
   curl https://your-backend.railway.app/health
   ```

2. **Test JumpCloud Integration**
   - Go to your frontend
   - Login with demo credentials
   - Try JumpCloud integration

## Expected Results

- ✅ **Backend running** on Railway/Render/Heroku
- ✅ **Database connected** and schema created
- ✅ **Frontend connected** to Express backend
- ✅ **JumpCloud integration** working
- ✅ **All features** fully functional

## Troubleshooting

### Database Connection Issues
- Check your `DATABASE_URL` format
- Ensure database is accessible from your hosting platform
- Verify SSL mode is set correctly

### CORS Issues
- Make sure `FRONTEND_URL` is set correctly
- Check that your frontend URL matches exactly

### Authentication Issues
- Ensure `JWT_SECRET` is the same across all services
- Check token format and expiration

## Next Steps

1. **Choose a deployment platform** (Railway recommended)
2. **Set up the database** (Neon recommended)
3. **Deploy the backend**
4. **Update frontend configuration**
5. **Test all features**

---

**Need help?** Check the logs in your hosting platform's dashboard for specific error messages.

