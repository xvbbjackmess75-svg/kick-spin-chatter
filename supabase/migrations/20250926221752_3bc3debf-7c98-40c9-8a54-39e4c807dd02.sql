-- Create function to check if a user is an alt account by username
CREATE OR REPLACE FUNCTION check_alt_account_by_username(target_username TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    target_user_id UUID;
    alt_account_exists BOOLEAN := FALSE;
BEGIN
    -- Only allow admins to check alt accounts
    IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
        RETURN FALSE;
    END IF;

    -- Get user ID from kick username
    SELECT user_id INTO target_user_id
    FROM profiles 
    WHERE kick_username = target_username
    LIMIT 1;

    -- If user not found, return false
    IF target_user_id IS NULL THEN
        RETURN FALSE;
    END IF;

    -- Check if this user is flagged as alt account
    -- This is a placeholder - you'll need to implement your alt account detection logic
    -- For now, we'll check if multiple users share the same IP addresses
    SELECT EXISTS(
        SELECT 1 
        FROM user_ip_tracking uit1
        JOIN user_ip_tracking uit2 ON uit1.ip_address = uit2.ip_address
        WHERE uit1.user_id = target_user_id 
        AND uit2.user_id != target_user_id
        AND uit1.user_id IS NOT NULL 
        AND uit2.user_id IS NOT NULL
    ) INTO alt_account_exists;

    RETURN alt_account_exists;
END;
$$;

-- Create function to check if a user is using VPN/Proxy/Tor by username
CREATE OR REPLACE FUNCTION check_vpn_proxy_tor_by_username(target_username TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    target_user_id UUID;
    vpn_proxy_tor_exists BOOLEAN := FALSE;
BEGIN
    -- Only allow admins to check VPN/Proxy/Tor usage
    IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
        RETURN FALSE;
    END IF;

    -- Get user ID from kick username
    SELECT user_id INTO target_user_id
    FROM profiles 
    WHERE kick_username = target_username
    LIMIT 1;

    -- If user not found, return false
    IF target_user_id IS NULL THEN
        RETURN FALSE;
    END IF;

    -- Check if this user has any VPN/Proxy/Tor detections
    SELECT EXISTS(
        SELECT 1 
        FROM user_ip_tracking
        WHERE user_id = target_user_id 
        AND (is_vpn = TRUE OR is_proxy = TRUE OR is_tor = TRUE)
    ) INTO vpn_proxy_tor_exists;

    RETURN vpn_proxy_tor_exists;
END;
$$;