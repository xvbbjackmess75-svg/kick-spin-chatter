-- Create bonus hunt sessions table
CREATE TABLE public.bonus_hunt_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  session_name TEXT,
  starting_balance DECIMAL(10,2) NOT NULL,
  current_balance DECIMAL(10,2) NOT NULL,
  target_bonuses INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create slots database table
CREATE TABLE public.slots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  provider TEXT NOT NULL,
  rtp DECIMAL(5,2),
  max_multiplier INTEGER,
  theme TEXT,
  is_user_added BOOLEAN DEFAULT false,
  added_by_user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create bonus hunt bets table
CREATE TABLE public.bonus_hunt_bets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL,
  slot_id UUID NOT NULL,
  bet_size DECIMAL(10,2) NOT NULL,
  starting_balance DECIMAL(10,2) NOT NULL,
  ending_balance DECIMAL(10,2) NOT NULL,
  bonus_multiplier DECIMAL(8,2),
  pnl DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create bonus hunt overlay settings table
CREATE TABLE public.bonus_hunt_overlay_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  show_upcoming_bonuses BOOLEAN DEFAULT true,
  show_top_multipliers BOOLEAN DEFAULT true,
  show_expected_payouts BOOLEAN DEFAULT true,
  max_visible_bonuses INTEGER DEFAULT 5,
  background_color TEXT DEFAULT 'rgba(0, 0, 0, 0.95)',
  text_color TEXT DEFAULT 'hsl(var(--foreground))',
  accent_color TEXT DEFAULT 'hsl(var(--primary))',
  font_size TEXT DEFAULT 'medium',
  animation_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bonus_hunt_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bonus_hunt_bets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bonus_hunt_overlay_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for bonus_hunt_sessions
CREATE POLICY "Users can view their own sessions" ON public.bonus_hunt_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own sessions" ON public.bonus_hunt_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions" ON public.bonus_hunt_sessions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sessions" ON public.bonus_hunt_sessions
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for slots (public read, authenticated users can add)
CREATE POLICY "Anyone can view slots" ON public.slots
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can add slots" ON public.slots
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update slots they added" ON public.slots
  FOR UPDATE USING (auth.uid() = added_by_user_id OR added_by_user_id IS NULL);

-- RLS Policies for bonus_hunt_bets
CREATE POLICY "Users can view bets from their sessions" ON public.bonus_hunt_bets
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.bonus_hunt_sessions 
    WHERE bonus_hunt_sessions.id = bonus_hunt_bets.session_id 
    AND bonus_hunt_sessions.user_id = auth.uid()
  ));

CREATE POLICY "Users can create bets for their sessions" ON public.bonus_hunt_bets
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM public.bonus_hunt_sessions 
    WHERE bonus_hunt_sessions.id = bonus_hunt_bets.session_id 
    AND bonus_hunt_sessions.user_id = auth.uid()
  ));

CREATE POLICY "Users can update bets from their sessions" ON public.bonus_hunt_bets
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM public.bonus_hunt_sessions 
    WHERE bonus_hunt_sessions.id = bonus_hunt_bets.session_id 
    AND bonus_hunt_sessions.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete bets from their sessions" ON public.bonus_hunt_bets
  FOR DELETE USING (EXISTS (
    SELECT 1 FROM public.bonus_hunt_sessions 
    WHERE bonus_hunt_sessions.id = bonus_hunt_bets.session_id 
    AND bonus_hunt_sessions.user_id = auth.uid()
  ));

-- RLS Policies for bonus_hunt_overlay_settings
CREATE POLICY "Users can view their own overlay settings" ON public.bonus_hunt_overlay_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own overlay settings" ON public.bonus_hunt_overlay_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own overlay settings" ON public.bonus_hunt_overlay_settings
  FOR UPDATE USING (auth.uid() = user_id);

-- Create triggers for updated_at
CREATE TRIGGER update_bonus_hunt_sessions_updated_at
  BEFORE UPDATE ON public.bonus_hunt_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_slots_updated_at
  BEFORE UPDATE ON public.slots
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bonus_hunt_overlay_settings_updated_at
  BEFORE UPDATE ON public.bonus_hunt_overlay_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some sample slots data
INSERT INTO public.slots (name, provider, rtp, max_multiplier, theme) VALUES
('Book of Dead', 'Play''n GO', 96.21, 5000, 'Egyptian'),
('Starburst', 'NetEnt', 96.09, 50000, 'Space'),
('Gonzo''s Quest', 'NetEnt', 95.97, 2500, 'Adventure'),
('Reactoonz', 'Play''n GO', 96.51, 4570, 'Alien'),
('Legacy of Dead', 'Play''n GO', 96.58, 5000, 'Egyptian'),
('Fire Joker', 'Play''n GO', 96.15, 800, 'Classic'),
('Sweet Bonanza', 'Pragmatic Play', 96.51, 21100, 'Candy'),
('The Dog House', 'Pragmatic Play', 96.51, 6750, 'Animals'),
('Gates of Olympus', 'Pragmatic Play', 96.50, 5000, 'Mythology'),
('Razor Shark', 'Push Gaming', 96.70, 50000, 'Ocean');