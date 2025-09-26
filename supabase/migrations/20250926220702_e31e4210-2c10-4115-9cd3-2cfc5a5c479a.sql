-- Add VPN/Proxy detection columns to user_ip_tracking table
ALTER TABLE public.user_ip_tracking ADD COLUMN IF NOT EXISTS is_vpn boolean DEFAULT false;
ALTER TABLE public.user_ip_tracking ADD COLUMN IF NOT EXISTS is_proxy boolean DEFAULT false;
ALTER TABLE public.user_ip_tracking ADD COLUMN IF NOT EXISTS is_tor boolean DEFAULT false;
ALTER TABLE public.user_ip_tracking ADD COLUMN IF NOT EXISTS proxy_type text;
ALTER TABLE public.user_ip_tracking ADD COLUMN IF NOT EXISTS risk_score integer DEFAULT 0;
ALTER TABLE public.user_ip_tracking ADD COLUMN IF NOT EXISTS country_code text;
ALTER TABLE public.user_ip_tracking ADD COLUMN IF NOT EXISTS country_name text;
ALTER TABLE public.user_ip_tracking ADD COLUMN IF NOT EXISTS provider text;
ALTER TABLE public.user_ip_tracking ADD COLUMN IF NOT EXISTS detection_count integer DEFAULT 1;

-- Create function to get VPN/Proxy users
CREATE OR REPLACE FUNCTION public.get_vpn_proxy_users()
RETURNS TABLE(
  user_id text,
  display_name text,
  kick_username text,
  ip_address text,
  proxy_type text,
  risk_score integer,
  country text,
  provider text,
  first_detected timestamp with time zone,
  last_detected timestamp with time zone,
  detection_count integer
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    uit.user_id::text,
    COALESCE(p.display_name, p.kick_username, 'Unknown')::text as display_name,
    COALESCE(p.kick_username, 'Unknown')::text as kick_username,
    uit.ip_address::text,
    COALESCE(uit.proxy_type, 'Unknown')::text,
    uit.risk_score,
    COALESCE(uit.country_name, 'Unknown')::text as country,
    COALESCE(uit.provider, 'Unknown')::text,
    uit.first_seen_at as first_detected,
    uit.last_seen_at as last_detected,
    uit.detection_count
  FROM public.user_ip_tracking uit
  LEFT JOIN public.profiles p ON p.user_id = uit.user_id
  WHERE (uit.is_vpn = true OR uit.is_proxy = true OR uit.is_tor = true)
  ORDER BY uit.last_seen_at DESC;
$$;

-- Update the track_user_ip function to include VPN/Proxy data
CREATE OR REPLACE FUNCTION public.track_user_ip(
  p_user_id uuid,
  p_ip_address inet,
  p_user_agent text DEFAULT NULL,
  p_is_vpn boolean DEFAULT false,
  p_is_proxy boolean DEFAULT false,
  p_is_tor boolean DEFAULT false,
  p_proxy_type text DEFAULT NULL,
  p_risk_score integer DEFAULT 0,
  p_country_code text DEFAULT NULL,
  p_country_name text DEFAULT NULL,
  p_provider text DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_ip_tracking (
    user_id, 
    ip_address, 
    user_agent, 
    first_seen_at, 
    last_seen_at, 
    occurrence_count,
    is_vpn,
    is_proxy,
    is_tor,
    proxy_type,
    risk_score,
    country_code,
    country_name,
    provider,
    detection_count
  )
  VALUES (
    p_user_id, 
    p_ip_address, 
    p_user_agent, 
    now(), 
    now(), 
    1,
    p_is_vpn,
    p_is_proxy,
    p_is_tor,
    p_proxy_type,
    p_risk_score,
    p_country_code,
    p_country_name,
    p_provider,
    1
  )
  ON CONFLICT (user_id, ip_address) 
  DO UPDATE SET
    last_seen_at = now(),
    occurrence_count = user_ip_tracking.occurrence_count + 1,
    updated_at = now(),
    is_vpn = COALESCE(EXCLUDED.is_vpn, user_ip_tracking.is_vpn),
    is_proxy = COALESCE(EXCLUDED.is_proxy, user_ip_tracking.is_proxy),
    is_tor = COALESCE(EXCLUDED.is_tor, user_ip_tracking.is_tor),
    proxy_type = COALESCE(EXCLUDED.proxy_type, user_ip_tracking.proxy_type),
    risk_score = COALESCE(EXCLUDED.risk_score, user_ip_tracking.risk_score),
    country_code = COALESCE(EXCLUDED.country_code, user_ip_tracking.country_code),
    country_name = COALESCE(EXCLUDED.country_name, user_ip_tracking.country_name),
    provider = COALESCE(EXCLUDED.provider, user_ip_tracking.provider),
    detection_count = user_ip_tracking.detection_count + CASE WHEN (EXCLUDED.is_vpn OR EXCLUDED.is_proxy OR EXCLUDED.is_tor) THEN 1 ELSE 0 END;
END;
$$;