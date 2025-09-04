-- Add verification tracking to giveaways table
ALTER TABLE giveaways 
ADD COLUMN verified_only boolean DEFAULT false,
ADD COLUMN verified_bonus_chances integer DEFAULT 0;