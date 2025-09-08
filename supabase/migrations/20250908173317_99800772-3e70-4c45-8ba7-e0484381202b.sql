-- Update the get_secure_overlay_event function to include both active and closed events
CREATE OR REPLACE FUNCTION public.get_secure_overlay_event()
 RETURNS TABLE(event_id uuid, event_title text, event_status text, event_bet_size numeric, is_active boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Return basic event information including bet size for overlay display
  -- Include both active (for accepting entries) and closed (for overlay display) events
  RETURN QUERY
  SELECT 
    se.id,
    se.title,
    se.status,
    se.bet_size,
    (se.status IN ('active', 'closed')) as is_active
  FROM public.slots_events se
  WHERE se.status IN ('active', 'closed')
  ORDER BY 
    CASE WHEN se.status = 'closed' THEN 1 ELSE 2 END,
    se.updated_at DESC
  LIMIT 1;
END;
$function$