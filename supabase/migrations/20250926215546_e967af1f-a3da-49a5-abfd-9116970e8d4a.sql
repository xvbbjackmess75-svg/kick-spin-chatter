-- Add public read access to bonus hunt overlay settings
-- Check if policy exists and drop it
DROP POLICY IF EXISTS "Public can view overlay settings for active sessions" ON public.bonus_hunt_overlay_settings;

-- Create simple public read policy for bonus hunt overlay settings
CREATE POLICY "Public can view all bonus hunt overlay settings" 
ON public.bonus_hunt_overlay_settings 
FOR SELECT 
USING (true);