# 🚂 Railway Deployment Guide

## Why Railway?
- ✅ **Simple deployment**: Just connect GitHub and deploy
- ✅ **Great logging**: Easy to debug issues
- ✅ **JSON database**: No PostgreSQL complexity
- ✅ **All-in-one**: Frontend + Backend in one service
- ✅ **Environment variables**: Easy to manage

## 🚀 Quick Deploy Steps

### 1. Create Railway Account
1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Click "New Project"

### 2. Deploy from GitHub
1. Click "Deploy from GitHub repo"
2. Select `crypto-trading-simulator` repository
3. Railway will auto-detect Node.js and deploy

### 3. Set Environment Variables
In Railway dashboard → Settings → Variables, add:

```bash
NODE_ENV=production
PORT=8080
JWT_SECRET=your-super-secure-256-character-jwt-secret-key-change-this-immediately
RAILWAY_ENVIRONMENT=true
```

### 4. Get Your URL
Railway will provide a URL like: `https://crypto-trading-simulator-production.up.railway.app`

### 5. Update Frontend API URL
Update `frontend/src/config/api.ts`:
```typescript
const BASE_URL = process.env.REACT_APP_API_URL || 
  (window.location.hostname.includes('railway.app') 
    ? `https://${window.location.hostname}/api`
    : 'http://localhost:5001/api');
```

## 📁 File Structure
```
crypto-trading-simulator/
├── railway.json          ← Railway configuration
├── .env.railway          ← Environment template  
├── package.json          ← Root build script
├── backend/
│   ├── server.js         ← Modified to serve React
│   ├── database.js       ← Uses JSON files (not PostgreSQL)
│   └── data/             ← JSON database files
└── frontend/
    └── build/            ← Built React app (served by backend)
```

## 🔧 What Changed for Railway

### 1. Single Service Architecture
- Backend serves both API (`/api/*`) and React app (`/*`)
- No separate frontend/backend deployments
- Simpler and more reliable

### 2. JSON Database
- No PostgreSQL setup required
- All data in `backend/data/*.json` files
- Works the same as local development

### 3. Environment Detection
```javascript
// Auto-detects Railway environment
if (process.env.RAILWAY_ENVIRONMENT || process.env.NODE_ENV === 'production') {
  // Serve React build files
}
```

## 🐛 Debugging on Railway

### View Logs
1. Railway Dashboard → Your Project
2. Click "Deployments" tab
3. Click latest deployment
4. See real-time logs with our debug output

### Common Issues
- **Build fails**: Check `npm run build:all` works locally
- **API 404**: Verify routes start with `/api/`
- **CORS errors**: Check `CORS_ORIGIN` environment variable

## 📊 Database Migration

Your user data will be in `backend/data/users.json`:
```json
{
  "id": "user-123",
  "email": "your-email@gmail.com", 
  "depositedAmount": 10000,
  "simulatedInterest": 341.66,
  "simulationActive": true
}
```

## ✅ Benefits Over DigitalOcean
- 🔍 **Better debugging**: Clear logs and error messages
- 🎯 **Simpler setup**: No database configuration
- 🚀 **Faster deployment**: Auto-builds on git push
- 💰 **Cost effective**: Free tier available
- 🔄 **Easy rollbacks**: Deploy history management

Ready to deploy! 🚀