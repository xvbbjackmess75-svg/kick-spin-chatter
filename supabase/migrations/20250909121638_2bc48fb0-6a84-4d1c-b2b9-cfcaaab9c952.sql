-- Remove the conflicting 'user' role for viewer accounts that should only have viewer access
-- This user signed up through viewer registration and should only have viewer role
DELETE FROM user_roles 
WHERE user_id = '53ba0f48-8a9e-4e1c-acb2-db8dd8c2b786' 
AND role = 'user';