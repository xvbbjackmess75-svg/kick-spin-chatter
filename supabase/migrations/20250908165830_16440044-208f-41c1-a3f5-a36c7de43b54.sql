-- Restore overlay functionality for OBS/streaming while keeping data secure
-- Create a policy that allows public access to active events for overlay purposes only

CREATE POLICY "Public overlay access to active events" ON public.slots_events
FOR SELECT 
USING (status = 'active');

-- Update the secure overlay function to include bet_size for display purposes
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