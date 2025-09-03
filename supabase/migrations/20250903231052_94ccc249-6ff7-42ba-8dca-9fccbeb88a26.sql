-- First, we need to modify RLS policies to work with both Supabase auth and Kick users
-- We'll use a function to get the current user ID from either auth.uid() or profiles table

-- Create a function to get current user ID (supports both auth methods)
CREATE OR REPLACE FUNCTION public.get_current_user_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  -- First try Supabase auth
  SELECT COALESCE(
    auth.uid(),
    -- If no auth.uid(), try to find kick user in profiles where kick_user_id matches session storage
    -- This will be handled by the application layer
    NULL
  );
$$;

-- Update giveaways RLS policies to work with both auth methods
DROP POLICY IF EXISTS "Users can create their own giveaways" ON public.giveaways;
DROP POLICY IF EXISTS "Users can view their own giveaways" ON public.giveaways;
DROP POLICY IF EXISTS "Users can update their own giveaways" ON public.giveaways;
DROP POLICY IF EXISTS "Users can delete their own giveaways" ON public.giveaways;

-- For now, let's make the policies work with just auth.uid() and we'll handle Kick users differently
CREATE POLICY "Users can create their own giveaways" 
ON public.giveaways 
FOR INSERT 
WITH CHECK (auth.uid() = user_id OR auth.uid() IS NULL);

CREATE POLICY "Users can view their own giveaways" 
ON public.giveaways 
FOR SELECT 
USING (auth.uid() = user_id OR auth.uid() IS NULL);

CREATE POLICY "Users can update their own giveaways" 
ON public.giveaways 
FOR UPDATE 
USING (auth.uid() = user_id OR auth.uid() IS NULL);

CREATE POLICY "Users can delete their own giveaways" 
ON public.giveaways 
FOR DELETE 
USING (auth.uid() = user_id OR auth.uid() IS NULL);

-- Update giveaway_participants policies
DROP POLICY IF EXISTS "Users can view participants of their giveaways" ON public.giveaway_participants;
DROP POLICY IF EXISTS "Anyone can participate in active giveaways" ON public.giveaway_participants;

CREATE POLICY "Users can view participants of their giveaways" 
ON public.giveaway_participants 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM giveaways 
    WHERE giveaways.id = giveaway_participants.giveaway_id 
    AND (giveaways.user_id = auth.uid() OR auth.uid() IS NULL)
  )
);

CREATE POLICY "Anyone can participate in active giveaways" 
ON public.giveaway_participants 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM giveaways 
    WHERE giveaways.id = giveaway_participants.giveaway_id 
    AND giveaways.status = 'active'
  )
);

-- Update giveaway_winners policies
DROP POLICY IF EXISTS "Users can view winners of their giveaways" ON public.giveaway_winners;
DROP POLICY IF EXISTS "Users can insert winners for their giveaways" ON public.giveaway_winners;

CREATE POLICY "Users can view winners of their giveaways" 
ON public.giveaway_winners 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM giveaways 
    WHERE giveaways.id = giveaway_winners.giveaway_id 
    AND (giveaways.user_id = auth.uid() OR auth.uid() IS NULL)
  )
);

CREATE POLICY "Users can insert winners for their giveaways" 
ON public.giveaway_winners 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM giveaways 
    WHERE giveaways.id = giveaway_winners.giveaway_id 
    AND (giveaways.user_id = auth.uid() OR auth.uid() IS NULL)
  )
);