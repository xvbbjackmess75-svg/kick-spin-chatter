-- Assign admin role to contact@kickhelper.app user
INSERT INTO public.user_roles (user_id, role)
VALUES ('fac6aa43-e051-45f1-b51f-6de731139be0', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;