# 🌐 Staging Deployment Guide

This guide shows you how to set up a staging environment for testing before production deployment.

## 📋 Option 1: Vercel Preview Deployments (Easiest)

Vercel automatically creates preview deployments for every branch and pull request.

### Setup Preview Branch

```bash
# Create a staging branch
git checkout -b staging

# Make your changes
# ... edit files ...

# Commit and push to staging branch
git add .
git commit -m "Testing new features"
git push origin staging
```

### Access Preview Deployment

1. **Push to any branch** (not main)
2. **Vercel automatically deploys** a preview
3. **Check your GitHub repository** for the preview URL
4. **Test thoroughly** before merging to main

**Preview URL format:** `https://crypto-trading-simulator-git-staging-yourusername.vercel.app`

### Merge to Production

```bash
# After testing is successful
git checkout main
git merge staging
git push origin main

# Delete staging branch (optional)
git branch -d staging
git push origin --delete staging
```

## 📋 Option 2: Dedicated Staging Environment

### Step 1: Create Staging Branch

```bash
# Create a permanent staging branch
git checkout -b staging
git push origin staging
```

### Step 2: Vercel Staging Project

1. **Go to Vercel Dashboard**
2. **Import your repository again**
3. **Name it:** `crypto-trading-simulator-staging`
4. **Set branch to:** `staging`
5. **Configure environment variables:**

```env
REACT_APP_API_URL=https://your-staging-backend.ondigitalocean.app/api
```

### Step 3: Backend Staging Server (Optional)

If you want a separate staging backend:

1. **Deploy another DigitalOcean instance**
2. **Use staging database**
3. **Point staging frontend to staging backend**

## 📋 Option 3: Feature Branch Testing

### For Each Feature

```bash
# Create feature branch
git checkout -b feature/new-dashboard-widget

# Make changes
# ... code your feature ...

# Push feature branch
git add .
git commit -m "Add new dashboard widget"
git push origin feature/new-dashboard-widget
```

**Vercel automatically creates:** `https://crypto-trading-simulator-git-feature-new-dashboard-widget-yourusername.vercel.app`

### Testing Workflow

1. **Develop on feature branch**
2. **Push to trigger preview deployment**
3. **Test preview URL**
4. **Merge to main when ready**

## 🎯 Recommended Workflow

### Daily Development

```bash
# 1. Create feature branch
git checkout -b feature/my-new-feature

# 2. Make changes locally
# Test with: npm run dev (backend) + npm start (frontend)

# 3. Commit and push
git add .
git commit -m "Implement my new feature"
git push origin feature/my-new-feature

# 4. Test Vercel preview deployment
# Visit the auto-generated preview URL

# 5. Merge to production
git checkout main
git merge feature/my-new-feature
git push origin main
```

## 🔧 Environment Variables for Staging

### Staging Frontend (.env)
```env
REACT_APP_API_URL=https://coral-app-bh2u4.ondigitalocean.app/api
```

### Production Frontend (.env)
```env
REACT_APP_API_URL=https://coral-app-bh2u4.ondigitalocean.app/api
```

*Note: You can use the same backend for both staging and production, or create separate backend instances.*

## 🚀 Quick Setup Commands

### Start Local Development
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend  
cd frontend
npm start
```

### Deploy to Staging
```bash
git checkout staging
git merge main
git push origin staging
# Wait for Vercel deployment
```

### Deploy to Production
```bash
git checkout main
git push origin main
# Wait for Vercel deployment
```

## 📊 Monitoring Deployments

### Vercel Dashboard
- **View all deployments:** https://vercel.com/dashboard
- **Check build logs** for errors
- **Monitor performance** metrics

### GitHub Integration
- **Status checks** on pull requests
- **Preview links** in PR comments
- **Automatic deployments** on push

## 🛡️ Best Practices

### Testing Strategy
1. **Local development** for rapid iteration
2. **Feature branch previews** for testing specific features
3. **Staging environment** for final testing
4. **Production deployment** after all tests pass

### Branch Strategy
```
main (production)
  ├── staging (staging environment)
  ├── feature/new-feature (preview deployment)
  └── feature/bug-fix (preview deployment)
```

### Environment Management
- **Local:** JSON files, development settings
- **Staging:** Production backend, test data
- **Production:** Full production setup

## 🔄 CI/CD Pipeline

### Current Setup
1. **Push to any branch** → Vercel preview deployment
2. **Push to main** → Production deployment
3. **Automatic builds** and deployments

### Enhanced Setup (Optional)
- Add **automated testing** before deployment
- Add **database migrations** for staging
- Add **monitoring** and **alerts**

## 🎉 Benefits

### Local Development
- ✅ **Instant feedback** with hot reload
- ✅ **No deployment delays** 
- ✅ **Full debugging** capabilities

### Preview Deployments
- ✅ **Real environment** testing
- ✅ **Share with team** for review
- ✅ **Production-like** performance

### Staging Environment
- ✅ **Final testing** before production
- ✅ **Data migration** testing
- ✅ **Integration** testing