-- Update the public overlay settings policy to include both active and closed events
-- This allows OBS and other tools to access overlay settings without authentication
DROP POLICY IF EXISTS "Public can view overlay settings for active events" ON public.overlay_settings;

CREATE POLICY "Public can view overlay settings for events" 
ON public.overlay_settings 
FOR SELECT 
USING (EXISTS ( 
  SELECT 1
  FROM slots_events
  WHERE ((slots_events.user_id = overlay_settings.user_id) 
    AND (slots_events.status IN ('active', 'closed')))
));