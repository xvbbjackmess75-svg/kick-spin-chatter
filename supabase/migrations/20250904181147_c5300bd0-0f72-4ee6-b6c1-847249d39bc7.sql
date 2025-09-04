-- Grant admin role to user Robbie (test@test.com)
INSERT INTO public.user_roles (user_id, role, granted_by)
VALUES ('ad2c0b71-2d85-4444-ab5e-dacb6571fe62', 'admin', auth.uid())
ON CONFLICT (user_id, role) DO NOTHING;