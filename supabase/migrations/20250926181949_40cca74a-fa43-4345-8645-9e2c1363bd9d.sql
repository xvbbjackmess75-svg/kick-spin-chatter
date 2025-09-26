-- Create the kgs command for RobertGamba user with correct user_level
INSERT INTO public.commands (
  user_id,
  command,
  response,
  cooldown,
  user_level,
  enabled,
  uses
) VALUES (
  '505b05cd-4e17-421d-acfc-b1e566946809',
  'kgs',
  'SLOTS_CALL_COMMAND',
  0,
  'everyone',
  true,
  0
);