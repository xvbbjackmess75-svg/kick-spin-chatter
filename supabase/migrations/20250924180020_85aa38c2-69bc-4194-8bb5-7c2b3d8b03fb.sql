-- Clean up duplicate roles for contact@kickhelper.app
-- Remove the viewer role since admin role should take precedence
DELETE FROM public.user_roles 
WHERE user_id = 'fac6aa43-e051-45f1-b51f-6de731139be0' 
AND role = 'viewer';