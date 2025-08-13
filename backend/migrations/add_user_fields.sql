-- Migration to add first_name, last_name, and phone columns to users table
-- Run this if you're using PostgreSQL in production

-- Add new columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS first_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS last_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS phone VARCHAR(20);

-- Create index on phone for faster lookups (optional)
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);

-- Update existing users with placeholder data (optional - you may want to handle this differently)
-- UPDATE users SET first_name = 'User', last_name = 'Name' WHERE first_name IS NULL;