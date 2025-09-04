-- Add unique constraint on user_id for chatbot_monitors table
ALTER TABLE public.chatbot_monitors ADD CONSTRAINT chatbot_monitors_user_id_unique UNIQUE (user_id);