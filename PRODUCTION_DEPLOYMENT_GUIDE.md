# Production Deployment Guide

## 🚀 Recent Updates (Latest Features)

### New Features Added Since Last Deployment:
- ✅ **Advanced Deposit System**: Tiered plans ($2500, $5000, $10000) with persuasive UI
- ✅ **Enhanced Withdrawal System**: 20% available balance with forced liquidation warnings
- ✅ **Risk Protection System**: Comprehensive warning popups for risky withdrawals
- ✅ **AI Simulator Moved**: Relocated from user dashboard to demo account
- ✅ **Improved Portfolio Management**: Real-time 80/20 balance calculations
- ✅ **Better UX**: All hardcoded URLs replaced with environment variables

---

## 📋 Pre-Deployment Checklist

### ✅ Code Quality
- [x] All linter warnings fixed
- [x] Unused imports removed
- [x] TypeScript errors resolved
- [x] Hardcoded URLs replaced with environment variables

### ✅ Production Ready
- [x] vercel.json updated for proper frontend deployment
- [x] API endpoints using environment variables
- [x] CORS configured for production URLs
- [x] Database ready for production

---

## 🌐 Frontend Deployment (Vercel)

### Step 1: Environment Variables in Vercel
Set these environment variables in your Vercel dashboard:

```bash
# Required Environment Variables
REACT_APP_API_URL=https://coral-app-bh2u4.ondigitalocean.app/api
REACT_APP_WS_URL=wss://coral-app-bh2u4.ondigitalocean.app/ws
GENERATE_SOURCEMAP=false
```

### Step 2: Deploy Commands
```bash
# From project root
git add .
git commit -m "Production deployment: All features ready"
git push origin main

# Vercel will auto-deploy from main branch
```

### Step 3: Verify Deployment
- Check frontend loads at: `https://crypto-trading-simulator-five.vercel.app`
- Test all new features:
  - Deposit page with tiered plans
  - Withdrawal page with risk warnings
  - User dashboard (AI simulator removed)
  - Demo page (AI simulator present)

---

## 🖥️ Backend Deployment (Digital Ocean)

### Step 1: Environment Variables
Create `.env` file in `/backend/` directory:

```bash
# Production Environment Variables
NODE_ENV=production
PORT=8080
JWT_SECRET=your-super-secure-256-character-jwt-secret-key

# CORS and Frontend
FRONTEND_URL=https://crypto-trading-simulator-five.vercel.app
CORS_ORIGIN=https://crypto-trading-simulator-five.vercel.app

# Database
DATABASE_URL=postgresql://username:password@host:port/database
POSTGRES_URL=postgresql://username:password@host:port/database

# WebSocket Configuration
WS_MAX_PAYLOAD=16384
WS_CONNECTION_TIMEOUT=1800000

# Production Settings
DEV_MODE=false
INTEREST_INTERVAL_MINUTES=1440
```

### Step 2: Deploy to Digital Ocean
```bash
# SSH to your Digital Ocean droplet
ssh root@your-droplet-ip

# Navigate to app directory
cd /var/www/crypto-trading-simulator

# Pull latest changes
git pull origin main

# Install dependencies
cd backend
npm install --production

# Restart the application
pm2 restart crypto-trading-backend

# Check status
pm2 status
pm2 logs crypto-trading-backend
```

### Step 3: Verify Backend
- Check API health: `https://coral-app-bh2u4.ondigitalocean.app/api/health`
- Check WebSocket: `wss://coral-app-bh2u4.ondigitalocean.app/ws`

---

## 🔧 New Features Testing Guide

### 1. Deposit System Testing
- Navigate to user dashboard → Depositar
- Verify 3 tiers display: $2500, $5000, $10000
- Test current plan detection based on user balance
- Verify "next plan" logic works correctly

### 2. Withdrawal System Testing
- Navigate to user dashboard → Retirar
- Enter amount > 20% of portfolio
- Verify risk warning popup appears
- Test "Quiero Retirar" confirmation requirement
- Verify alternative timeline calculations

### 3. Dashboard Testing
- Confirm AI Simulator tab removed from user dashboard
- Verify demo page still has AI simulator features
- Check all live trading feeds work correctly

---

## 🔍 Post-Deployment Verification

### Frontend Checks:
- [ ] All pages load without errors
- [ ] Navigation works correctly
- [ ] API calls successful
- [ ] WebSocket connections stable
- [ ] New deposit/withdrawal flows working

### Backend Checks:
- [ ] All API endpoints responding
- [ ] Database connections stable
- [ ] WebSocket server running
- [ ] Scheduled tasks working
- [ ] CORS allowing frontend requests

### Data Integrity:
- [ ] User portfolios calculating correctly (80/20 split)
- [ ] Compound interest system working
- [ ] Trading simulations running
- [ ] Real-time updates functioning

---

## 🚨 Rollback Plan

If issues occur:

```bash
# Quick rollback on Digital Ocean
cd /var/www/crypto-trading-simulator
git checkout HEAD~1  # Go back one commit
cd backend
pm2 restart crypto-trading-backend

# For Vercel, redeploy previous version through dashboard
```

---

## 📞 Support Contacts

- **Technical Issues**: Check logs with `pm2 logs`
- **Database Issues**: Verify DATABASE_URL connection
- **Frontend Issues**: Check Vercel deployment logs
- **WebSocket Issues**: Verify SSL certificates and CORS

---

## 🎯 Success Metrics

After deployment, monitor:
- User engagement with new deposit tiers
- Withdrawal attempt patterns
- Portfolio balance calculations accuracy
- System performance and uptime
- User feedback on new features

---

## 📝 Next Steps

After successful deployment:
1. Monitor user behavior with new features
2. Gather feedback on withdrawal risk warnings
3. Analyze deposit tier conversion rates
4. Plan next feature iterations
5. Scale infrastructure as needed