-- Add bonus opening phase support to bonus hunt sessions
ALTER TABLE bonus_hunt_sessions 
ADD COLUMN bonus_opening_phase boolean DEFAULT false,
ADD COLUMN bonus_opening_started_at timestamp with time zone;

-- Update bonus hunt bets to support payout recording
ALTER TABLE bonus_hunt_bets 
ADD COLUMN payout_amount numeric,
ADD COLUMN payout_recorded_at timestamp with time zone;

-- Create bonus hunt overlay settings table
CREATE TABLE bonus_hunt_overlay_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  background_color text DEFAULT 'rgba(0, 0, 0, 0.95)',
  border_color text DEFAULT 'hsl(var(--primary))',
  text_color text DEFAULT 'hsl(var(--foreground))',
  accent_color text DEFAULT 'hsl(var(--primary))',
  font_size text DEFAULT 'medium',
  max_visible_bonuses integer DEFAULT 5,
  scrolling_speed integer DEFAULT 50,
  show_background boolean DEFAULT true,
  show_borders boolean DEFAULT true,
  animation_enabled boolean DEFAULT true,
  show_upcoming_bonuses boolean DEFAULT true,
  show_top_multipliers boolean DEFAULT true,
  show_expected_payouts boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on bonus hunt overlay settings
ALTER TABLE bonus_hunt_overlay_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for bonus hunt overlay settings
CREATE POLICY "Users can view their own overlay settings" 
ON bonus_hunt_overlay_settings 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own overlay settings" 
ON bonus_hunt_overlay_settings 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own overlay settings" 
ON bonus_hunt_overlay_settings 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_bonus_hunt_overlay_settings_updated_at
BEFORE UPDATE ON bonus_hunt_overlay_settings
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();