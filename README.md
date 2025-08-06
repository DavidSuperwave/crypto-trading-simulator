# 🚀 CryptoSim AI - Trading Simulator Framework

A comprehensive AI crypto trading simulator with separate dashboards for admins, users, and demos. Built with React (TypeScript) frontend and Node.js Express backend.

## ✨ Features

### 👤 User Dashboard
- **Send Funds**: Deposit money into trading account
- **Withdraw Requests**: Request withdrawals (pending admin approval)
- **Balance & Interest**: View current balance and AI-generated interest earnings
- **Transaction History**: Complete history of all transactions
- **AI Interest Generation**: Simulate AI trading profits

### 🛡️ Admin Dashboard
- **User Management**: View all users and their details
- **Deposit Overview**: Monitor all incoming deposits
- **Withdrawal Management**: Approve/reject withdrawal requests
- **Demo Requests**: Manage incoming sales demo requests
- **Transaction Monitoring**: View all system transactions
- **System Overview**: Real-time dashboard statistics

### 🎯 Demo Dashboard
- **Live Trading Data**: Real-time simulated trading performance
- **Demo Statistics**: Impressive stats for sales presentations
- **Recent Trades**: AI trading activity showcase
- **Demo Request Form**: Lead capture for sales team
- **Interactive Charts**: Visual trading performance data

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the server**
   ```bash
   npm run dev
   ```
   
   The API will be available at `http://localhost:5001`

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   ```
   
   The app will be available at `http://localhost:3000`

## 🔐 Demo Credentials

### Admin Access
- **Email**: `admin@cryptosim.com`
- **Password**: `admin123`

### User Access
- **Email**: `user@cryptosim.com`
- **Password**: `user123`

## 📱 Dashboard URLs

- **Demo Dashboard**: `http://localhost:3000/demo` (No login required)
- **User Dashboard**: `http://localhost:3000/user` (Login required)
- **Admin Dashboard**: `http://localhost:3000/admin` (Admin role required)
- **Login Page**: `http://localhost:3000/login`

## 🏗️ Project Structure

```
crypto-trading-simulator/
├── backend/
│   ├── routes/
│   │   ├── auth.js          # Authentication routes
│   │   ├── user.js          # User operations
│   │   ├── admin.js         # Admin operations
│   │   └── demo.js          # Demo data & requests
│   ├── middleware/
│   │   └── auth.js          # JWT authentication
│   ├── data/                # JSON file database
│   ├── database.js          # Database operations
│   ├── server.js            # Express server
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Login.tsx
│   │   │   ├── UserDashboard.tsx
│   │   │   ├── AdminDashboard.tsx
│   │   │   ├── DemoDashboard.tsx
│   │   │   └── Navigation.tsx
│   │   ├── context/
│   │   │   └── AuthContext.tsx
│   │   ├── App.tsx
│   │   └── App.css
│   └── package.json
└── README.md
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/create-admin` - Create admin user

### User Operations
- `GET /api/user/profile` - Get user profile
- `POST /api/user/deposit` - Deposit funds
- `POST /api/user/withdraw` - Request withdrawal
- `GET /api/user/transactions` - Get user transactions
- `GET /api/user/withdrawals` - Get user withdrawals
- `POST /api/user/calculate-interest` - Generate AI interest

### Admin Operations
- `GET /api/admin/dashboard` - Admin overview
- `GET /api/admin/users` - All users
- `GET /api/admin/transactions` - All transactions
- `GET /api/admin/withdrawals` - All withdrawals
- `PUT /api/admin/withdrawals/:id` - Update withdrawal status
- `GET /api/admin/demos` - Demo requests
- `PUT /api/admin/demos/:id` - Update demo status

### Demo Operations
- `POST /api/demo/request` - Submit demo request
- `GET /api/demo/stats` - Demo statistics
- `GET /api/demo/trading-data` - Live trading data
- `GET /api/demo/recent-trades` - Recent trades

## 💾 Database

Currently uses JSON files for data storage (suitable for development/demo):
- `data/users.json` - User accounts
- `data/transactions.json` - All transactions
- `data/withdrawals.json` - Withdrawal requests
- `data/demos.json` - Demo requests

## 🎨 Styling & UI

- **Modern Design**: Clean, professional interface
- **Responsive**: Works on desktop and mobile
- **Color Scheme**: Purple gradient theme with professional accents
- **Icons**: Lucide React icons
- **Charts**: Recharts for data visualization
- **Typography**: System fonts for better performance

## 🔮 Future Enhancements

### Phase 1 - Core Features
- [ ] Real database integration (PostgreSQL/MongoDB)
- [ ] Email notifications for withdrawals
- [ ] Advanced user roles and permissions
- [ ] API rate limiting and security headers

### Phase 2 - Advanced Features
- [ ] Real-time WebSocket connections
- [ ] Advanced trading algorithms
- [ ] Multi-currency support
- [ ] Mobile app (React Native)

### Phase 3 - Enterprise Features
- [ ] White-label solutions
- [ ] Advanced analytics and reporting
- [ ] Integration with real trading APIs
- [ ] Compliance and audit trails

## 🛠️ Development Commands

### Backend
```bash
npm start          # Production server
npm run dev        # Development server with nodemon
```

### Frontend
```bash
npm start          # Development server
npm run build      # Production build
npm test           # Run tests
```

## 📝 Environment Variables

Create a `.env` file in the backend directory:

```
PORT=5001
JWT_SECRET=your_jwt_secret_key_here
NODE_ENV=development
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

If you encounter any issues or have questions:

1. Check the console for error messages
2. Ensure both backend and frontend servers are running
3. Verify the API endpoints are accessible
4. Check network connectivity between frontend and backend

## 🎯 Demo Instructions

For sales demonstrations:

1. Start with the **Demo Dashboard** (`/demo`) - no login required
2. Show real-time trading data and statistics
3. Demo the user registration process
4. Login as a user to show the **User Dashboard**
5. Demonstrate deposits, withdrawals, and interest generation
6. Login as admin to show the **Admin Dashboard**
7. Show user management and withdrawal approval process

---

Built with ❤️ for the future of cryptocurrency trading simulation.