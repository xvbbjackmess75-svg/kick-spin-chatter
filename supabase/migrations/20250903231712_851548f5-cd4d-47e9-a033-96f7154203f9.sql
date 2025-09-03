-- Re-enable RLS and implement proper security policies for giveaway system

-- Re-enable Row Level Security on all giveaway tables
ALTER TABLE public.giveaways ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.giveaway_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.giveaway_winners ENABLE ROW LEVEL SECURITY;

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Allow giveaway access for authenticated users" ON public.giveaways;
DROP POLICY IF EXISTS "Allow participant access" ON public.giveaway_participants;
DROP POLICY IF EXISTS "Allow winners access" ON public.giveaway_winners;

-- Create secure policies for giveaways table
-- Only giveaway creators can view, create, update, and delete their own giveaways
CREATE POLICY "Users can view their own giveaways" 
ON public.giveaways 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own giveaways" 
ON public.giveaways 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own giveaways" 
ON public.giveaways 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own giveaways" 
ON public.giveaways 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create policies for giveaway_participants table
-- Only giveaway owners can view participants of their giveaways
CREATE POLICY "Giveaway owners can view participants" 
ON public.giveaway_participants 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.giveaways 
    WHERE giveaways.id = giveaway_participants.giveaway_id 
    AND giveaways.user_id = auth.uid()
  )
);

-- Allow inserting participants for active giveaways (for public participation)
CREATE POLICY "Users can join active giveaways" 
ON public.giveaway_participants 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.giveaways 
    WHERE giveaways.id = giveaway_participants.giveaway_id 
    AND giveaways.status = 'active'
    AND (giveaways.expires_at IS NULL OR giveaways.expires_at > now())
  )
);

-- Only giveaway owners can delete participants
CREATE POLICY "Giveaway owners can remove participants" 
ON public.giveaway_participants 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.giveaways 
    WHERE giveaways.id = giveaway_participants.giveaway_id 
    AND giveaways.user_id = auth.uid()
  )
);

-- Create policies for giveaway_winners table
-- Only giveaway owners can view winners of their giveaways
CREATE POLICY "Giveaway owners can view winners" 
ON public.giveaway_winners 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.giveaways 
    WHERE giveaways.id = giveaway_winners.giveaway_id 
    AND giveaways.user_id = auth.uid()
  )
);

-- Only giveaway owners can insert winners
CREATE POLICY "Giveaway owners can create winners" 
ON public.giveaway_winners 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.giveaways 
    WHERE giveaways.id = giveaway_winners.giveaway_id 
    AND giveaways.user_id = auth.uid()
  )
);

-- Only giveaway owners can update winners
CREATE POLICY "Giveaway owners can update winners" 
ON public.giveaway_winners 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.giveaways 
    WHERE giveaways.id = giveaway_winners.giveaway_id 
    AND giveaways.user_id = auth.uid()
  )
);

-- Only giveaway owners can delete winners
CREATE POLICY "Giveaway owners can delete winners" 
ON public.giveaway_winners 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.giveaways 
    WHERE giveaways.id = giveaway_winners.giveaway_id 
    AND giveaways.user_id = auth.uid()
  )
);