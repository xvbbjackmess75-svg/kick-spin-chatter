-- Update profiles table to better handle Kick account linking
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS linked_kick_user_id text,
ADD COLUMN IF NOT EXISTS linked_kick_username text,
ADD COLUMN IF NOT EXISTS linked_kick_avatar text,
ADD COLUMN IF NOT EXISTS is_kick_hybrid boolean DEFAULT false;

-- Create unique index to prevent multiple profiles linking to same Kick account
CREATE UNIQUE INDEX IF NOT EXISTS profiles_linked_kick_user_id_unique 
ON public.profiles (linked_kick_user_id) 
WHERE linked_kick_user_id IS NOT NULL;

-- Function to link Kick account to existing profile
CREATE OR REPLACE FUNCTION public.link_kick_account_to_profile(
  profile_user_id uuid,
  kick_user_id text,
  kick_username text,
  kick_avatar text
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if this Kick account is already linked to another profile
  IF EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE linked_kick_user_id = kick_user_id 
    AND user_id != profile_user_id
  ) THEN
    RAISE EXCEPTION 'This Kick account is already linked to another user';
  END IF;

  -- Update the profile with Kick account info
  UPDATE public.profiles 
  SET 
    linked_kick_user_id = kick_user_id,
    linked_kick_username = kick_username,
    linked_kick_avatar = kick_avatar,
    is_kick_hybrid = true,
    kick_user_id = kick_user_id,
    kick_username = kick_username,
    updated_at = now()
  WHERE user_id = profile_user_id;

  RETURN FOUND;
END;
$$;