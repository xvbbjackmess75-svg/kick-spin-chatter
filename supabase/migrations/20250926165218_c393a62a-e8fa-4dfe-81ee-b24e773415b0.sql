-- Fix the chat_messages user_type constraint to include 'broadcaster'
ALTER TABLE public.chat_messages DROP CONSTRAINT IF EXISTS chat_messages_user_type_check;

-- Add updated constraint that includes broadcaster
ALTER TABLE public.chat_messages ADD CONSTRAINT chat_messages_user_type_check 
CHECK (user_type IN ('viewer', 'subscriber', 'moderator', 'broadcaster', 'owner'));