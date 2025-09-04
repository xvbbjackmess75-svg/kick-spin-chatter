-- Create table to track chatbot monitoring status
CREATE TABLE public.chatbot_monitors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  kick_user_id TEXT NOT NULL,
  kick_username TEXT NOT NULL,
  channel_id TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_heartbeat TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  total_messages_processed INTEGER NOT NULL DEFAULT 0,
  total_commands_processed INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.chatbot_monitors ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own monitor status" 
ON public.chatbot_monitors 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own monitor" 
ON public.chatbot_monitors 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own monitor" 
ON public.chatbot_monitors 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own monitor" 
ON public.chatbot_monitors 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_chatbot_monitor_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_chatbot_monitors_updated_at
BEFORE UPDATE ON public.chatbot_monitors
FOR EACH ROW
EXECUTE FUNCTION public.update_chatbot_monitor_updated_at();

-- Create index for efficient lookups
CREATE INDEX idx_chatbot_monitors_user_id ON public.chatbot_monitors(user_id);
CREATE INDEX idx_chatbot_monitors_kick_user_id ON public.chatbot_monitors(kick_user_id);
CREATE INDEX idx_chatbot_monitors_active ON public.chatbot_monitors(is_active);

-- Create function to auto-start monitoring for new Kick users
CREATE OR REPLACE FUNCTION public.auto_start_chatbot_monitor()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-start monitoring when profiles are updated with Kick info
CREATE TRIGGER trigger_auto_start_chatbot_monitor
AFTER INSERT OR UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.auto_start_chatbot_monitor();