-- Create feature permissions table to control access to different features based on roles
CREATE TABLE public.feature_permissions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  feature_name text NOT NULL,
  required_role app_role NOT NULL,
  description text,
  is_enabled boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(feature_name)
);

-- Enable RLS on feature_permissions
ALTER TABLE public.feature_permissions ENABLE ROW LEVEL SECURITY;

-- Admin can manage feature permissions
CREATE POLICY "Admins can manage feature permissions"
ON public.feature_permissions
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Anyone can view feature permissions (for checking access)
CREATE POLICY "Anyone can view feature permissions"
ON public.feature_permissions
FOR SELECT
TO authenticated
USING (true);

-- Insert default feature permissions
INSERT INTO public.feature_permissions (feature_name, required_role, description) VALUES
('bonus_hunt', 'premium', 'Access to bonus hunt tracking and management features'),
('giveaways', 'user', 'Create and manage giveaways'),
('slots_calls', 'user', 'Submit and manage slots calls'),
('admin_panel', 'admin', 'Access to admin panel and user management'),
('chat_monitoring', 'premium', 'Access to chat monitoring and bot features'),
('overlay_customization', 'premium', 'Customize overlay settings and appearance');

-- Create function to check if user has access to a feature
CREATE OR REPLACE FUNCTION public.has_feature_access(_user_id uuid, _feature_name text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN NOT EXISTS (SELECT 1 FROM public.feature_permissions WHERE feature_name = _feature_name AND is_enabled = true) THEN false
    WHEN EXISTS (
      SELECT 1 
      FROM public.feature_permissions fp
      JOIN public.user_roles ur ON true
      WHERE fp.feature_name = _feature_name 
      AND fp.is_enabled = true
      AND ur.user_id = _user_id
      AND (
        (fp.required_role = 'user' AND ur.role IN ('user', 'premium', 'vip_plus', 'admin')) OR
        (fp.required_role = 'premium' AND ur.role IN ('premium', 'vip_plus', 'admin')) OR
        (fp.required_role = 'vip_plus' AND ur.role IN ('vip_plus', 'admin')) OR
        (fp.required_role = 'admin' AND ur.role = 'admin')
      )
    ) THEN true
    ELSE false
  END
$$;

-- Add trigger to update updated_at timestamp
CREATE TRIGGER update_feature_permissions_updated_at
  BEFORE UPDATE ON public.feature_permissions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();