-- Update get_user_role function to include streamer role in hierarchy
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS app_role
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE 
    WHEN EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'admin') THEN 'admin'::app_role
    WHEN EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'vip_plus') THEN 'vip_plus'::app_role
    WHEN EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'premium') THEN 'premium'::app_role
    WHEN EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'user') THEN 'user'::app_role
    WHEN EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'streamer') THEN 'streamer'::app_role
    WHEN EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'verified_viewer') THEN 'verified_viewer'::app_role
    ELSE 'viewer'::app_role
  END
$$;

-- Clean up duplicate roles - keep highest role per user
WITH ranked_roles AS (
  SELECT 
    user_id,
    role,
    ROW_NUMBER() OVER (
      PARTITION BY user_id 
      ORDER BY 
        CASE role 
          WHEN 'admin' THEN 6
          WHEN 'vip_plus' THEN 5
          WHEN 'premium' THEN 4
          WHEN 'user' THEN 3
          WHEN 'streamer' THEN 2
          WHEN 'verified_viewer' THEN 1
          WHEN 'viewer' THEN 0
        END DESC
    ) as rn
  FROM user_roles
),
roles_to_delete AS (
  SELECT user_id, role
  FROM ranked_roles
  WHERE rn > 1
)
DELETE FROM user_roles 
WHERE (user_id, role) IN (
  SELECT user_id, role FROM roles_to_delete
);

-- Update profiles.is_streamer based on actual streamer role
UPDATE profiles 
SET is_streamer = true
WHERE user_id IN (
  SELECT user_id 
  FROM user_roles 
  WHERE role IN ('streamer', 'user', 'premium', 'vip_plus', 'admin')
);

UPDATE profiles 
SET is_streamer = false
WHERE user_id IN (
  SELECT user_id 
  FROM user_roles 
  WHERE role IN ('viewer', 'verified_viewer')
);

-- Update has_feature_access function to include streamer role
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
        (fp.required_role = 'streamer' AND ur.role IN ('streamer', 'user', 'premium', 'vip_plus', 'admin')) OR
        (fp.required_role = 'user' AND ur.role IN ('user', 'premium', 'vip_plus', 'admin')) OR
        (fp.required_role = 'premium' AND ur.role IN ('premium', 'vip_plus', 'admin')) OR
        (fp.required_role = 'vip_plus' AND ur.role IN ('vip_plus', 'admin')) OR
        (fp.required_role = 'admin' AND ur.role = 'admin')
      )
    ) THEN true
    ELSE false
  END
$$;