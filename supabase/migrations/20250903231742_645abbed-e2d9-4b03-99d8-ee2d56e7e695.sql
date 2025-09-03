-- First, let's check and clean up existing policies
DO $$
BEGIN
  -- Drop all existing policies on giveaway tables
  DROP POLICY IF EXISTS "Users can view their own giveaways" ON public.giveaways;
  DROP POLICY IF EXISTS "Users can create their own giveaways" ON public.giveaways;
  DROP POLICY IF EXISTS "Users can update their own giveaways" ON public.giveaways;
  DROP POLICY IF EXISTS "Users can delete their own giveaways" ON public.giveaways;
  DROP POLICY IF EXISTS "Allow giveaway access for authenticated users" ON public.giveaways;
  
  DROP POLICY IF EXISTS "Giveaway owners can view participants" ON public.giveaway_participants;
  DROP POLICY IF EXISTS "Users can join active giveaways" ON public.giveaway_participants;
  DROP POLICY IF EXISTS "Giveaway owners can remove participants" ON public.giveaway_participants;
  DROP POLICY IF EXISTS "Allow participant access" ON public.giveaway_participants;
  
  DROP POLICY IF EXISTS "Giveaway owners can view winners" ON public.giveaway_winners;
  DROP POLICY IF EXISTS "Giveaway owners can create winners" ON public.giveaway_winners;
  DROP POLICY IF EXISTS "Giveaway owners can update winners" ON public.giveaway_winners;
  DROP POLICY IF EXISTS "Giveaway owners can delete winners" ON public.giveaway_winners;
  DROP POLICY IF EXISTS "Allow winners access" ON public.giveaway_winners;
EXCEPTION WHEN OTHERS THEN
  NULL; -- Ignore errors if policies don't exist
END $$;

-- Re-enable Row Level Security on all giveaway tables
ALTER TABLE public.giveaways ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.giveaway_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.giveaway_winners ENABLE ROW LEVEL SECURITY;