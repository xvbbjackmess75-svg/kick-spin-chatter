-- Create a separate table to track multiple winners per giveaway
CREATE TABLE public.giveaway_winners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  giveaway_id UUID NOT NULL REFERENCES public.giveaways(id) ON DELETE CASCADE,
  winner_username TEXT NOT NULL,
  winning_ticket INTEGER,
  total_tickets INTEGER,
  tickets_per_participant INTEGER,
  won_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.giveaway_winners ENABLE ROW LEVEL SECURITY;

-- Create policies for giveaway winners
CREATE POLICY "Users can view winners of their giveaways" 
ON public.giveaway_winners 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.giveaways 
  WHERE giveaways.id = giveaway_winners.giveaway_id 
  AND giveaways.user_id = auth.uid()
));

CREATE POLICY "Users can insert winners for their giveaways" 
ON public.giveaway_winners 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.giveaways 
  WHERE giveaways.id = giveaway_winners.giveaway_id 
  AND giveaways.user_id = auth.uid()
));

-- Add index for better performance
CREATE INDEX idx_giveaway_winners_giveaway_id ON public.giveaway_winners(giveaway_id);
CREATE INDEX idx_giveaway_winners_won_at ON public.giveaway_winners(won_at DESC);