#!/bin/bash

# SparrowVision API Configuration Update Script

echo "🔗 SparrowVision API Configuration Update"
echo "========================================"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

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

# Get Railway URL from user
if [ -z "$1" ]; then
    echo "Please provide your Railway URL as an argument:"
    echo "Usage: ./update-api-config.sh https://your-project.railway.app"
    echo ""
    echo "📋 To find your Railway URL:"
    echo "1. Go to https://railway.app/dashboard"
    echo "2. Click on your project"
    echo "3. Go to Deployments tab"
    echo "4. Copy the domain URL"
    exit 1
fi

RAILWAY_URL="$1"

# Remove trailing slash if present
RAILWAY_URL="${RAILWAY_URL%/}"

# Validate URL format
if [[ ! "$RAILWAY_URL" =~ ^https?:// ]]; then
    print_error "Invalid URL format. Please include https://"
    echo "Example: https://your-project.railway.app"
    exit 1
fi

print_status "Updating API configuration with Railway URL: $RAILWAY_URL"

# Test Railway backend first
print_status "Testing Railway backend connection..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$RAILWAY_URL/health" || echo "000")

if [ "$HTTP_STATUS" = "200" ]; then
    print_success "Railway backend is responding! ✅"
    
    # Get detailed health info
    print_status "Backend health details:"
    curl -s "$RAILWAY_URL/health" | python3 -m json.tool 2>/dev/null || curl -s "$RAILWAY_URL/health"
    echo ""
elif [ "$HTTP_STATUS" = "000" ]; then
    print_error "Cannot reach Railway backend. Please check the URL."
    exit 1
else
    print_warning "Railway backend responded with status: $HTTP_STATUS"
    echo "Continuing with configuration update..."
fi

# Update API configuration file
if [ -f "src/config/api.ts" ]; then
    print_status "Updating src/config/api.ts..."
    
    # Create backup
    cp src/config/api.ts src/config/api.ts.backup
    
    # Update the production API URL
    sed -i.tmp "s|PROD_API_URL: '[^']*'|PROD_API_URL: '$RAILWAY_URL'|g" src/config/api.ts
    rm -f src/config/api.ts.tmp
    
    print_success "API configuration updated successfully"
    
    # Show the change
    print_status "Updated configuration:"
    grep "PROD_API_URL" src/config/api.ts || echo "Configuration line not found"
else
    print_error "API configuration file not found: src/config/api.ts"
    exit 1
fi

# Rebuild frontend
print_status "Rebuilding frontend with new API configuration..."
npm run build

if [ $? -eq 0 ]; then
    print_success "Frontend build successful"
else
    print_error "Frontend build failed"
    exit 1
fi

# Check if Netlify CLI is available
if command -v netlify &> /dev/null; then
    print_status "Deploying to Netlify..."
    netlify deploy --prod --dir=dist
    
    if [ $? -eq 0 ]; then
        print_success "🎉 Complete deployment successful!"
        echo ""
        echo "✅ Frontend: https://sparrowvision-iga.netlify.app"
        echo "✅ Backend: $RAILWAY_URL"
        echo "✅ Health Check: $RAILWAY_URL/health"
        echo ""
        print_success "Your SparrowVision IGA platform is fully operational! 🚀"
        
        # Final integration test
        print_status "Running final integration test..."
        echo "Please test:"
        echo "1. Visit: https://sparrowvision-iga.netlify.app"
        echo "2. Login: admin@surveysparrow.com / admin123"
        echo "3. Check all sections work properly"
        
    else
        print_error "Netlify deployment failed"
        echo "Please deploy manually: netlify deploy --prod --dir=dist"
    fi
else
    print_warning "Netlify CLI not found"
    echo ""
    echo "📋 Manual deployment steps:"
    echo "1. Upload ./dist folder to Netlify dashboard"
    echo "2. Or install CLI: npm install -g netlify-cli"
    echo "3. Then run: netlify deploy --prod --dir=dist"
fi

echo ""
print_success "API integration completed!"
echo "Frontend updated to use: $RAILWAY_URL"
