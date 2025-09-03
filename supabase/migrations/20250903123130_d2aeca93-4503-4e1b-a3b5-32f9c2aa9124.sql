-- Create profiles table for user information
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  kick_username text,
  kick_user_id text,
  kick_channel_id text,
  avatar_url text,
  display_name text,
  is_streamer boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Create kick_channels table for channel configuration
CREATE TABLE public.kick_channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  channel_name text NOT NULL,
  channel_id text UNIQUE NOT NULL,
  is_active boolean DEFAULT true,
  bot_enabled boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Create commands table
CREATE TABLE public.commands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  channel_id uuid REFERENCES public.kick_channels(id) ON DELETE CASCADE,
  command text NOT NULL,
  response text NOT NULL,
  cooldown integer DEFAULT 30,
  user_level text DEFAULT 'everyone' CHECK (user_level IN ('everyone', 'subscriber', 'moderator')),
  enabled boolean DEFAULT true,
  uses integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE(channel_id, command)
);

-- Create giveaways table
CREATE TABLE public.giveaways (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  channel_id uuid REFERENCES public.kick_channels(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  max_participants integer,
  participants_count integer DEFAULT 0,
  status text DEFAULT 'active' CHECK (status IN ('active', 'ended', 'cancelled')),
  winner_user_id text,
  expires_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Create giveaway_participants table
CREATE TABLE public.giveaway_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  giveaway_id uuid REFERENCES public.giveaways(id) ON DELETE CASCADE NOT NULL,
  kick_username text NOT NULL,
  kick_user_id text NOT NULL,
  entered_at timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE(giveaway_id, kick_user_id)
);

-- Create chat_messages table for monitoring
CREATE TABLE public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid REFERENCES public.kick_channels(id) ON DELETE CASCADE NOT NULL,
  kick_username text NOT NULL,
  kick_user_id text,
  message text NOT NULL,
  user_type text DEFAULT 'viewer' CHECK (user_type IN ('viewer', 'subscriber', 'moderator')),
  is_command boolean DEFAULT false,
  command_name text,
  timestamp timestamp with time zone DEFAULT now() NOT NULL
);

-- Create bot_settings table
CREATE TABLE public.bot_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  channel_id uuid REFERENCES public.kick_channels(id) ON DELETE CASCADE,
  bot_enabled boolean DEFAULT false,
  bot_username text DEFAULT 'StreamBot',
  command_prefix text DEFAULT '!',
  default_cooldown integer DEFAULT 30,
  auto_moderation boolean DEFAULT true,
  max_message_length integer DEFAULT 500,
  banned_words text[],
  timeout_duration integer DEFAULT 5,
  api_rate_limit integer DEFAULT 10,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kick_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.giveaways ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.giveaway_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bot_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for kick_channels
CREATE POLICY "Users can view their own channels" ON public.kick_channels
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own channels" ON public.kick_channels
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own channels" ON public.kick_channels
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own channels" ON public.kick_channels
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for commands
CREATE POLICY "Users can view their own commands" ON public.commands
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own commands" ON public.commands
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own commands" ON public.commands
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own commands" ON public.commands
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for giveaways
CREATE POLICY "Users can view their own giveaways" ON public.giveaways
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own giveaways" ON public.giveaways
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own giveaways" ON public.giveaways
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own giveaways" ON public.giveaways
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for giveaway_participants (public read for giveaway creators)
CREATE POLICY "Users can view participants of their giveaways" ON public.giveaway_participants
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.giveaways 
      WHERE giveaways.id = giveaway_participants.giveaway_id 
      AND giveaways.user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can participate in active giveaways" ON public.giveaway_participants
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.giveaways 
      WHERE giveaways.id = giveaway_participants.giveaway_id 
      AND giveaways.status = 'active'
    )
  );

-- Create RLS policies for chat_messages (channel owners can view)
CREATE POLICY "Channel owners can view chat messages" ON public.chat_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.kick_channels 
      WHERE kick_channels.id = chat_messages.channel_id 
      AND kick_channels.user_id = auth.uid()
    )
  );

CREATE POLICY "Insert chat messages for owned channels" ON public.chat_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.kick_channels 
      WHERE kick_channels.id = chat_messages.channel_id 
      AND kick_channels.user_id = auth.uid()
    )
  );

-- Create RLS policies for bot_settings
CREATE POLICY "Users can view their own bot settings" ON public.bot_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own bot settings" ON public.bot_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bot settings" ON public.bot_settings
  FOR UPDATE USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_kick_channels_updated_at
  BEFORE UPDATE ON public.kick_channels
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_commands_updated_at
  BEFORE UPDATE ON public.commands
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_giveaways_updated_at
  BEFORE UPDATE ON public.giveaways
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bot_settings_updated_at
  BEFORE UPDATE ON public.bot_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$;

-- Create trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();