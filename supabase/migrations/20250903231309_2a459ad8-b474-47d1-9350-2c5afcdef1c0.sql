-- Temporarily disable RLS for testing with Kick users
-- We'll re-enable with proper policies later

-- Disable RLS on main tables to test with Kick users
ALTER TABLE public.giveaways DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.giveaway_participants DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.giveaway_winners DISABLE ROW LEVEL SECURITY;