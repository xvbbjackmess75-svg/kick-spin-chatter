-- Insert default commands for testing with correct user levels
INSERT INTO public.commands (user_id, command, response, user_level, enabled, cooldown, uses) VALUES
  ('ad2c0b71-2d85-4444-ab5e-dacb6571fe62', 'help', 'Available commands: !help, !discord, !socials, !uptime - Type any command to get help!', 'everyone', true, 30, 0),
  ('ad2c0b71-2d85-4444-ab5e-dacb6571fe62', 'discord', 'Join our Discord server: https://discord.gg/example - Come chat with the community!', 'everyone', true, 60, 0),
  ('ad2c0b71-2d85-4444-ab5e-dacb6571fe62', 'socials', 'Follow me on Twitter: @example | Instagram: @example | YouTube: @example', 'everyone', true, 120, 0),
  ('ad2c0b71-2d85-4444-ab5e-dacb6571fe62', 'uptime', 'The stream has been live for a while now! Thanks for watching!', 'everyone', true, 30, 0),
  ('ad2c0b71-2d85-4444-ab5e-dacb6571fe62', 'mod', 'This is a moderator-only command! Only mods can use this.', 'moderator', true, 10, 0);