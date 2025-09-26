-- Create default overlay_settings for users who don't have them
INSERT INTO public.overlay_settings (user_id)
SELECT DISTINCT se.user_id
FROM public.slots_events se
LEFT JOIN public.overlay_settings os ON se.user_id = os.user_id
WHERE os.user_id IS NULL
  AND se.status = 'active'
ON CONFLICT (user_id) DO NOTHING;