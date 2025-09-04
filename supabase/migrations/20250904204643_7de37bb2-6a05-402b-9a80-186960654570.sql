-- Create a secure function for verifying viewers that prevents role escalation
CREATE OR REPLACE FUNCTION public.verify_viewer(_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Only allow verification if user currently has 'viewer' role
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = _user_id AND role = 'viewer'
  ) THEN
    RAISE EXCEPTION 'User must have viewer role to be verified';
  END IF;

  -- Check if user already has verified_viewer role
  IF EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = _user_id AND role = 'verified_viewer'
  ) THEN
    RETURN true; -- Already verified
  END IF;

  -- Insert verified_viewer role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (_user_id, 'verified_viewer')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN true;
END;
$function$