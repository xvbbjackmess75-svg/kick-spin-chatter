-- Update the get_secure_overlay_event function to filter by user and get their latest event
CREATE OR REPLACE FUNCTION public.get_secure_overlay_event(target_user_id uuid DEFAULT NULL)
 RETURNS TABLE(event_id uuid, event_title text, event_status text, event_bet_size numeric, is_active boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Return basic event information including bet size for overlay display
  -- Filter by user if specified, otherwise return any active/closed event
  RETURN QUERY
  SELECT 
    se.id,
    se.title,
    se.status,
    se.bet_size,
    (se.status IN ('active', 'closed')) as is_active
  FROM public.slots_events se
  WHERE se.status IN ('active', 'closed')
  AND (target_user_id IS NULL OR se.user_id = target_user_id)
  ORDER BY 
    CASE WHEN se.status = 'active' THEN 1 ELSE 2 END,
    se.updated_at DESC
  LIMIT 1;
END;
$function$