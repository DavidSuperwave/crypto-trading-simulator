-- ===================================================================
-- COMPREHENSIVE PRODUCTION DATABASE MIGRATION
-- Creates ALL missing tables for the crypto trading simulator
-- 
-- This migration includes:
-- 1. User profile and simulation fields
-- 2. Pending deposits workflow
-- 3. Enhanced withdrawals with risk tracking
-- 4. Chat messages system
-- 5. Interest payments tracking
-- 6. Demo requests
-- 7. Compound simulations data
-- 8. Trading positions and history
-- ===================================================================

-- First, ensure the users table has all needed fields
-- (Includes fields from previous migration)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS first_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS last_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS deposited_amount DECIMAL(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS simulated_interest DECIMAL(15,8) DEFAULT 0,
ADD COLUMN IF NOT EXISTS current_monthly_target DECIMAL(15,8) DEFAULT 0,
ADD COLUMN IF NOT EXISTS simulation_start_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS last_simulation_update TIMESTAMP,
ADD COLUMN IF NOT EXISTS simulation_active BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS current_plan VARCHAR(50) DEFAULT 'basic';

-- ===================================================================
-- 1. PENDING DEPOSITS TABLE
-- Handles the deposit approval workflow
-- ===================================================================
CREATE TABLE IF NOT EXISTS pending_deposits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user_email VARCHAR(255) NOT NULL,
    user_name VARCHAR(255) NOT NULL,
    amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
    plan VARCHAR(50) NOT NULL DEFAULT 'basic',
    method VARCHAR(100) NOT NULL DEFAULT 'bank_transfer',
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    notes TEXT,
    processed_at TIMESTAMP,
    processed_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ===================================================================
-- 2. ENHANCED WITHDRAWALS TABLE  
-- Includes risk tracking and forced liquidation features
-- ===================================================================
CREATE TABLE IF NOT EXISTS withdrawals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user_email VARCHAR(255),
    user_name VARCHAR(255),
    amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
    method VARCHAR(100) DEFAULT 'bank_transfer',
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
    is_forced BOOLEAN DEFAULT false,
    is_risky BOOLEAN DEFAULT false,
    available_balance_at_time DECIMAL(15,2),
    notes TEXT,
    processed_at TIMESTAMP,
    processed_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ===================================================================
-- 3. CHAT MESSAGES TABLE
-- User-admin chat system
-- ===================================================================
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL,
    sender_type VARCHAR(20) NOT NULL CHECK (sender_type IN ('user', 'admin')),
    sender_name VARCHAR(255) NOT NULL,
    recipient_user_id UUID REFERENCES users(id),
    recipient_type VARCHAR(20) NOT NULL CHECK (recipient_type IN ('user', 'admin')),
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    timestamp TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

-- ===================================================================
-- 4. INTEREST PAYMENTS TABLE
-- Tracks all interest payments to users
-- ===================================================================
CREATE TABLE IF NOT EXISTS interest_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(15,8) NOT NULL,
    payment_type VARCHAR(50) NOT NULL DEFAULT 'daily' CHECK (payment_type IN ('daily', 'monthly', 'compound', 'bonus')),
    source_type VARCHAR(50) DEFAULT 'simulation' CHECK (source_type IN ('simulation', 'trading', 'manual')),
    month_number INTEGER,
    year INTEGER,
    description TEXT,
    simulation_month_id UUID,
    processed_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

-- ===================================================================
-- 5. DEMO REQUESTS TABLE
-- Handles demo requests from prospects
-- ===================================================================
CREATE TABLE IF NOT EXISTS demos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    company VARCHAR(255),
    phone VARCHAR(50),
    message TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'requested' CHECK (status IN ('requested', 'contacted', 'completed', 'declined')),
    notes TEXT,
    processed_at TIMESTAMP,
    processed_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ===================================================================
-- 6. COMPOUND SIMULATIONS TABLE
-- Stores complete 12-month simulation plans for users
-- ===================================================================
CREATE TABLE IF NOT EXISTS compound_simulations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    start_date TIMESTAMP NOT NULL,
    initial_deposit DECIMAL(15,2) NOT NULL,
    total_deposited DECIMAL(15,2) NOT NULL,
    current_balance DECIMAL(15,2) NOT NULL,
    total_projected_return DECIMAL(15,2) NOT NULL,
    simulation_data JSONB NOT NULL, -- Stores complete month-by-month plan
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'cancelled')),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ===================================================================
-- 7. SIMULATION PLANS TABLE
-- Individual monthly plans within compound simulations
-- ===================================================================
CREATE TABLE IF NOT EXISTS simulation_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    compound_simulation_id UUID NOT NULL REFERENCES compound_simulations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    month_number INTEGER NOT NULL CHECK (month_number BETWEEN 1 AND 12),
    year INTEGER NOT NULL,
    month_name VARCHAR(50) NOT NULL,
    is_first_month BOOLEAN DEFAULT false,
    locked_rate DECIMAL(8,6) NOT NULL,
    starting_balance DECIMAL(15,2) NOT NULL,
    projected_interest DECIMAL(15,2) NOT NULL,
    ending_balance DECIMAL(15,2) NOT NULL,
    days_in_month INTEGER NOT NULL,
    actual_interest_paid DECIMAL(15,2) DEFAULT 0,
    last_payout_date DATE,
    daily_payout_schedule JSONB, -- Array of daily amounts
    daily_volatility JSONB, -- Volatility patterns
    trade_count INTEGER DEFAULT 0,
    actual_deposits JSONB, -- Array of mid-month deposits
    status VARCHAR(50) NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'active', 'completed', 'paused')),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ===================================================================
