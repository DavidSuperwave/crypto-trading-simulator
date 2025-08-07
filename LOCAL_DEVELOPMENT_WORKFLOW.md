# 🚀 Local Development Workflow

Quick testing and development without committing every change!

## 📋 Quick Start Commands

### Development Mode (Hot Reloading)
```bash
# Start both servers with hot reloading
npm run dev

# Restart both servers quickly
npm run dev:quick

# Restart only backend (when you change backend code)
npm run dev:backend

# Restart only frontend (when you change frontend code)  
npm run dev:frontend
```

### Production Testing (Local)
```bash
# Test in production mode locally
npm run local:production

# Build frontend and test production mode
npm run test:production
```

### Setup & Maintenance
```bash
# Install all dependencies
npm run install:all

# Clean cache and reinstall everything
npm run reset

# Clean frontend build cache
npm run clean
```

## 🛠️ Development Workflows

### Scenario 1: Quick Feature Development
1. **Start dev environment:** `npm run dev`
2. **Make changes** to your code (frontend or backend)
3. **Backend changes:** Nodemon auto-restarts the server
4. **Frontend changes:** React hot-reloads automatically
5. **Test immediately** - no commits needed!

### Scenario 2: Testing Production Behavior
1. **Build and test:** `npm run local:production`
2. **See exactly how it will work** in production
3. **Test WebSockets, real-time features, etc.**
4. **No DigitalOcean deployment needed** for testing

### Scenario 3: Rapid Iteration
1. **Start dev:** `npm run dev`
2. **Make backend changes** → Automatically restarts
3. **Make frontend changes** → Automatically reloads
4. **Need clean restart?** → `npm run dev:quick`
5. **Backend only restart?** → `npm run dev:backend`

## 🌐 Local URLs

When running locally, access your app at:

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5001
- **Admin Dashboard:** http://localhost:3000/admin
- **User Dashboard:** http://localhost:3000/user
- **Demo Dashboard:** http://localhost:3000/demo

## ⚡ Quick Testing Features

### Real-time Features Testing
- **Chat:** Send messages between user and admin
- **Notifications:** Test deposit/withdrawal notifications
- **WebSocket fallback:** See polling system in action
- **Persistent login:** Test page refresh behavior

### Admin Features Testing
- **User management:** Create, view, delete users
- **Deposit approvals:** Test the full approval workflow
- **Withdrawal processing:** Test withdrawal approvals
- **Chat management:** Test unread counters and messages

## 🔄 Hot Reloading Benefits

### Backend Changes (Nodemon)
- ✅ Route changes apply immediately
- ✅ Database changes apply immediately  
- ✅ WebSocket changes apply immediately
- ✅ No manual restart needed

### Frontend Changes (React)
- ✅ Component changes apply immediately
- ✅ Styling changes apply immediately
- ✅ State changes preserved
- ✅ No page refresh needed

## 🎯 Production-Like Testing

### What `npm run local:production` gives you:
- ✅ **Optimized build** - minified, bundled code
- ✅ **Production environment** variables
- ✅ **Actual deployment behavior** without deploying
- ✅ **Performance testing** - see real loading times
- ✅ **Error testing** - see production error handling

## 🚨 Troubleshooting

### Servers not starting?
```bash
# Kill any existing processes
pkill -f "node.*server.js"
pkill -f "react-scripts"

# Clean and restart
npm run reset
npm run dev
```

### Frontend not updating?
```bash
# Clear React cache
npm run clean
npm run dev:frontend
```

### Backend not restarting?
```bash
# Force restart backend only
npm run dev:backend
```

### Port conflicts?
- Backend runs on port **5001**
- Frontend runs on port **3000**
- Make sure these ports are free

## 💡 Pro Tips

1. **Keep `npm run dev` running** - it auto-restarts everything
2. **Use `npm run local:production`** before committing major changes
3. **Test real-time features** extensively in development
4. **Check both admin and user flows** before deploying
5. **Use browser dev tools** for debugging WebSocket connections

## 🎉 Benefits

- **No commits needed** for testing
- **Instant feedback** on changes
- **Production testing** without deployment
- **Faster development** cycle
- **Better debugging** with source maps
- **Real-time feature testing** locally

---

**Happy coding! 🚀 Now you can iterate quickly without committing every change!**