-- Fix RLS policies to allow authenticated users to manage their own roles
-- especially for streamer role assignment

-- Update the user_roles RLS policy to allow users to insert their own roles
DROP POLICY IF EXISTS "Users can insert their own roles" ON user_roles;

CREATE POLICY "Users can insert their own roles" ON user_roles
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Also ensure users can update their own roles (for role upgrades)
DROP POLICY IF EXISTS "Users can update their own roles" ON user_roles;

CREATE POLICY "Users can update their own roles" ON user_roles
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);