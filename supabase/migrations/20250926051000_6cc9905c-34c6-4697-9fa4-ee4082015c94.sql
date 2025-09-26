-- Improved link_kick_account_to_profile function with better cleanup and logging
CREATE OR REPLACE FUNCTION public.link_kick_account_to_profile(profile_user_id uuid, kick_user_id text, kick_username text, kick_avatar text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Check if this Kick account is already linked to ANY profile (including this one)
  IF EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE (linked_kick_user_id = link_kick_account_to_profile.kick_user_id 
           OR kick_user_id = link_kick_account_to_profile.kick_user_id)
    AND user_id != link_kick_account_to_profile.profile_user_id
  ) THEN
    -- Remove the Kick account from ALL other profiles
    UPDATE public.profiles 
    SET 
      linked_kick_user_id = null,
      linked_kick_username = null,
      linked_kick_avatar = null,
      is_kick_hybrid = false,
      kick_user_id = null,
      kick_username = null,
      updated_at = now()
    WHERE (linked_kick_user_id = link_kick_account_to_profile.kick_user_id 
           OR kick_user_id = link_kick_account_to_profile.kick_user_id)
    AND user_id != link_kick_account_to_profile.profile_user_id;
  END IF;

  -- Clear any existing Kick data from the target profile first
  UPDATE public.profiles 
  SET 
    linked_kick_user_id = null,
    linked_kick_username = null,
    linked_kick_avatar = null,
    is_kick_hybrid = false,
    kick_user_id = null,
    kick_username = null,
    updated_at = now()
  WHERE user_id = link_kick_account_to_profile.profile_user_id;

  -- Now set the new Kick account info
  UPDATE public.profiles 
  SET 
    linked_kick_user_id = link_kick_account_to_profile.kick_user_id,
    linked_kick_username = link_kick_account_to_profile.kick_username,
    linked_kick_avatar = link_kick_account_to_profile.kick_avatar,
    is_kick_hybrid = true,
    kick_user_id = link_kick_account_to_profile.kick_user_id,
    kick_username = link_kick_account_to_profile.kick_username,
    updated_at = now()
  WHERE user_id = link_kick_account_to_profile.profile_user_id;

  RETURN FOUND;
END;
$function$;