-- Add kick_channel_id to profiles table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='profiles' AND column_name='kick_channel_id') THEN
        ALTER TABLE public.profiles ADD COLUMN kick_channel_id text;
    END IF;
END $$;