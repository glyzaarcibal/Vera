-- ==========================================
-- VERA DATABASE SETUP
-- ==========================================

-- 1. Create feedbacks table
CREATE TABLE IF NOT EXISTS feedbacks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('feedback', 'report')),
  rating INTEGER, -- Optional for reports
  description TEXT NOT NULL,
  image_url TEXT,
  status TEXT DEFAULT 'pending', -- pending, resolved, in-progress
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create pending_users table (for 2-step registration with OTP)
CREATE TABLE IF NOT EXISTS pending_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  token TEXT NOT NULL, -- 6-digit code
  user_metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create guardian_codes table (for parental consent)
CREATE TABLE IF NOT EXISTS guardian_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_email TEXT NOT NULL,
  guardian_email TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Update profiles table to include tokens and other fields if NOT exists
-- Run these one by one if preferred
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tokens INTEGER DEFAULT 5;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS birthday DATE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS contact_number TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';

-- Enable RLS (Optional depending on your needs, but recommended)
-- ALTER TABLE feedbacks ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE guardian_codes ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE pending_users ENABLE ROW LEVEL SECURITY;

-- Create Policies (Admin access, User access)
-- Add your policies here...
