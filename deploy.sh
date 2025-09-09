#!/bin/bash

# Sparrow Vision IGA - Complete Deployment Script

echo "🚀 Sparrow Vision IGA - Production Deployment"
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
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

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "backend" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

print_status "Starting deployment process..."

# Step 1: Build frontend
print_status "Building frontend..."
npm run build
if [ $? -eq 0 ]; then
    print_success "Frontend built successfully"
else
    print_error "Frontend build failed"
    exit 1
fi

# Step 2: Commit and push changes
print_status "Committing and pushing changes..."
git add -A
git commit -m "feat: add production API integration" || echo "No changes to commit"
git push

if [ $? -eq 0 ]; then
    print_success "Changes pushed to GitHub"
else
    print_error "Failed to push changes"
    exit 1
fi

# Step 3: Display next steps
echo ""
print_success "Deployment preparation complete!"
echo ""
print_status "Next steps to complete deployment:"
echo ""
echo "1. 🌐 Set up Neon Database:"
echo "   - Go to https://neon.tech"
echo "   - Create account and new project 'sparrow-vision-iga'"
echo "   - Copy the connection string"
echo ""
echo "2. 🚂 Deploy Backend to Railway:"
echo "   - Go to https://railway.app"
echo "   - Connect your GitHub repo"
echo "   - Select 'backend' folder as root"
echo "   - Add environment variables:"
echo "     DATABASE_URL=your_neon_connection_string"
echo "     JWT_SECRET=your_secure_jwt_secret"
echo "     NODE_ENV=production"
echo "     FRONTEND_URL=https://your-netlify-app.netlify.app"
echo ""
echo "3. 🔗 Update Frontend API URL:"
echo "   - Edit src/config/api.ts"
echo "   - Replace 'your-backend.railway.app' with your actual Railway URL"
echo "   - Redeploy to Netlify"
echo ""
echo "4. ✅ Test Everything:"
echo "   - Test backend: curl https://your-backend.railway.app/health"
echo "   - Test frontend: Visit your Netlify URL"
echo "   - Test login with: admin@sparrowvision.com / admin123"
echo ""
print_success "Your Sparrow Vision IGA platform will be live! 🎉"
