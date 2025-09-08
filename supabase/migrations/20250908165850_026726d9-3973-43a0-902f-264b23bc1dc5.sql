-- Fix overlay functionality - drop and recreate function with proper return type

-- Drop existing function
DROP FUNCTION IF EXISTS public.get_secure_overlay_event();

-- Create policy for overlay access to active events only
CREATE POLICY "Public overlay access to active events" ON public.slots_events
FOR SELECT 
USING (status = 'active');

-- Recreate function with bet_size included for overlay display
CREATE OR REPLACE FUNCTION public.get_secure_overlay_event()
RETURNS TABLE(
  event_id uuid,
  event_title text,
  event_status text,
  event_bet_size numeric,
  is_active boolean
) AS $$
BEGIN
  -- Return basic event information including bet size for overlay display
  RETURN QUERY
  SELECT 
    se.id,
    se.title,
    se.status,
    se.bet_size,
    (se.status = 'active') as is_active
  FROM public.slots_events se
  WHERE se.status = 'active'
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_secure_overlay_event() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_secure_overlay_event() TO anon;