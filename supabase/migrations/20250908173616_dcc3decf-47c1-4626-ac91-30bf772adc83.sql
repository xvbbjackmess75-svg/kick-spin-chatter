-- Update the get_overlay_slots_calls function to include calls from both active and closed events
CREATE OR REPLACE FUNCTION public.get_overlay_slots_calls()
 RETURNS TABLE(id uuid, slot_name text, call_order integer, status text, submitted_at timestamp with time zone, event_id uuid, display_status text)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT 
    sc.id,
    sc.slot_name,
    sc.call_order,
    sc.status,
    sc.submitted_at,
    sc.event_id,
    -- Only show anonymous status for overlay - no financial data
    CASE 
      WHEN sc.status = 'completed' THEN 'Completed'
      WHEN sc.status = 'pending' THEN 'Pending'
      ELSE sc.status
    END as display_status
  FROM public.slots_calls sc
  INNER JOIN public.slots_events se ON se.id = sc.event_id
  WHERE se.status IN ('active', 'closed')  -- Include both active and closed events
  ORDER BY sc.submitted_at DESC;
$function$;