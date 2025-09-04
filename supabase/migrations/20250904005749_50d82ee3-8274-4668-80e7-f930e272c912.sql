-- Insert some default commands for users to test with
-- These will be visible to all users as examples

-- Insert default commands for the specific user (test@test.com user ID)
-- Note: This is just for testing, in production each user would have their own commands

INSERT INTO public.commands (user_id, command, response, user_level, enabled, cooldown, uses) VALUES
  ('ad2c0b71-2d85-4444-ab5e-dacb6571fe62', 'help', 'Available commands: !help, !discord, !socials, !uptime - Type any command to get help!', 'viewer', true, 30, 0),
  ('ad2c0b71-2d85-4444-ab5e-dacb6571fe62', 'discord', 'Join our Discord server: https://discord.gg/example - Come chat with the community!', 'viewer', true, 60, 0),
  ('ad2c0b71-2d85-4444-ab5e-dacb6571fe62', 'socials', 'Follow me on Twitter: @example | Instagram: @example | YouTube: @example', 'viewer', true, 120, 0),
  ('ad2c0b71-2d85-4444-ab5e-dacb6571fe62', 'uptime', 'The stream has been live for a while now! Thanks for watching!', 'viewer', true, 30, 0),
  ('ad2c0b71-2d85-4444-ab5e-dacb6571fe62', 'mod', 'This is a moderator-only command! Only mods can use this.', 'moderator', true, 10, 0)
ON CONFLICT (user_id, command) DO UPDATE SET
  response = EXCLUDED.response,
  user_level = EXCLUDED.user_level,
  enabled = EXCLUDED.enabled,
  cooldown = EXCLUDED.cooldown;