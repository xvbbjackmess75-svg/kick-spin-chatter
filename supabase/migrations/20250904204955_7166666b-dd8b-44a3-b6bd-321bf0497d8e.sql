-- Secure chat_messages table policies
DROP POLICY IF EXISTS "Insert chat messages for owned channels" ON public.chat_messages;

CREATE POLICY "Secure chat message insertion" 
ON public.chat_messages 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.kick_channels 
    WHERE kick_channels.id = chat_messages.channel_id 
    AND kick_channels.user_id = auth.uid()
  )
);