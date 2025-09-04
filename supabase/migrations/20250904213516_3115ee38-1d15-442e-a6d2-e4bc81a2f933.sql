-- Add admin role to sath.tirou@gmail.com
INSERT INTO public.user_roles (user_id, role, granted_by)
VALUES ('9a83b731-09a5-41c7-b81d-1aacd10c6cea', 'admin', '9a83b731-09a5-41c7-b81d-1aacd10c6cea')
ON CONFLICT (user_id, role) DO NOTHING;