-- Create Twitter Giveaways Tables

-- Core Twitter giveaway data
CREATE TABLE public.twitter_giveaways (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  tweet_id TEXT NOT NULL,
  tweet_url TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  conditions JSONB NOT NULL DEFAULT '{}',
  winner_count INTEGER NOT NULL DEFAULT 1,
  auto_end_enabled BOOLEAN DEFAULT false,
  ends_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Twitter participants
CREATE TABLE public.twitter_giveaway_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  giveaway_id UUID NOT NULL,
  twitter_user_id TEXT NOT NULL,
  twitter_username TEXT NOT NULL,
  display_name TEXT,
  profile_image_url TEXT,
  conditions_met JSONB NOT NULL DEFAULT '{}',
  follower_since TIMESTAMP WITH TIME ZONE,
  engagement_score INTEGER DEFAULT 0,
  entered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(giveaway_id, twitter_user_id)
);

-- Twitter giveaway winners
CREATE TABLE public.twitter_giveaway_winners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  giveaway_id UUID NOT NULL,
  twitter_user_id TEXT NOT NULL,
  twitter_username TEXT NOT NULL,
  winning_ticket INTEGER,
  total_tickets INTEGER,
  selected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notified_at TIMESTAMP WITH TIME ZONE
);

-- Twitter giveaway states (for managing roulette state)
CREATE TABLE public.twitter_giveaway_states (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  giveaway_id UUID NOT NULL,
  user_id UUID NOT NULL,
  pending_winners JSONB DEFAULT '[]',
  remaining_participants JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.twitter_giveaways ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.twitter_giveaway_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.twitter_giveaway_winners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.twitter_giveaway_states ENABLE ROW LEVEL SECURITY;

-- RLS Policies for twitter_giveaways
CREATE POLICY "Users can create their own Twitter giveaways" 
ON public.twitter_giveaways 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own Twitter giveaways" 
ON public.twitter_giveaways 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own Twitter giveaways" 
ON public.twitter_giveaways 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own Twitter giveaways" 
ON public.twitter_giveaways 
FOR DELETE 
USING (auth.uid() = user_id);

-- RLS Policies for twitter_giveaway_participants
CREATE POLICY "Giveaway owners can view Twitter participants" 
ON public.twitter_giveaway_participants 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.twitter_giveaways 
  WHERE twitter_giveaways.id = twitter_giveaway_participants.giveaway_id 
  AND twitter_giveaways.user_id = auth.uid()
));

CREATE POLICY "Users can join active Twitter giveaways" 
ON public.twitter_giveaway_participants 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.twitter_giveaways 
  WHERE twitter_giveaways.id = twitter_giveaway_participants.giveaway_id 
  AND twitter_giveaways.status = 'active'
  AND (twitter_giveaways.ends_at IS NULL OR twitter_giveaways.ends_at > now())
));

CREATE POLICY "Giveaway owners can remove Twitter participants" 
ON public.twitter_giveaway_participants 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM public.twitter_giveaways 
  WHERE twitter_giveaways.id = twitter_giveaway_participants.giveaway_id 
  AND twitter_giveaways.user_id = auth.uid()
));

-- RLS Policies for twitter_giveaway_winners
CREATE POLICY "Giveaway owners can create Twitter winners" 
ON public.twitter_giveaway_winners 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.twitter_giveaways 
  WHERE twitter_giveaways.id = twitter_giveaway_winners.giveaway_id 
  AND twitter_giveaways.user_id = auth.uid()
));

CREATE POLICY "Giveaway owners can view Twitter winners" 
ON public.twitter_giveaway_winners 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.twitter_giveaways 
  WHERE twitter_giveaways.id = twitter_giveaway_winners.giveaway_id 
  AND twitter_giveaways.user_id = auth.uid()
));

CREATE POLICY "Giveaway owners can update Twitter winners" 
ON public.twitter_giveaway_winners 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.twitter_giveaways 
  WHERE twitter_giveaways.id = twitter_giveaway_winners.giveaway_id 
  AND twitter_giveaways.user_id = auth.uid()
));

CREATE POLICY "Giveaway owners can delete Twitter winners" 
ON public.twitter_giveaway_winners 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM public.twitter_giveaways 
  WHERE twitter_giveaways.id = twitter_giveaway_winners.giveaway_id 
  AND twitter_giveaways.user_id = auth.uid()
));

-- RLS Policies for twitter_giveaway_states
CREATE POLICY "Users can create their own Twitter giveaway states" 
ON public.twitter_giveaway_states 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own Twitter giveaway states" 
ON public.twitter_giveaway_states 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own Twitter giveaway states" 
ON public.twitter_giveaway_states 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own Twitter giveaway states" 
ON public.twitter_giveaway_states 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create triggers for updating timestamps
CREATE TRIGGER update_twitter_giveaways_updated_at
BEFORE UPDATE ON public.twitter_giveaways
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_twitter_giveaway_states_updated_at
BEFORE UPDATE ON public.twitter_giveaway_states
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();