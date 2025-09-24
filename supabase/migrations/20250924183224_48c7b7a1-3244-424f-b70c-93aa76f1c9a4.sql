-- Fix the viewer/user role duplication issue
-- Remove 'user' role from accounts that should only be viewers

-- First, let's identify users who have both viewer and user roles
-- and remove the user role to keep them as viewers only
DELETE FROM user_roles 
WHERE user_id IN (
  -- Find users who have both viewer and user roles
  SELECT user_id 
  FROM user_roles 
  WHERE role = 'user'
  AND user_id IN (
    SELECT user_id 
    FROM user_roles 
    WHERE role = 'viewer'
  )
) 
AND role = 'user';

-- Also clean up any users who might have gotten a user role 
-- but have is_streamer = false in their profile
DELETE FROM user_roles 
WHERE role = 'user' 
AND user_id IN (
  SELECT user_id 
  FROM profiles 
  WHERE is_streamer = false
);

-- Log what we're doing
DO $$ 
BEGIN 
  RAISE NOTICE 'Cleaned up duplicate viewer/user roles'; 
END $$;