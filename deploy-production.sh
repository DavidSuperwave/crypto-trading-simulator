#!/bin/bash

# Production Deployment Script for Crypto Trading Simulator
# Usage: ./deploy-production.sh

echo "🚀 Starting Production Deployment..."
echo "======================================"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Run this script from the project root directory"
    exit 1
fi

# Check git status
echo "📋 Checking git status..."
if [ -n "$(git status --porcelain)" ]; then
    echo "⚠️  Warning: You have uncommitted changes. Continue? (y/n)"
    read -r response
    if [ "$response" != "y" ]; then
        echo "❌ Deployment cancelled"
        exit 1
    fi
fi

# Run linting check
echo "🔍 Running final linting check..."
cd frontend
npm run build > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "❌ Frontend build failed. Please fix errors before deploying."
    cd ..
    exit 1
fi
cd ..

echo "✅ Frontend build successful"

# Commit and push changes
echo "📤 Committing and pushing changes..."
git add .
git commit -m "🚀 Production deployment: $(date '+%Y-%m-%d %H:%M:%S')"
git push origin main

if [ $? -eq 0 ]; then
    echo "✅ Code pushed to repository successfully"
else
    echo "❌ Failed to push code"
    exit 1
fi

echo ""
echo "🎉 Deployment initiated successfully!"
echo "======================================"
echo ""
echo "📋 Next Steps:"
echo "1. Frontend will auto-deploy via Vercel"
echo "2. SSH to Digital Ocean and run:"
echo "   cd /var/www/crypto-trading-simulator"
echo "   git pull origin main"
echo "   cd backend && npm install --production"
echo "   pm2 restart crypto-trading-backend"
echo ""
echo "🔗 URLs to verify:"
echo "Frontend: https://crypto-trading-simulator-five.vercel.app"
echo "Backend:  https://coral-app-bh2u4.ondigitalocean.app/api/health"
echo ""
echo "📖 See PRODUCTION_DEPLOYMENT_GUIDE.md for detailed instructions"