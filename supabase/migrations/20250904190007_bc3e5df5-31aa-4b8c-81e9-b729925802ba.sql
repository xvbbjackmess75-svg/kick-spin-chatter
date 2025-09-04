-- Add verification tracking to participants
ALTER TABLE giveaway_participants 
ADD COLUMN is_verified boolean DEFAULT false,
ADD COLUMN referral_link text,
ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;