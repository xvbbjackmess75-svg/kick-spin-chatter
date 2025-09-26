-- Create a security definer function to check verification status that bypasses RLS
CREATE OR REPLACE FUNCTION public.check_user_verification_by_kick_username(kick_username_param text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  target_user_id uuid;
  user_role app_role;
BEGIN
  -- Find user_id by kick username (check both fields)
  SELECT user_id INTO target_user_id
  FROM public.profiles 
  WHERE linked_kick_username = kick_username_param 
     OR kick_username = kick_username_param
  LIMIT 1;
  
  -- If no user found, return false
  IF target_user_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Get user role
  SELECT get_user_role(target_user_id) INTO user_role;
  
  -- Return true if user has verified_viewer role
  RETURN user_role = 'verified_viewer';
END;
$function$;