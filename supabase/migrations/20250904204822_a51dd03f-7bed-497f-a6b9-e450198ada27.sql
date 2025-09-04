-- Update giveaway_participants policies to be more restrictive
DROP POLICY IF EXISTS "Users can join active giveaways" ON public.giveaway_participants;

CREATE POLICY "Users can join active giveaways with verification" 
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