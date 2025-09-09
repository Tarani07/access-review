#!/bin/bash

# Sparrow Vision IGA - Production Start Script

echo "🚀 Starting Sparrow Vision IGA Backend in Production Mode"
echo "=================================================="

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    echo "Please create .env file with your production environment variables:"
    echo ""
    echo "DATABASE_URL=postgresql://username:password@host:port/database?sslmode=require"
    echo "JWT_SECRET=your-super-secure-jwt-secret"
    echo "NODE_ENV=production"
    echo "PORT=3001"
    echo "FRONTEND_URL=https://your-frontend-url.netlify.app"
    echo ""
    echo "You can copy from production.env and update the values."
    exit 1
fi

# Check if DATABASE_URL is set
if ! grep -q "DATABASE_URL=" .env; then
    echo "❌ DATABASE_URL not found in .env file!"
    echo "Please add your Neon database connection string to .env file."
    exit 1
fi

# Check if JWT_SECRET is set
if ! grep -q "JWT_SECRET=" .env; then
    echo "❌ JWT_SECRET not found in .env file!"
    echo "Please add a secure JWT secret to .env file."
    exit 1
fi

echo "✅ Environment variables found"
echo "✅ Starting production server..."

# Start the server
node src/server.js
