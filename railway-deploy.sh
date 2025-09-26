#!/bin/bash

# SparrowVision Railway Deployment Helper Script

echo "🚀 SparrowVision Railway Deployment Helper"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Step 1: Check Railway CLI
print_status "Checking Railway CLI installation..."
if ! command -v railway &> /dev/null; then
    print_warning "Railway CLI not found. Installing..."
    npm install -g @railway/cli
    if [ $? -eq 0 ]; then
        print_success "Railway CLI installed successfully"
    else
        print_error "Failed to install Railway CLI"
        echo "Please install manually: npm install -g @railway/cli"
        exit 1
    fi
else
    print_success "Railway CLI found"
fi

# Step 2: Login to Railway
print_status "Logging into Railway..."
railway login

if [ $? -eq 0 ]; then
    print_success "Successfully logged into Railway"
else
    print_error "Failed to login to Railway"
    exit 1
fi

# Step 3: Initialize Railway Project
print_status "Initializing Railway project..."
cd backend
railway init

# Step 4: Set up environment variables
print_warning "IMPORTANT: You need to set up environment variables in Railway dashboard"
echo ""
echo "🔧 Required Environment Variables:"
echo "================================="
echo "DATABASE_URL=your_neon_connection_string"
echo "JWT_SECRET=your_super_secure_jwt_secret_key_2024"
echo "JWT_EXPIRES_IN=24h"
echo "NODE_ENV=production"
echo "FRONTEND_URL=https://sparrowvision-iga.netlify.app"
echo "PORT=3001"
echo ""
echo "📧 Optional Email Variables:"
echo "SMTP_HOST=smtp.gmail.com"
echo "SMTP_PORT=587"
echo "SMTP_USER=your-email@gmail.com"
echo "SMTP_PASS=your-app-password"
echo ""
echo "👥 Optional Team Email Variables:"
echo "IT_SECURITY_EMAILS=security@company.com"
echo "HR_TEAM_EMAILS=hr@company.com"
echo "ENGINEERING_EMAILS=engineering@company.com"
echo ""

# Step 5: Deploy to Railway
echo "Press Enter to continue with deployment (after setting up environment variables)..."
read -r

print_status "Deploying to Railway..."
railway up

if [ $? -eq 0 ]; then
    print_success "🎉 Backend deployed successfully to Railway!"
    echo ""
    print_status "Getting your Railway URL..."
    RAILWAY_URL=$(railway status --json | grep -o '"url":"[^"]*' | cut -d'"' -f4)
    
    if [ -n "$RAILWAY_URL" ]; then
        print_success "🌐 Your backend is live at: $RAILWAY_URL"
        echo ""
        print_status "Next steps:"
        echo "1. Update frontend API configuration with your Railway URL"
        echo "2. Test the health endpoint: curl $RAILWAY_URL/health"
        echo "3. Redeploy frontend to Netlify"
        echo ""
        
        # Update API config automatically
        cd ..
        print_status "Updating frontend API configuration..."
        if [ -f "src/config/api.ts" ]; then
            sed -i.bak "s|https://sparrowvision-backend-production.railway.app|$RAILWAY_URL|g" src/config/api.ts
            print_success "API configuration updated with your Railway URL"
            
            print_status "Rebuilding and redeploying frontend..."
            npm run build
            netlify deploy --prod --dir=dist
            
            if [ $? -eq 0 ]; then
                print_success "🎉 Complete deployment finished!"
                echo ""
                echo "✅ Frontend: https://sparrowvision-iga.netlify.app"
                echo "✅ Backend: $RAILWAY_URL"
                echo "✅ Health Check: $RAILWAY_URL/health"
                echo ""
                print_success "Your SparrowVision IGA platform is fully live! 🚀"
            else
                print_warning "Backend deployed, but frontend redeploy failed"
                echo "Please redeploy manually to Netlify"
            fi
        else
            print_warning "API config file not found. Please update manually."
        fi
    else
        print_warning "Could not retrieve Railway URL automatically"
        echo "Please check your Railway dashboard for the deployment URL"
    fi
else
    print_error "Deployment to Railway failed"
    echo "Please check Railway logs and try again"
    exit 1
fi

print_success "Deployment script completed!"