-- 8. DAILY TRADES TABLE
-- Stores generated daily trading data for realistic activity
-- ===================================================================
CREATE TABLE IF NOT EXISTS daily_trades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    trade_date DATE NOT NULL,
    trade_timestamp TIMESTAMP NOT NULL,
    symbol VARCHAR(20) NOT NULL,
    trade_type VARCHAR(10) NOT NULL CHECK (trade_type IN ('BUY', 'SELL')),
    quantity DECIMAL(15,8) NOT NULL,
    price DECIMAL(15,2) NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    profit_loss DECIMAL(15,2),
    is_profitable BOOLEAN,
    hold_duration_minutes INTEGER,
    trade_number INTEGER, -- Position in daily sequence
    volatility_factor DECIMAL(8,6),
    created_at TIMESTAMP DEFAULT NOW()
);

-- ===================================================================
-- 9. USER POSITIONS TABLE
-- Current trading positions for each user
-- ===================================================================
CREATE TABLE IF NOT EXISTS user_positions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    symbol VARCHAR(20) NOT NULL,
    position_type VARCHAR(10) NOT NULL CHECK (position_type IN ('LONG', 'SHORT')),
    quantity DECIMAL(15,8) NOT NULL,
    entry_price DECIMAL(15,2) NOT NULL,
    current_price DECIMAL(15,2),
    unrealized_pnl DECIMAL(15,2),
    entry_timestamp TIMESTAMP NOT NULL,
    is_locked BOOLEAN DEFAULT false,
    lock_duration_minutes INTEGER,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, symbol) -- One position per symbol per user
);

-- ===================================================================
-- 10. POSITION HISTORY TABLE
-- Historical record of all closed positions
-- ===================================================================
CREATE TABLE IF NOT EXISTS position_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    symbol VARCHAR(20) NOT NULL,
    position_type VARCHAR(10) NOT NULL CHECK (position_type IN ('LONG', 'SHORT')),
    quantity DECIMAL(15,8) NOT NULL,
    entry_price DECIMAL(15,2) NOT NULL,
    exit_price DECIMAL(15,2) NOT NULL,
    realized_pnl DECIMAL(15,2) NOT NULL,
    entry_timestamp TIMESTAMP NOT NULL,
    exit_timestamp TIMESTAMP NOT NULL,
    hold_duration_minutes INTEGER,
    is_profitable BOOLEAN,
    close_reason VARCHAR(50) DEFAULT 'normal' CHECK (close_reason IN ('normal', 'forced_liquidation', 'stop_loss', 'take_profit')),
    created_at TIMESTAMP DEFAULT NOW()
);

-- ===================================================================
-- CREATE INDEXES FOR PERFORMANCE
-- ===================================================================

-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_simulation_active ON users(simulation_active);
CREATE INDEX IF NOT EXISTS idx_users_current_plan ON users(current_plan);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);

-- Pending deposits indexes
CREATE INDEX IF NOT EXISTS idx_pending_deposits_user_id ON pending_deposits(user_id);
CREATE INDEX IF NOT EXISTS idx_pending_deposits_status ON pending_deposits(status);
CREATE INDEX IF NOT EXISTS idx_pending_deposits_created_at ON pending_deposits(created_at);

