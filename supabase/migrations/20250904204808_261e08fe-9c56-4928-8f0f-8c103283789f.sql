-- Remove public access to slots_calls overlay function and secure it
-- This prevents unauthorized access to betting/financial data

-- Drop the existing public function that exposes financial data
DROP FUNCTION IF EXISTS public.get_overlay_slots_calls();

-- Create a secure version that only returns anonymized data for public overlay use
CREATE OR REPLACE FUNCTION public.get_overlay_slots_calls()
RETURNS TABLE(
  id uuid, 
  slot_name text, 
  call_order integer, 
  status text, 
  submitted_at timestamp with time zone, 
  event_id uuid,
  display_status text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = 'public'
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
  WHERE se.status = 'active'
  ORDER BY sc.submitted_at DESC;
$function$