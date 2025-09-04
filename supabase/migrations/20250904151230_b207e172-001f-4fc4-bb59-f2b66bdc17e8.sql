-- Add overlay customization settings table
CREATE TABLE public.overlay_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  background_color text DEFAULT 'rgba(0, 0, 0, 0.95)',
  border_color text DEFAULT 'hsl(var(--primary))',
  text_color text DEFAULT 'hsl(var(--foreground))',
  accent_color text DEFAULT 'hsl(var(--primary))',
  font_size text DEFAULT 'medium',
  max_visible_calls integer DEFAULT 10,
  show_background boolean DEFAULT true,
  show_borders boolean DEFAULT true,
  animation_enabled boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.overlay_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies for overlay_settings
CREATE POLICY "Users can view their own overlay settings" 
ON public.overlay_settings 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own overlay settings" 
ON public.overlay_settings 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own overlay settings" 
ON public.overlay_settings 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own overlay settings" 
ON public.overlay_settings 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_overlay_settings_updated_at
BEFORE UPDATE ON public.overlay_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for performance
CREATE INDEX idx_overlay_settings_user_id ON public.overlay_settings(user_id);

-- Function to close all other active events when creating a new one
CREATE OR REPLACE FUNCTION public.close_other_active_events()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If this is a new active event, close all other active events for this user
  IF NEW.status = 'active' THEN
    UPDATE public.slots_events 
    SET status = 'closed', updated_at = now()
    WHERE user_id = NEW.user_id 
    AND status = 'active' 
    AND id != NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to ensure only one active event per user
CREATE TRIGGER ensure_single_active_event
AFTER INSERT OR UPDATE ON public.slots_events
FOR EACH ROW
EXECUTE FUNCTION public.close_other_active_events();