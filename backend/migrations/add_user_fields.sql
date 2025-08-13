-- Migration to add user profile and simulation fields to users table
-- Run this if you're using PostgreSQL in production

-- Add user profile columns
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS first_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS last_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS phone VARCHAR(20);

-- Add simulation system columns
ALTER TABLE users
ADD COLUMN IF NOT EXISTS deposited_amount DECIMAL(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS simulated_interest DECIMAL(15,8) DEFAULT 0,
ADD COLUMN IF NOT EXISTS current_monthly_target DECIMAL(15,8) DEFAULT 0,
ADD COLUMN IF NOT EXISTS simulation_start_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS last_simulation_update TIMESTAMP,
ADD COLUMN IF NOT EXISTS simulation_active BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS current_plan VARCHAR(50) DEFAULT 'basic';

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_simulation_active ON users(simulation_active);
CREATE INDEX IF NOT EXISTS idx_users_current_plan ON users(current_plan);

-- Initialize simulation fields for existing users
UPDATE users 
SET 
  deposited_amount = COALESCE(deposited_amount, balance),
  simulation_start_date = COALESCE(simulation_start_date, created_at),
  last_simulation_update = COALESCE(last_simulation_update, updated_at)
WHERE deposited_amount IS NULL OR simulation_start_date IS NULL;