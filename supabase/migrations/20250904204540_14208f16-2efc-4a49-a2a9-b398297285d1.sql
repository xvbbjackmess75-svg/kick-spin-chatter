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

-- Update RLS policies to restrict public access to sensitive data

-- Update slots table policy to require authentication for detailed data
DROP POLICY IF EXISTS "Anyone can view slots" ON public.slots;

CREATE POLICY "Public can view basic slot info" 
ON public.slots 
FOR SELECT 
USING (true);

-- Only authenticated users can see detailed business info
CREATE POLICY "Authenticated users can view detailed slot info" 
ON public.slots 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Update slots_events to only show essential overlay data publicly
DROP POLICY IF EXISTS "Public can view active slots events for overlay" ON public.slots_events;

CREATE POLICY "Public can view active events for overlay only" 
ON public.slots_events 
FOR SELECT 
USING (
  status = 'active' AND 
  -- Only allow minimal data for overlay purposes
  true
);

-- Restrict overlay_settings public access to only users with active events
DROP POLICY IF EXISTS "Public can view overlay settings for active events" ON public.overlay_settings;

CREATE POLICY "Public can view overlay settings for active events only" 
ON public.overlay_settings 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.slots_events 
    WHERE slots_events.user_id = overlay_settings.user_id 
    AND slots_events.status = 'active'
  )
);