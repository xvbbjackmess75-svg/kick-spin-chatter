-- Add scrolling speed setting to overlay_settings table
ALTER TABLE public.overlay_settings 
ADD COLUMN scrolling_speed integer DEFAULT 50 CHECK (scrolling_speed >= 10 AND scrolling_speed <= 500);