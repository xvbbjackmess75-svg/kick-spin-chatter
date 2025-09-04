-- Add streamer to the app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'streamer';

-- Add admin and streamer roles for test@test.com user
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role 
FROM auth.users 
WHERE email = 'test@test.com'
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'streamer'::app_role 
FROM auth.users 
WHERE email = 'test@test.com'
ON CONFLICT (user_id, role) DO NOTHING;