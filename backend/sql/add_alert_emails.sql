-- Add missing columns for real-time alert system
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS guardian_email TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS professional_email TEXT;
