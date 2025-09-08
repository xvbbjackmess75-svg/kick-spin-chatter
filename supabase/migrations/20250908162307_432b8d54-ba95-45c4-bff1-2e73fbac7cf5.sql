-- Add bonus_opening_phase column to bonus_hunt_sessions table
ALTER TABLE public.bonus_hunt_sessions ADD COLUMN IF NOT EXISTS bonus_opening_phase boolean DEFAULT false;