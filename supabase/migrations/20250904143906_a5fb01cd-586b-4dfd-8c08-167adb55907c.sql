-- Create table to store giveaway pending winners state
CREATE TABLE public.giveaway_states (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  giveaway_id UUID NOT NULL REFERENCES public.giveaways(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  pending_winners JSONB DEFAULT '[]'::jsonb,
  remaining_participants JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(giveaway_id, user_id)
);

-- Enable RLS
ALTER TABLE public.giveaway_states ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own giveaway states" 
ON public.giveaway_states 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own giveaway states" 
ON public.giveaway_states 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own giveaway states" 
ON public.giveaway_states 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own giveaway states" 
ON public.giveaway_states 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_giveaway_states_updated_at
BEFORE UPDATE ON public.giveaway_states
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();