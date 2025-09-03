-- Insert some demo commands to showcase the system
INSERT INTO public.commands (command, response, user_level, cooldown, enabled, user_id) VALUES
('!help', 'Available commands: !discord, !socials, !youtube, !rules - Use them to get useful links and info!', 'everyone', 30, true, '00000000-0000-0000-0000-000000000000'),
('!discord', 'Join our Discord community: https://discord.gg/example - Connect with other viewers and get updates!', 'everyone', 60, true, '00000000-0000-0000-0000-000000000000'),
('!socials', 'Follow us: Twitter @streamer | Instagram @streamer_ig | TikTok @streamertiktok', 'everyone', 45, true, '00000000-0000-0000-0000-000000000000'),
('!youtube', 'Subscribe to our YouTube channel: https://youtube.com/@streamer - New videos every week!', 'everyone', 60, true, '00000000-0000-0000-0000-000000000000'),
('!rules', '1. Be respectful 2. No spam 3. English only 4. Have fun! 5. Follow Kick ToS', 'everyone', 30, true, '00000000-0000-0000-0000-000000000000'),
('!mod', 'Moderator tools activated. Use !timeout @user, !ban @user, or !clear to manage chat.', 'moderator', 5, true, '00000000-0000-0000-0000-000000000000'),
('!sub', 'Thanks for subscribing! Subscribers get access to exclusive emotes and commands.', 'subscriber', 0, true, '00000000-0000-0000-0000-000000000000');

-- Update the user_id for any existing users (this will link commands to actual users when they use the system)
UPDATE public.commands 
SET user_id = (SELECT id FROM auth.users LIMIT 1)
WHERE user_id = '00000000-0000-0000-0000-000000000000' 
AND EXISTS (SELECT 1 FROM auth.users);