-- Fix the search_path security issue for the function
DROP FUNCTION IF EXISTS public.get_current_user_id();

CREATE OR REPLACE FUNCTION public.get_current_user_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  -- For now, just return auth.uid() - we'll handle Kick users at the application level
  SELECT auth.uid();
$$;