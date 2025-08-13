-- Migration for Crypto Trading Simulation System
-- Adds comprehensive simulation tracking with monthly targets and daily distribution

-- =========================================
-- ENHANCED USER TABLE FOR SIMULATION
-- =========================================

-- Add simulation fields to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS deposited_amount DECIMAL(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS simulated_interest DECIMAL(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS current_monthly_target DECIMAL(8,4) DEFAULT 0,
ADD COLUMN IF NOT EXISTS simulation_start_date DATE,
ADD COLUMN IF NOT EXISTS last_simulation_update TIMESTAMP DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS simulation_active BOOLEAN DEFAULT true;

-- Update existing users to have proper initial values
UPDATE users 
SET deposited_amount = balance, 
    simulated_interest = 0,
    simulation_start_date = CURRENT_DATE
WHERE deposited_amount IS NULL OR deposited_amount = 0;

-- =========================================
-- MONTHLY SIMULATION TARGETS
-- =========================================

CREATE TABLE IF NOT EXISTS monthly_simulation_targets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  target_percentage DECIMAL(8,4) NOT NULL, -- e.g., 0.18 for 18%
  starting_balance DECIMAL(15,2) NOT NULL,
  target_amount DECIMAL(15,2) NOT NULL,
  achieved_amount DECIMAL(15,2) DEFAULT 0,
  days_in_month INTEGER NOT NULL,
  status VARCHAR(50) DEFAULT 'active', -- active, completed, paused
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, year, month)
);

-- =========================================
-- DAILY SIMULATION RECORDS
-- =========================================

CREATE TABLE IF NOT EXISTS daily_simulation_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  monthly_target_id UUID REFERENCES monthly_simulation_targets(id) ON DELETE CASCADE,
  simulation_date DATE NOT NULL,
  daily_target_amount DECIMAL(15,2) NOT NULL,
  achieved_amount DECIMAL(15,2) DEFAULT 0,
  number_of_trades INTEGER DEFAULT 0,
  largest_win DECIMAL(15,2) DEFAULT 0,
  largest_loss DECIMAL(15,2) DEFAULT 0,
  win_rate DECIMAL(5,2) DEFAULT 0, -- percentage as decimal
  status VARCHAR(50) DEFAULT 'pending', -- pending, completed, skipped
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, simulation_date)
);

-- =========================================
-- SIMULATED TRADES
-- =========================================

CREATE TABLE IF NOT EXISTS simulated_trades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  daily_record_id UUID REFERENCES daily_simulation_records(id) ON DELETE CASCADE,
  trade_type VARCHAR(50) NOT NULL, -- 'buy', 'sell', 'close'
  crypto_symbol VARCHAR(10) NOT NULL, -- BTC, ETH, ADA, etc.
  crypto_name VARCHAR(50) NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  entry_price DECIMAL(15,2),
  exit_price DECIMAL(15,2),
  profit_loss DECIMAL(15,2) NOT NULL,
  trade_duration_minutes INTEGER,
  trade_timestamp TIMESTAMP NOT NULL,
  status VARCHAR(50) DEFAULT 'completed',
  created_at TIMESTAMP DEFAULT NOW()
);

-- =========================================
-- SIMULATION PARAMETERS (ADMIN CONTROL)
-- =========================================

CREATE TABLE IF NOT EXISTS simulation_parameters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parameter_name VARCHAR(100) UNIQUE NOT NULL,
  parameter_value TEXT NOT NULL,
  parameter_type VARCHAR(50) NOT NULL, -- 'number', 'boolean', 'string', 'json'
  description TEXT,
  updated_by UUID REFERENCES users(id),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert default simulation parameters
INSERT INTO simulation_parameters (parameter_name, parameter_value, parameter_type, description) 
VALUES 
  ('min_monthly_target', '0.15', 'number', 'Minimum monthly target percentage (15%)'),
  ('max_monthly_target', '0.21', 'number', 'Maximum monthly target percentage (21%)'),
  ('min_daily_trades', '3', 'number', 'Minimum trades per day'),
  ('max_daily_trades', '8', 'number', 'Maximum trades per day'),
  ('win_rate_min', '0.60', 'number', 'Minimum win rate (60%)'),
  ('win_rate_max', '0.85', 'number', 'Maximum win rate (85%)'),
  ('crypto_symbols', '["BTC", "ETH", "ADA", "SOL", "DOT", "LINK", "UNI", "AAVE"]', 'json', 'Available crypto symbols for simulation'),
  ('simulation_enabled', 'true', 'boolean', 'Global simulation system toggle'),
  ('weekend_trading', 'false', 'boolean', 'Whether to simulate trades on weekends')
ON CONFLICT (parameter_name) DO NOTHING;

-- =========================================
-- SIMULATION ANALYTICS
-- =========================================

CREATE TABLE IF NOT EXISTS simulation_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  analytics_date DATE NOT NULL,
  total_simulated_profit DECIMAL(15,2) DEFAULT 0,
  total_trades INTEGER DEFAULT 0,
  successful_trades INTEGER DEFAULT 0,
  average_win_amount DECIMAL(15,2) DEFAULT 0,
  average_loss_amount DECIMAL(15,2) DEFAULT 0,
  best_performing_crypto VARCHAR(10),
  monthly_performance_vs_target DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, analytics_date)
);

-- =========================================
-- INDEXES FOR PERFORMANCE
-- =========================================

CREATE INDEX IF NOT EXISTS idx_monthly_targets_user_date ON monthly_simulation_targets(user_id, year, month);
CREATE INDEX IF NOT EXISTS idx_daily_records_user_date ON daily_simulation_records(user_id, simulation_date);
CREATE INDEX IF NOT EXISTS idx_simulated_trades_user_date ON simulated_trades(user_id, trade_timestamp);
CREATE INDEX IF NOT EXISTS idx_simulated_trades_daily_record ON simulated_trades(daily_record_id);
CREATE INDEX IF NOT EXISTS idx_simulation_analytics_user_date ON simulation_analytics(user_id, analytics_date);

