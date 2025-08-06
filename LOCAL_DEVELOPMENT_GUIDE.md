# 🧪 Local Development & Testing Guide

This guide shows you how to run a complete test environment locally before pushing to production.

## 📋 Prerequisites

- Node.js (v16+)
- PostgreSQL (optional - can use JSON file fallback)
- Git

## 🚀 Quick Start - Local Testing

### 1. Backend Setup (Terminal 1)

```bash
# Navigate to backend
cd backend

# Install dependencies (if not already done)
npm install

# Create local environment file
cp env.example .env

# Edit .env for local development
# The file should contain:
NODE_ENV=development
PORT=5001
JWT_SECRET=your-super-secret-jwt-key-change-in-production
FRONTEND_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:3000
DEV_MODE=true
INTEREST_INTERVAL_MINUTES=5

# Start backend in development mode (with auto-reload)
npm run dev
```

**Expected Output:**
```
[nodemon] starting `node server.js`
🚀 Server running on port 5001
📊 Environment: development
💾 Database: Using JSON files (development mode)
⏰ Interest processing: Every 5 minutes
```

### 2. Frontend Setup (Terminal 2)

```bash
# Navigate to frontend
cd frontend

# Install dependencies (if not already done)
npm install

# Create local environment file  
cp env.example .env

# Edit .env for local development
# The file should contain:
REACT_APP_API_URL=http://localhost:5001/api

# Start frontend development server
npm start
```

**Expected Output:**
```
Compiled successfully!

You can now view frontend in the browser.

  Local:            http://localhost:3000
  On Your Network:  http://192.168.1.100:3000
```

### 3. Access Your Local Test Environment

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5001/api
- **Test with existing production data** (uses JSON files)

## 🔧 Environment Configuration

### Backend (.env)
```env
NODE_ENV=development
PORT=5001
JWT_SECRET=your-super-secret-jwt-key-change-in-production
FRONTEND_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:3000
DEV_MODE=true
INTEREST_INTERVAL_MINUTES=5
```

### Frontend (.env)
```env
REACT_APP_API_URL=http://localhost:5001/api
```

## 🧪 Testing Workflow

### Making Changes Safely

1. **Make code changes** in your editor
2. **Test locally** at http://localhost:3000
3. **Verify all functionality** works
4. **Commit and push** to production

### Development Features

- **Auto-reload:** Both frontend and backend restart automatically on file changes
- **JSON Database:** Uses local JSON files instead of PostgreSQL
- **CORS Enabled:** Frontend can communicate with backend
- **Hot Module Replacement:** React updates instantly without full page reload

## 📊 Local Data Storage

When running locally, your app uses JSON files in `backend/data/`:
- `users.json` - User accounts
- `transactions.json` - Transaction history  
- `pending_deposits.json` - Pending deposits
- `withdrawals.json` - Withdrawal requests
- `chat.json` - Chat messages
- `demos.json` - Demo requests

**Changes to these files persist** across restarts.

## 🚨 Troubleshooting

### Backend Won't Start
```bash
# Check if port 5001 is in use
lsof -i :5001

# Kill any process using port 5001
kill -9 <PID>
```

### Frontend Can't Connect to Backend
1. Verify backend is running on port 5001
2. Check `.env` file has correct API URL
3. Restart frontend after changing `.env`

### Database Errors
- Local development uses JSON files by default
- No PostgreSQL setup required for testing

## ⚡ Quick Commands

```bash
# Start both frontend and backend
npm run dev          # (in backend folder)
npm start           # (in frontend folder - separate terminal)

# Reset local data (be careful!)
rm backend/data/*.json

# View backend logs
tail -f backend/logs/app.log  # (if logging enabled)
```

## 🔄 Switching Between Local and Production

### Test Locally
```bash
# Backend .env
NODE_ENV=development

# Frontend .env  
REACT_APP_API_URL=http://localhost:5001/api
```

### Deploy to Production
```bash
git add .
git commit -m "Your changes"
git push origin main
```

Production automatically uses:
- Backend: DigitalOcean PostgreSQL
- Frontend: Vercel with production API URL

## 🎯 Best Practices

1. **Always test locally first** before pushing
2. **Use different test data** than production
3. **Test all user flows** (login, dashboard, transactions)
4. **Check browser console** for errors
5. **Test both admin and user interfaces**

## 🛡️ Security Notes

- Local JWT secret is for testing only
- Local database is not encrypted
- Don't commit `.env` files to git
- Use different credentials for local testing