-- Remove the problematic public access policy for slots_calls that exposes sensitive data
DROP POLICY IF EXISTS "Public can view slots calls for overlay" ON public.slots_calls;

-- Create a secure function for overlay purposes that only exposes non-sensitive data
CREATE OR REPLACE FUNCTION public.get_overlay_slots_calls()
RETURNS TABLE (
  id uuid,
  slot_name text,
  call_order integer,
  status text,
  completed_at timestamp with time zone,
  submitted_at timestamp with time zone,
  event_id uuid,
  display_status text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    sc.id,
    sc.slot_name,
    sc.call_order,
    sc.status,
    sc.completed_at,
    sc.submitted_at,
    sc.event_id,
    -- Only show anonymous call data for overlay - no usernames, user IDs, or financial amounts
    CASE 
      WHEN sc.status = 'completed' THEN 'Completed'
      WHEN sc.status = 'pending' THEN 'Pending'
      ELSE sc.status
    END as display_status
  FROM public.slots_calls sc
  INNER JOIN public.slots_events se ON se.id = sc.event_id
  WHERE se.status = 'active'
  ORDER BY sc.submitted_at DESC;
$$;

-- Grant execute permission to anonymous users for the overlay function
GRANT EXECUTE ON FUNCTION public.get_overlay_slots_calls() TO anon;
GRANT EXECUTE ON FUNCTION public.get_overlay_slots_calls() TO authenticated;