-- =========================================
-- VIEWS FOR EASY QUERYING
-- =========================================

-- User simulation summary view
CREATE OR REPLACE VIEW user_simulation_summary AS
SELECT 
  u.id as user_id,
  u.email,
  u.deposited_amount,
  u.simulated_interest,
  u.balance as total_balance,
  u.current_monthly_target,
  u.simulation_active,
  COALESCE(mst.target_percentage, 0) as current_month_target_percentage,
  COALESCE(mst.achieved_amount, 0) as current_month_achieved,
  COALESCE(mst.target_amount, 0) as current_month_target_amount,
  CASE 
    WHEN mst.target_amount > 0 THEN (mst.achieved_amount / mst.target_amount * 100)
    ELSE 0 
  END as current_month_progress_percentage
FROM users u
LEFT JOIN monthly_simulation_targets mst ON 
  u.id = mst.user_id 
  AND mst.year = EXTRACT(YEAR FROM CURRENT_DATE)
  AND mst.month = EXTRACT(MONTH FROM CURRENT_DATE)
  AND mst.status = 'active'
WHERE u.role = 'user';

-- Recent trading activity view
CREATE OR REPLACE VIEW recent_trading_activity AS
SELECT 
  st.id,
  st.user_id,
  u.email as user_email,
  st.crypto_symbol,
  st.crypto_name,
  st.profit_loss,
  st.trade_timestamp,
  st.trade_type,
  dr.simulation_date
FROM simulated_trades st
JOIN users u ON st.user_id = u.id
JOIN daily_simulation_records dr ON st.daily_record_id = dr.id
WHERE st.trade_timestamp >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY st.trade_timestamp DESC;

-- =========================================
-- FUNCTIONS FOR SIMULATION LOGIC
-- =========================================

-- Function to calculate user's total simulated balance
CREATE OR REPLACE FUNCTION get_user_total_balance(user_uuid UUID)
RETURNS DECIMAL(15,2) AS $$
BEGIN
  RETURN (
    SELECT COALESCE(deposited_amount, 0) + COALESCE(simulated_interest, 0)
    FROM users 
    WHERE id = user_uuid
  );
END;
$$ LANGUAGE plpgsql;

-- Function to get current month simulation progress
CREATE OR REPLACE FUNCTION get_current_month_progress(user_uuid UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'target_percentage', COALESCE(target_percentage, 0),
    'target_amount', COALESCE(target_amount, 0),
    'achieved_amount', COALESCE(achieved_amount, 0),
    'progress_percentage', 
      CASE 
        WHEN target_amount > 0 THEN (achieved_amount / target_amount * 100)
        ELSE 0 
      END,
    'days_remaining', 
      EXTRACT(DAY FROM (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')) - EXTRACT(DAY FROM CURRENT_DATE)
  ) INTO result
  FROM monthly_simulation_targets
  WHERE user_id = user_uuid 
    AND year = EXTRACT(YEAR FROM CURRENT_DATE)
    AND month = EXTRACT(MONTH FROM CURRENT_DATE)
    AND status = 'active';
    
  RETURN COALESCE(result, '{"target_percentage": 0, "target_amount": 0, "achieved_amount": 0, "progress_percentage": 0, "days_remaining": 0}'::json);
END;
$$ LANGUAGE plpgsql;

-- =========================================
-- TRIGGERS FOR MAINTAINING DATA INTEGRITY
-- =========================================

-- Update user's total balance when simulated_interest changes
CREATE OR REPLACE FUNCTION update_user_balance()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE users 
  SET balance = deposited_amount + simulated_interest,
      last_simulation_update = NOW()
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for simulated_interest updates
DROP TRIGGER IF EXISTS trigger_update_balance_on_simulation ON daily_simulation_records;
CREATE TRIGGER trigger_update_balance_on_simulation
  AFTER INSERT OR UPDATE ON daily_simulation_records
  FOR EACH ROW
  EXECUTE FUNCTION update_user_balance();

-- Trigger to update monthly target achieved amount
CREATE OR REPLACE FUNCTION update_monthly_target_progress()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE monthly_simulation_targets 
  SET achieved_amount = (
    SELECT COALESCE(SUM(achieved_amount), 0)
    FROM daily_simulation_records 
    WHERE monthly_target_id = NEW.monthly_target_id
  ),
  updated_at = NOW()
  WHERE id = NEW.monthly_target_id;
  
  -- Update user's simulated_interest
  UPDATE users 
  SET simulated_interest = (
    SELECT COALESCE(SUM(achieved_amount), 0)
    FROM daily_simulation_records 
    WHERE user_id = NEW.user_id 
    AND simulation_date >= DATE_TRUNC('month', CURRENT_DATE)
  )
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_monthly_progress
  AFTER INSERT OR UPDATE ON daily_simulation_records
  FOR EACH ROW
  EXECUTE FUNCTION update_monthly_target_progress();

-- =========================================
-- INITIAL DATA MIGRATION
-- =========================================

-- Update the existing interest_payments table to work with new system
ALTER TABLE interest_payments 
ADD COLUMN IF NOT EXISTS simulation_type VARCHAR(50) DEFAULT 'legacy',
ADD COLUMN IF NOT EXISTS daily_record_id UUID REFERENCES daily_simulation_records(id);

-- Create index for new foreign key
CREATE INDEX IF NOT EXISTS idx_interest_payments_daily_record ON interest_payments(daily_record_id);

COMMIT;