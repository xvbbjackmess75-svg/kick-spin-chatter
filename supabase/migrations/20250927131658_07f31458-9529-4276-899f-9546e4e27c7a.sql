-- Add Twitter/X account linking fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN linked_twitter_user_id text,
ADD COLUMN linked_twitter_username text,
ADD COLUMN linked_twitter_display_name text,
ADD COLUMN linked_twitter_avatar text;