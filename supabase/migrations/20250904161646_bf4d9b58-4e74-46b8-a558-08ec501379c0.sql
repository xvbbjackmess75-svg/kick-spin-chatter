-- Create public read policies for overlay functionality
-- Allow public access to view active slots events for overlay
CREATE POLICY "Public can view active slots events for overlay" 
ON public.slots_events 
FOR SELECT 
USING (status = 'active');

-- Allow public access to view slots calls for overlay
CREATE POLICY "Public can view slots calls for overlay" 
ON public.slots_calls 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM slots_events 
    WHERE slots_events.id = slots_calls.event_id 
    AND slots_events.status = 'active'
  )
);

-- Allow public access to view overlay settings for active events
CREATE POLICY "Public can view overlay settings for active events" 
ON public.overlay_settings 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM slots_events 
    WHERE slots_events.user_id = overlay_settings.user_id 
    AND slots_events.status = 'active'
  )
);