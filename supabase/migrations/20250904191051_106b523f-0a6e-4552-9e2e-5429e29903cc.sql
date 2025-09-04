-- Remove the problematic public access policy for slots_calls
DROP POLICY IF EXISTS "Public can view slots calls for overlay" ON public.slots_calls;

-- Create a secure view for overlay purposes that only exposes non-sensitive data
CREATE OR REPLACE VIEW public.slots_calls_overlay AS
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
WHERE se.status = 'active';

-- Enable RLS on the view
ALTER VIEW public.slots_calls_overlay SET (security_invoker = on);

-- Create policy for overlay view - allow public read access to non-sensitive data only
CREATE POLICY "Public can view anonymous overlay data" 
ON public.slots_calls_overlay
FOR SELECT 
USING (true);

-- Grant usage on the view to anonymous users
GRANT SELECT ON public.slots_calls_overlay TO anon;