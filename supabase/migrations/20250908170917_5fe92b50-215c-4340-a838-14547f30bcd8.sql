-- Allow public access to bonus hunt overlay data for OBS and unregistered users

-- Public policy for bonus hunt sessions (active only)
CREATE POLICY "Public can view active bonus hunt sessions for overlay"
ON public.bonus_hunt_sessions
FOR SELECT
USING (status = 'active');

-- Public policy for bonus hunt bets (for active sessions only)
CREATE POLICY "Public can view bets for active sessions overlay"
ON public.bonus_hunt_bets  
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.bonus_hunt_sessions 
    WHERE bonus_hunt_sessions.id = bonus_hunt_bets.session_id 
    AND bonus_hunt_sessions.status = 'active'
  )
);

-- Public policy for bonus hunt overlay settings (for users with active sessions)
CREATE POLICY "Public can view overlay settings for active sessions"
ON public.bonus_hunt_overlay_settings
FOR SELECT  
USING (
  EXISTS (
    SELECT 1 FROM public.bonus_hunt_sessions
    WHERE bonus_hunt_sessions.user_id = bonus_hunt_overlay_settings.user_id
    AND bonus_hunt_sessions.status = 'active'
  )
);

-- Public policy for slots data (needed for overlay display)
CREATE POLICY "Public can view slots for overlay"
ON public.slots
FOR SELECT
USING (true);