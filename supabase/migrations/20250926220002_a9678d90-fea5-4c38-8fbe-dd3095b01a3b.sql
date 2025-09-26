-- Create table to track user IP addresses for alt account detection
CREATE TABLE public.user_ip_tracking (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  ip_address inet NOT NULL,
  user_agent text,
  first_seen_at timestamp with time zone NOT NULL DEFAULT now(),
  last_seen_at timestamp with time zone NOT NULL DEFAULT now(),
  occurrence_count integer NOT NULL DEFAULT 1,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on the table
ALTER TABLE public.user_ip_tracking ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX idx_user_ip_tracking_user_id ON public.user_ip_tracking(user_id);
CREATE INDEX idx_user_ip_tracking_ip_address ON public.user_ip_tracking(ip_address);
CREATE INDEX idx_user_ip_tracking_last_seen ON public.user_ip_tracking(last_seen_at);

-- Create unique constraint to prevent duplicate entries
CREATE UNIQUE INDEX idx_user_ip_tracking_unique ON public.user_ip_tracking(user_id, ip_address);

-- RLS policies - only admins can access this data
CREATE POLICY "Admins can view all IP tracking data" 
ON public.user_ip_tracking 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert IP tracking data" 
ON public.user_ip_tracking 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update IP tracking data" 
ON public.user_ip_tracking 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'));

-- Create function to upsert IP tracking data
CREATE OR REPLACE FUNCTION public.track_user_ip(
  p_user_id uuid,
  p_ip_address inet,
  p_user_agent text DEFAULT NULL
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
    occurrence_count
  )
  VALUES (
    p_user_id, 
    p_ip_address, 
    p_user_agent, 
    now(), 
    now(), 
    1
  )
  ON CONFLICT (user_id, ip_address) 
  DO UPDATE SET
    last_seen_at = now(),
    occurrence_count = user_ip_tracking.occurrence_count + 1,
    updated_at = now();
END;
$$;

-- Create function to get potential alt accounts
CREATE OR REPLACE FUNCTION public.get_potential_alt_accounts()
RETURNS TABLE(
  ip_address inet,
  user_count bigint,
  users jsonb
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    uit.ip_address,
    COUNT(DISTINCT uit.user_id) as user_count,
    jsonb_agg(
      jsonb_build_object(
        'user_id', uit.user_id,
        'display_name', COALESCE(p.display_name, p.kick_username, 'Unknown'),
        'kick_username', p.kick_username,
        'is_streamer', p.is_streamer,
        'first_seen_at', uit.first_seen_at,
        'last_seen_at', uit.last_seen_at,
        'occurrence_count', uit.occurrence_count
      )
    ) as users
  FROM public.user_ip_tracking uit
  LEFT JOIN public.profiles p ON p.user_id = uit.user_id
  GROUP BY uit.ip_address
  HAVING COUNT(DISTINCT uit.user_id) > 1
  ORDER BY user_count DESC, uit.ip_address;
$$;