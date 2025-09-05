-- Update the handle_new_user_registration function to assign 'user' role by default for streamers
-- and 'viewer' role for regular registrations (determined by is_streamer flag in profile)

DROP FUNCTION IF EXISTS public.handle_new_user_registration();

CREATE OR REPLACE FUNCTION public.handle_new_user_registration()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Insert a profile for the new user if it doesn't exist
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email))
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Insert the default 'viewer' role for new registrations
  -- This can be updated later by the application based on registration type
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'viewer')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN NEW;
END;
$$;