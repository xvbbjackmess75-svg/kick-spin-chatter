-- Fix the role assignment issue by removing profile trigger that adds user role
-- Clean up the ezfezfezf account first
DELETE FROM user_roles 
WHERE user_id = '42dab3d9-89f1-4ede-ad98-f3da6ed06fbf' 
AND role = 'user';

-- Drop the problematic profile trigger that adds user roles
DROP TRIGGER IF EXISTS on_profile_created ON profiles CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user_role() CASCADE;

-- Ensure our main registration trigger is the only one handling roles
-- and it only assigns viewer role by default