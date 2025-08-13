# 🌊 Digital Ocean + Vercel Deployment Guide

## 📋 Platform-Specific Infrastructure Requirements

### Current Setup Analysis
- **Frontend**: Vercel (React/Next.js hosting)
- **Backend**: Digital Ocean (API + Real-time simulation)
- **Database**: Digital Ocean Managed PostgreSQL

---

## 🚨 Critical Infrastructure Decision

### ⚠️ **Vercel Limitations for Our Simulation System**

**Problem**: Vercel is **serverless** and has significant limitations for our real-time simulation:

```
❌ Vercel Serverless Functions:
- 10 second timeout (Hobby plan)
- 60 second timeout (Pro plan) 
- No persistent processes
- Functions spin down when idle
- No cron jobs/scheduled tasks
- Stateless execution only
```

**Our Simulation Needs**:
```
✅ Requirements:
- 24/7 background processing
- Daily cron jobs at 12:01 AM
- Persistent scheduler state
- Long-running trade generation
- Database connections maintained
```

### 🎯 **Recommended Architecture**

#### **Option 1: Hybrid Deployment (Recommended)**
```
┌─────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend  │    │   Backend API   │    │   Simulation    │
│   (Vercel)  │───▶│ (Digital Ocean) │───▶│  (Digital Ocean)│
│             │    │                 │    │                 │
│  React App  │    │  Express.js     │    │  Cron Scheduler │
└─────────────┘    └─────────────────┘    └─────────────────┘
```

#### **Option 2: Full Digital Ocean (Alternative)**
```
┌─────────────────────────────────┐
│      Digital Ocean Droplet      │
│                                 │
│  ┌──────────┐  ┌──────────────┐ │
│  │ Frontend │  │   Backend    │ │
│  │ (Static) │  │ + Simulation │ │
│  └──────────┘  └──────────────┘ │
└─────────────────────────────────┘
```

---

## 🚀 **Digital Ocean Deployment Options**

### **Option A: Digital Ocean App Platform (Recommended)**

#### **App Platform Benefits**
- ✅ Managed deployment and scaling
- ✅ Built-in load balancing
- ✅ Automatic SSL certificates
- ✅ Git-based deployments
- ✅ **Supports persistent processes** (perfect for our scheduler!)

#### **App Platform Setup**
```yaml
# .do/app.yaml
name: crypto-trading-simulator
services:
- name: backend
  source_dir: /backend
  github:
    repo: your-username/crypto-trading-simulator
    branch: main
  run_command: npm start
  environment_slug: node-js
  instance_count: 1
  instance_size_slug: basic-xxs
  routes:
  - path: /api
  envs:
  - key: NODE_ENV
    value: production
  - key: DATABASE_URL
    scope: RUN_TIME
    type: SECRET

- name: frontend
  source_dir: /frontend
  github:
    repo: your-username/crypto-trading-simulator
    branch: main
  build_command: npm run build
  environment_slug: node-js
  instance_count: 1
  instance_size_slug: basic-xxs
  routes:
  - path: /
```

### **Option B: Digital Ocean Droplet (Traditional Server)**

#### **Droplet Benefits**
- ✅ Full server control
- ✅ Custom configurations
- ✅ SSH access
- ✅ Traditional PM2 setup
- ✅ Cost-effective for small scale

#### **Droplet Setup Commands**
```bash
# 1. Create Ubuntu 22.04 Droplet ($6/month minimum)
# 2. SSH into droplet
ssh root@your-droplet-ip

# 3. Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt-get install -y nodejs

# 4. Install PM2
npm install -g pm2

# 5. Clone and setup project
git clone https://github.com/your-username/crypto-trading-simulator.git
cd crypto-trading-simulator/backend
npm install --production

# 6. Start with PM2
pm2 start server.js --name crypto-simulator
pm2 startup
pm2 save

# 7. Setup nginx (optional reverse proxy)
apt install nginx
# Configure nginx for your domain
```

---

## 🗃️ **Database Configuration**

### **Digital Ocean Managed PostgreSQL (Recommended)**

#### **Setup Steps**
1. **Create Managed Database**
   - Go to Digital Ocean Dashboard
   - Create PostgreSQL 15 cluster
   - Choose region (same as your backend)
   - Select size (Basic $15/month minimum)

2. **Get Connection Details**
   ```
   Host: your-db-cluster.db.ondigitalocean.com
   Port: 25060
   Database: defaultdb
   Username: doadmin
   Password: [generated-password]
   ```

3. **Configure Backend Environment**
   ```bash
   # .env or environment variables
   DATABASE_URL=postgresql://doadmin:password@host:25060/defaultdb?sslmode=require
   NODE_ENV=production
   ```

4. **Initialize Database**
   ```bash
   # Run migrations
   npm run db:init
   ```

---

## 🔧 **Updated Infrastructure Requirements**

