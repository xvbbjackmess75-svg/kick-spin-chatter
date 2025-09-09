-- Add Discord account linking fields to profiles table to match Kick linking pattern
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS linked_discord_user_id text,
ADD COLUMN IF NOT EXISTS linked_discord_username text,
ADD COLUMN IF NOT EXISTS linked_discord_avatar text,
ADD COLUMN IF NOT EXISTS linked_discord_discriminator text;