#!/bin/bash

# 🧪 Local Development Setup Script
# This script sets up your local development environment

echo "🚀 Setting up local development environment..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js first."
    exit 1
fi

echo "✅ Node.js found: $(node --version)"

# Setup Backend
echo "🔧 Setting up backend..."
cd backend

# Create .env file for backend
cat > .env << EOL
# Local Development Environment
NODE_ENV=development
PORT=5001
JWT_SECRET=local-development-jwt-secret-not-for-production
FRONTEND_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:3000
DEV_MODE=true
INTEREST_INTERVAL_MINUTES=5

# Database (commented out for local JSON file usage)
# DATABASE_URL=postgresql://username:password@localhost:5432/cryptosim_dev
# POSTGRES_URL=postgresql://username:password@localhost:5432/cryptosim_dev
EOL

echo "✅ Backend .env file created"

# Install backend dependencies
if [ ! -d "node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    npm install
else
    echo "✅ Backend dependencies already installed"
fi

# Setup Frontend
echo "🔧 Setting up frontend..."
cd ../frontend

# Create .env file for frontend
cat > .env << EOL
# Local Development Frontend Environment
REACT_APP_API_URL=http://localhost:5001/api
EOL

echo "✅ Frontend .env file created"

# Install frontend dependencies
if [ ! -d "node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    npm install
else
    echo "✅ Frontend dependencies already installed"
fi

cd ..

echo ""
echo "🎉 Local development environment setup complete!"
echo ""
echo "📋 To start development:"
echo ""
echo "Terminal 1 (Backend):"
echo "  cd backend"
echo "  npm run dev"
echo ""
echo "Terminal 2 (Frontend):"
echo "  cd frontend"
echo "  npm start"
echo ""
echo "🌐 Your app will be available at:"
echo "  Frontend: http://localhost:3000"
echo "  Backend:  http://localhost:5001"
echo ""
echo "📚 For more details, see LOCAL_DEVELOPMENT_GUIDE.md"