-- Withdrawals indexes
CREATE INDEX IF NOT EXISTS idx_withdrawals_user_id ON withdrawals(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON withdrawals(status);
CREATE INDEX IF NOT EXISTS idx_withdrawals_is_risky ON withdrawals(is_risky);
CREATE INDEX IF NOT EXISTS idx_withdrawals_created_at ON withdrawals(created_at);

-- Chat messages indexes
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_id ON chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_recipient_user_id ON chat_messages(recipient_user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_is_read ON chat_messages(is_read);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);

-- Interest payments indexes
CREATE INDEX IF NOT EXISTS idx_interest_payments_user_id ON interest_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_interest_payments_payment_type ON interest_payments(payment_type);
CREATE INDEX IF NOT EXISTS idx_interest_payments_processed_at ON interest_payments(processed_at);

-- Compound simulations indexes
CREATE INDEX IF NOT EXISTS idx_compound_simulations_user_id ON compound_simulations(user_id);
CREATE INDEX IF NOT EXISTS idx_compound_simulations_status ON compound_simulations(status);

-- Simulation plans indexes
CREATE INDEX IF NOT EXISTS idx_simulation_plans_user_id ON simulation_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_simulation_plans_compound_simulation_id ON simulation_plans(compound_simulation_id);
CREATE INDEX IF NOT EXISTS idx_simulation_plans_status ON simulation_plans(status);
CREATE INDEX IF NOT EXISTS idx_simulation_plans_month_year ON simulation_plans(month_number, year);

-- Daily trades indexes
CREATE INDEX IF NOT EXISTS idx_daily_trades_user_id ON daily_trades(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_trades_date ON daily_trades(trade_date);
CREATE INDEX IF NOT EXISTS idx_daily_trades_symbol ON daily_trades(symbol);
CREATE INDEX IF NOT EXISTS idx_daily_trades_timestamp ON daily_trades(trade_timestamp);

-- User positions indexes
CREATE INDEX IF NOT EXISTS idx_user_positions_user_id ON user_positions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_positions_symbol ON user_positions(symbol);
CREATE INDEX IF NOT EXISTS idx_user_positions_is_locked ON user_positions(is_locked);

-- Position history indexes
CREATE INDEX IF NOT EXISTS idx_position_history_user_id ON position_history(user_id);
CREATE INDEX IF NOT EXISTS idx_position_history_symbol ON position_history(symbol);
CREATE INDEX IF NOT EXISTS idx_position_history_exit_timestamp ON position_history(exit_timestamp);
CREATE INDEX IF NOT EXISTS idx_position_history_is_profitable ON position_history(is_profitable);

-- ===================================================================
-- INITIALIZE DATA FOR EXISTING USERS
-- ===================================================================

-- Initialize simulation fields for existing users
UPDATE users 
SET 
  deposited_amount = COALESCE(deposited_amount, balance),
  simulation_start_date = COALESCE(simulation_start_date, created_at),
  last_simulation_update = COALESCE(last_simulation_update, updated_at),
  simulation_active = COALESCE(simulation_active, true)
WHERE deposited_amount IS NULL OR simulation_start_date IS NULL;

-- ===================================================================
-- SUCCESS MESSAGE
-- ===================================================================
DO $$
BEGIN
    RAISE NOTICE '🎉 PRODUCTION DATABASE MIGRATION COMPLETED SUCCESSFULLY!';
    RAISE NOTICE '✅ Created 10 new tables with proper indexes and constraints';
    RAISE NOTICE '✅ Enhanced users table with simulation fields';
    RAISE NOTICE '✅ Initialized existing user data';
    RAISE NOTICE '';
    RAISE NOTICE 'New tables created:';
    RAISE NOTICE '• pending_deposits - Deposit approval workflow';
    RAISE NOTICE '• withdrawals - Enhanced withdrawal tracking';
    RAISE NOTICE '• chat_messages - User-admin chat system';
    RAISE NOTICE '• interest_payments - Interest payment tracking';
    RAISE NOTICE '• demos - Demo request management';
    RAISE NOTICE '• compound_simulations - 12-month simulation plans';
    RAISE NOTICE '• simulation_plans - Monthly simulation details';
    RAISE NOTICE '• daily_trades - Generated trading activity';
    RAISE NOTICE '• user_positions - Current trading positions';
    RAISE NOTICE '• position_history - Historical position data';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 Your production database is now ready!';
END
$$;