### **For Digital Ocean App Platform**
```json
{
  "requirements": {
    "node_cron": "✅ Supported - persistent processes",
    "scheduled_tasks": "✅ Works perfectly",
    "background_processing": "✅ Runs 24/7", 
    "database_connections": "✅ Persistent connections",
    "process_management": "✅ Built-in (no PM2 needed)"
  }
}
```

### **For Digital Ocean Droplet**
```json
{
  "requirements": {
    "pm2": "✅ Install globally",
    "nginx": "✅ Reverse proxy recommended",
    "ssl": "✅ Let's Encrypt + Certbot",
    "firewall": "✅ Configure UFW",
    "monitoring": "✅ Digital Ocean monitoring"
  }
}
```

### **❌ NOT for Vercel Backend**
```json
{
  "limitations": {
    "cron_jobs": "❌ Not supported",
    "persistent_processes": "❌ Serverless only",
    "background_tasks": "❌ Function timeouts",
    "our_simulation": "❌ Won't work properly"
  }
}
```

---

## 🎯 **Recommended Deployment Strategy**

### **Phase 1: Current Working Setup**
```
Frontend (Vercel) ────────┐
                          ▼
Backend + Simulation (Digital Ocean App Platform)
                          ▼
PostgreSQL (Digital Ocean Managed Database)
```

### **Configuration Steps**

#### **1. Move Backend to Digital Ocean**
```bash
# In your project root, create .do/app.yaml
name: crypto-trading-simulator-backend
services:
- name: api
  source_dir: /backend
  run_command: node server.js
  environment_slug: node-js
  instance_count: 1
  instance_size_slug: basic-xxs
  http_port: 8080
  routes:
  - path: /
  envs:
  - key: NODE_ENV
    value: production
```

#### **2. Update Frontend API URLs**
```javascript
// frontend/src/config/api.ts
const API_CONFIG = {
  BASE_URL: process.env.NODE_ENV === 'production' 
    ? 'https://your-app-name.ondigitalocean.app'  // Digital Ocean App Platform
    : 'http://localhost:5001',
  // ... rest of config
};
```

#### **3. Configure Environment Variables**
```bash
# In Digital Ocean App Platform dashboard
DATABASE_URL=postgresql://user:pass@host:port/db
JWT_SECRET=your-jwt-secret
NODE_ENV=production
```

### **Expected Performance**
```
✅ Digital Ocean App Platform:
- Scheduler runs 24/7 automatically
- Daily processing at 12:01 AM works
- Supports 1000+ users easily
- $12-25/month cost
- Auto-scaling available

✅ Frontend on Vercel:
- Fast global CDN
- Automatic deployments
- Free SSL certificates
- Excellent performance
```

---

## 🔍 **Testing Your Current Setup**

### **Check If Backend is on Vercel**
```bash
# Look for these files:
vercel.json          # Vercel configuration
api/                 # Serverless functions folder
netlify.toml        # Alternative serverless platform

# Check package.json scripts:
"vercel-build"      # Vercel-specific build
"start": "vercel dev"  # Vercel development
```

### **Verify Deployment Platform**
```bash
# Check your current backend URL
curl https://your-backend-url/api/health

# Look for response headers:
"server": "Vercel"           # ❌ Serverless - needs migration
"server": "nginx"            # ✅ Traditional server
"x-powered-by": "Express"    # ✅ Likely traditional deployment
```

---

## 🚨 **Action Items**

### **If Backend is Currently on Vercel** (Likely Issue)
1. **Migrate backend to Digital Ocean App Platform**
2. **Update frontend API URLs**
3. **Test scheduler functionality**
4. **Verify daily processing works**

### **If Backend is Already on Digital Ocean** ✅
1. **Verify scheduler is running**: `GET /api/admin/scheduler/status`
2. **Test manual daily processing**: `POST /api/admin/scheduler/trigger/daily-interest`
3. **Monitor logs for 24-48 hours**
4. **Confirm automatic daily execution**

### **Database Optimization**
1. **Switch to Digital Ocean Managed PostgreSQL**
2. **Run database migrations**
3. **Setup automated backups**
4. **Configure connection pooling**

---

## 💰 **Cost Breakdown**

### **Digital Ocean App Platform**
```
Backend API: $12/month (Basic)
Database: $15/month (Basic PostgreSQL)
Total: $27/month
```

### **Digital Ocean Droplet Alternative**
```
Droplet: $6/month (Basic)
Database: $15/month (Managed PostgreSQL)
Total: $21/month
```

### **Vercel (Frontend Only)**
```
Frontend: $0/month (Hobby plan)
Custom domain: $0 (included)
```

**Total Monthly Cost: $21-27** for production-ready infrastructure! 🎯

---

## 🎉 **Next Steps**

1. **Verify current backend deployment platform**
2. **If on Vercel → Migrate to Digital Ocean**
3. **If on Digital Ocean → Test scheduler endpoints**
4. **Setup managed PostgreSQL database**
5. **Monitor daily processing execution**

The real-time simulation system will work **perfectly** on Digital Ocean but **will NOT work** on Vercel serverless functions! 🚀