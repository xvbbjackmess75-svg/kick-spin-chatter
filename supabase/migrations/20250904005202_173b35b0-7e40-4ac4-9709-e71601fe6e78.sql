-- Fix security warnings by updating functions with proper search_path

-- Update the update function
CREATE OR REPLACE FUNCTION public.update_chatbot_monitor_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Update the auto-start function  
CREATE OR REPLACE FUNCTION public.auto_start_chatbot_monitor()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user has kick account linked
  IF NEW.kick_user_id IS NOT NULL AND NEW.kick_username IS NOT NULL AND NEW.kick_channel_id IS NOT NULL THEN
    -- Insert or update chatbot monitor record
    INSERT INTO public.chatbot_monitors (
      user_id,
      kick_user_id, 
      kick_username,
      channel_id,
      is_active
    ) VALUES (
      NEW.user_id,
      NEW.kick_user_id,
      NEW.kick_username, 
      NEW.kick_channel_id,
      true
    )
    ON CONFLICT (user_id) 
    DO UPDATE SET
      kick_user_id = EXCLUDED.kick_user_id,
      kick_username = EXCLUDED.kick_username,
      channel_id = EXCLUDED.channel_id,
      is_active = true,
      updated_at = now();
  END IF;
  
  RETURN NEW;
END;
$$;