# 🗄️ Database Migration Guide - Production

## 🚨 **CRITICAL: Run this comprehensive migration on Digital Ocean**

The registration 500 error AND many new features require a complete database migration. You MUST run this migration on your production PostgreSQL database.

## 📋 **What the Migration Does:**

✅ **User Profile & Simulation Fields**: `first_name`, `last_name`, `phone`, `deposited_amount`, `simulated_interest`, etc.  
✅ **10 New Tables**: Complete feature set for production  
✅ **Performance Indexes**: Optimized for scale  
✅ **Data Initialization**: Existing users updated  

### 🆕 **New Tables Created:**
1. **`pending_deposits`** - Deposit approval workflow
2. **`withdrawals`** - Enhanced withdrawal tracking with risk flags
3. **`chat_messages`** - User-admin chat system
4. **`interest_payments`** - Interest payment tracking
5. **`demos`** - Demo request management
6. **`compound_simulations`** - 12-month simulation plans
7. **`simulation_plans`** - Monthly simulation details
8. **`daily_trades`** - Generated trading activity
9. **`user_positions`** - Current trading positions
10. **`position_history`** - Historical position data  

---

## 🔧 **Option 1: Run via Digital Ocean Console**

### Step 1: Access your PostgreSQL database
1. Go to **Digital Ocean Dashboard** → **Databases** 
2. Click on your PostgreSQL database
3. Go to **Users & Databases** tab
4. Click **"Open Console"** or use connection details

### Step 2: Copy & paste migration SQL
```sql
-- Copy the contents of backend/migrations/create_production_tables.sql
-- Paste and execute in the console
```

---

## 🔧 **Option 2: Run via App Platform Console**

### Step 1: SSH into your App Platform
1. Go to **Digital Ocean Dashboard** → **Apps**
2. Click on your app → **Console** tab
3. Open a console session

### Step 2: Navigate and run migration
```bash
cd /workspace
node backend/runMigration.js
```

---

## 🔧 **Option 3: Run Locally (if you have DB access)**

### Step 1: Set environment variables
```bash
export DATABASE_URL="postgresql://username:password@your-db-host:25060/database?sslmode=require"
```

### Step 2: Run migration script
```bash
cd backend
node runMigration.js
```

---

## ✅ **Expected Output:**

```
🗄️ Database Migration Runner
==============================
🔌 Testing database connection...
✅ Database connected successfully
📁 Reading migration file: /workspace/backend/migrations/create_production_tables.sql
📝 Migration SQL loaded (XXXX characters)
🚀 Executing migration...
✅ Migration completed successfully!
🔍 Verifying migration...
✅ Migration verification successful! New columns:
   - deposited_amount (numeric)
   - first_name (character varying)
   - last_name (character varying)
   - phone (character varying)
   - simulation_active (boolean)
📊 Total users in database: X

🎉 PRODUCTION DATABASE MIGRATION COMPLETED SUCCESSFULLY!
✅ Created 10 new tables with proper indexes and constraints
✅ Enhanced users table with simulation fields
✅ Initialized existing user data

New tables created:
• pending_deposits - Deposit approval workflow
• withdrawals - Enhanced withdrawal tracking
• chat_messages - User-admin chat system
• interest_payments - Interest payment tracking
• demos - Demo request management
• compound_simulations - 12-month simulation plans
• simulation_plans - Monthly simulation details
• daily_trades - Generated trading activity
• user_positions - Current trading positions
• position_history - Historical position data

🚀 Your production database is now ready!
```

---

## 🧪 **After Migration - Test Registration:**

1. **Wait 2-3 minutes** for Vercel deployment to complete
2. **Go to your live site** and try to register a new user
3. **Check browser console** for detailed error logs we added
4. **Registration should now work!** ✅

---

## 🔍 **Troubleshooting:**

### If migration fails:
- Check DATABASE_URL is correct
- Ensure you have admin/owner permissions
- Verify PostgreSQL version compatibility

### If registration still fails:
- Check browser console for detailed error logs
- Verify `REACT_APP_API_URL` points to your Digital Ocean backend
- Ensure backend is running and accessible

---

## 📞 **Need Help?**

If you encounter issues:
1. Share the exact error message from migration
2. Share browser console logs from registration attempt
3. Verify your Digital Ocean backend is responding

**The migration MUST be run before registration will work!** 🚨