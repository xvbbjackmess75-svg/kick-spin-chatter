-- Create secure RLS policies for giveaway system

-- Giveaways table policies
-- Only authenticated users can view their own giveaways
CREATE POLICY "Users can view their own giveaways" 
ON public.giveaways 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

-- Only authenticated users can create giveaways with their user_id
CREATE POLICY "Users can create their own giveaways" 
ON public.giveaways 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Only authenticated users can update their own giveaways
CREATE POLICY "Users can update their own giveaways" 
ON public.giveaways 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id);

-- Only authenticated users can delete their own giveaways
CREATE POLICY "Users can delete their own giveaways" 
ON public.giveaways 
FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);

-- Giveaway participants table policies
-- Only giveaway owners can view participants of their giveaways
CREATE POLICY "Giveaway owners can view participants" 
ON public.giveaway_participants 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.giveaways 
    WHERE giveaways.id = giveaway_participants.giveaway_id 
    AND giveaways.user_id = auth.uid()
  )
);

-- Allow inserting participants for active giveaways (for public participation)
-- This allows anyone to join active giveaways
CREATE POLICY "Users can join active giveaways" 
ON public.giveaway_participants 
FOR INSERT 
TO authenticated
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
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.giveaways 
    WHERE giveaways.id = giveaway_participants.giveaway_id 
    AND giveaways.user_id = auth.uid()
  )
);

-- Giveaway winners table policies
-- Only giveaway owners can view winners of their giveaways
CREATE POLICY "Giveaway owners can view winners" 
ON public.giveaway_winners 
FOR SELECT 
TO authenticated
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
TO authenticated
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
TO authenticated
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
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.giveaways 
    WHERE giveaways.id = giveaway_winners.giveaway_id 
    AND giveaways.user_id = auth.uid()
  )
);