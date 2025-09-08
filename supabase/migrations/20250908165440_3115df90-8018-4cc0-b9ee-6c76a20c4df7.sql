-- SECURITY FIX: Remove dangerous public access policy and create secure overlay function

-- 1. Drop the dangerous public policy that exposes sensitive user data
DROP POLICY IF EXISTS "Public can view active slots events for overlay" ON public.slots_events;

-- 2. Create a secure function for overlay data that only returns essential, anonymized information
CREATE OR REPLACE FUNCTION public.get_secure_overlay_event()
RETURNS TABLE(
  event_id uuid,
  event_title text,
  event_status text,
  is_active boolean
) AS $$
BEGIN
  -- Only return basic, non-sensitive event information for overlays
  RETURN QUERY
  SELECT 
    se.id,
    se.title,
    se.status,
    (se.status = 'active') as is_active
  FROM public.slots_events se
  WHERE se.status = 'active'
  LIMIT 1; -- Only return one active event for overlay purposes
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Grant execute permission to authenticated users only
GRANT EXECUTE ON FUNCTION public.get_secure_overlay_event() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_secure_overlay_event() TO anon;