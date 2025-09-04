-- Fix ambiguous column reference in link_kick_account_to_profile function
DROP FUNCTION IF EXISTS public.link_kick_account_to_profile(uuid, text, text, text);

-- Recreate the function with proper column qualification to avoid ambiguity
CREATE OR REPLACE FUNCTION public.link_kick_account_to_profile(
  profile_user_id uuid, 
  kick_user_id text, 
  kick_username text, 
  kick_avatar text
)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
BEGIN
  -- Check if this Kick account is already linked to another profile
  IF EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.linked_kick_user_id = link_kick_account_to_profile.kick_user_id 
    AND profiles.user_id != link_kick_account_to_profile.profile_user_id
  ) THEN
    -- Remove the Kick account from the old profile
    UPDATE public.profiles 
    SET 
      linked_kick_user_id = null,
      linked_kick_username = null,
      linked_kick_avatar = null,
      is_kick_hybrid = false,
      kick_user_id = null,
      kick_username = null,
      updated_at = now()
    WHERE profiles.linked_kick_user_id = link_kick_account_to_profile.kick_user_id 
    AND profiles.user_id != link_kick_account_to_profile.profile_user_id;
    
    -- Also clear old format if it exists
    UPDATE public.profiles 
    SET 
      kick_user_id = null,
      kick_username = null,
      updated_at = now()
    WHERE profiles.kick_user_id = link_kick_account_to_profile.kick_user_id 
    AND profiles.user_id != link_kick_account_to_profile.profile_user_id;
  END IF;

  -- Update the profile with Kick account info
  UPDATE public.profiles 
  SET 
    linked_kick_user_id = link_kick_account_to_profile.kick_user_id,
    linked_kick_username = link_kick_account_to_profile.kick_username,
    linked_kick_avatar = link_kick_account_to_profile.kick_avatar,
    is_kick_hybrid = true,
    kick_user_id = link_kick_account_to_profile.kick_user_id,
    kick_username = link_kick_account_to_profile.kick_username,
    updated_at = now()
  WHERE profiles.user_id = link_kick_account_to_profile.profile_user_id;

  RETURN FOUND;
END;
$$;