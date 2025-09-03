-- Create demo commands using the first available user or skip if no users exist
DO $$
DECLARE
    first_user_id UUID;
BEGIN
    -- Get the first user ID
    SELECT id INTO first_user_id FROM auth.users LIMIT 1;
    
    -- Only insert demo data if we have a user
    IF first_user_id IS NOT NULL THEN
        INSERT INTO public.commands (command, response, user_level, cooldown, enabled, user_id) VALUES
        ('!help', 'Available commands: !discord, !socials, !youtube, !rules - Use them to get useful links and info!', 'everyone', 30, true, first_user_id),
        ('!discord', 'Join our Discord community: https://discord.gg/example - Connect with other viewers and get updates!', 'everyone', 60, true, first_user_id),
        ('!socials', 'Follow us: Twitter @streamer | Instagram @streamer_ig | TikTok @streamertiktok', 'everyone', 45, true, first_user_id),
        ('!youtube', 'Subscribe to our YouTube channel: https://youtube.com/@streamer - New videos every week!', 'everyone', 60, true, first_user_id),
        ('!rules', '1. Be respectful 2. No spam 3. English only 4. Have fun! 5. Follow Kick ToS', 'everyone', 30, true, first_user_id),
        ('!mod', 'Moderator tools activated. Use !timeout @user, !ban @user, or !clear to manage chat.', 'moderator', 5, true, first_user_id),
        ('!sub', 'Thanks for subscribing! Subscribers get access to exclusive emotes and commands.', 'subscriber', 0, true, first_user_id);
        
        RAISE NOTICE 'Demo commands created for user %', first_user_id;
    ELSE
        RAISE NOTICE 'No users found, skipping demo command creation';
    END IF;
END $$;