#!/bin/bash

# 🚀 Start Development Servers Script
# This script starts both backend and frontend development servers

echo "🚀 Starting development servers..."

# Function to cleanup background processes
cleanup() {
    echo ""
    echo "🛑 Stopping development servers..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 0
}

# Trap Ctrl+C to cleanup
trap cleanup INT

# Check if .env files exist
if [ ! -f "backend/.env" ]; then
    echo "❌ Backend .env file not found. Run ./setup-local-dev.sh first"
    exit 1
fi

if [ ! -f "frontend/.env" ]; then
    echo "❌ Frontend .env file not found. Run ./setup-local-dev.sh first"
    exit 1
fi

# Start backend server
echo "🔧 Starting backend server on port 5001..."
cd backend
npm run dev &
BACKEND_PID=$!
echo "✅ Backend server started (PID: $BACKEND_PID)"

# Wait a moment for backend to start
sleep 3

# Start frontend server
echo "🎨 Starting frontend server on port 3000..."
cd ../frontend
npm start &
FRONTEND_PID=$!
echo "✅ Frontend server started (PID: $FRONTEND_PID)"

echo ""
echo "🎉 Development servers are running!"
echo ""
echo "🌐 URLs:"
echo "  Frontend: http://localhost:3000"
echo "  Backend:  http://localhost:5001"
echo ""
echo "📊 Logs:"
echo "  Backend logs will appear above"
echo "  Frontend will open in your browser"
echo ""
echo "⏹️  Press Ctrl+C to stop both servers"

# Wait for background processes
wait $BACKEND_PID $FRONTEND_PID