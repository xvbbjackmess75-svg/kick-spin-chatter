-- Add verified_viewer to the app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'verified_viewer';

-- Insert admin role for test@test.com user
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role 
FROM auth.users 
WHERE email = 'test@test.com'
ON CONFLICT (user_id, role) DO NOTHING;