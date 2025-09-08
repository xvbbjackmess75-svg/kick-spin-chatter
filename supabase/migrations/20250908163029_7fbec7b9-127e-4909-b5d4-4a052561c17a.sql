-- Add missing payout columns to bonus_hunt_bets table
ALTER TABLE public.bonus_hunt_bets ADD COLUMN IF NOT EXISTS payout_amount numeric;
ALTER TABLE public.bonus_hunt_bets ADD COLUMN IF NOT EXISTS payout_recorded_at timestamp with time zone;