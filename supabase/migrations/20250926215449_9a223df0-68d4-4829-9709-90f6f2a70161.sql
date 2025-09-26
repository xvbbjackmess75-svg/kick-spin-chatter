-- Drop the complex policy and create a simple public read policy
DROP POLICY IF EXISTS "Public can view overlay settings for events" ON public.overlay_settings;

-- Simple policy: allow public read access to all overlay settings
-- This is safe because overlay settings are meant to be public for streaming
CREATE POLICY "Public can view all overlay settings" 
ON public.overlay_settings 
FOR SELECT 
USING (true);