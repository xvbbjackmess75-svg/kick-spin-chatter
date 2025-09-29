-- Add new columns to profiles table for the new authentication system
ALTER TABLE public.profiles 
ADD COLUMN initial_role_selected boolean DEFAULT false,
ADD COLUMN account_type text CHECK (account_type IN ('viewer', 'streamer')),
ADD COLUMN verification_status jsonb DEFAULT '{"kick_linked": false, "discord_linked": false, "twitter_linked": false}'::jsonb;

-- Create function to automatically upgrade streamer to verified_streamer when requirements are met
CREATE OR REPLACE FUNCTION public.check_and_upgrade_streamer_verification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Only check for streamers who haven't been verified yet
  IF NEW.account_type = 'streamer' AND OLD.verification_status IS DISTINCT FROM NEW.verification_status THEN
    -- Check if streamer has Discord and Twitter linked
    IF (NEW.verification_status->>'discord_linked')::boolean = true 
       AND (NEW.verification_status->>'twitter_linked')::boolean = true 
       AND (NEW.verification_status->>'kick_linked')::boolean = true THEN
      
      -- Check if user already has verified_streamer role
      IF NOT EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = NEW.user_id AND role = 'verified_streamer'
      ) THEN
        -- Add verified_streamer role
        INSERT INTO public.user_roles (user_id, role)
        VALUES (NEW.user_id, 'verified_streamer')
        ON CONFLICT (user_id, role) DO NOTHING;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for automatic streamer verification
CREATE TRIGGER trigger_check_streamer_verification
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.check_and_upgrade_streamer_verification();

-- Create function to get verification status for a user
CREATE OR REPLACE FUNCTION public.get_user_verification_status(_user_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT COALESCE(
    jsonb_build_object(
      'kick_linked', (linked_kick_user_id IS NOT NULL),
      'discord_linked', (linked_discord_user_id IS NOT NULL),
      'twitter_linked', (linked_twitter_user_id IS NOT NULL),
      'is_verified_viewer', EXISTS(SELECT 1 FROM user_roles WHERE user_id = _user_id AND role = 'verified_viewer'),
      'is_verified_streamer', EXISTS(SELECT 1 FROM user_roles WHERE user_id = _user_id AND role = 'verified_streamer'),
      'account_type', account_type
    ),
    '{}'::jsonb
  )
  FROM public.profiles
  WHERE user_id = _user_id;
$$;