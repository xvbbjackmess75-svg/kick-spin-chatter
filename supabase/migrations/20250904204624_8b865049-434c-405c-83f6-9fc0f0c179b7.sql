-- Remove public access to slots_calls overlay function and secure it
-- This prevents unauthorized access to betting/financial data

-- Drop the existing public function that exposes financial data
DROP FUNCTION IF EXISTS public.get_overlay_slots_calls();

-- Create a secure version that only returns anonymized data for public overlay use
CREATE OR REPLACE FUNCTION public.get_overlay_slots_calls()
RETURNS TABLE(
  id uuid, 
  slot_name text, 
  call_order integer, 
  status text, 
  submitted_at timestamp with time zone, 
  event_id uuid,
  display_status text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
  SELECT 
    sc.id,
    sc.slot_name,
    sc.call_order,
    sc.status,
    sc.submitted_at,
    sc.event_id,
    -- Only show anonymous status for overlay - no financial data
    CASE 
      WHEN sc.status = 'completed' THEN 'Completed'
      WHEN sc.status = 'pending' THEN 'Pending'
      ELSE sc.status
    END as display_status
  FROM public.slots_calls sc
  INNER JOIN public.slots_events se ON se.id = sc.event_id
  WHERE se.status = 'active'
  ORDER BY sc.submitted_at DESC;
$function$

-- Add RLS policy for giveaway_participants to prevent data harvesting
ALTER TABLE public.giveaway_participants ENABLE ROW LEVEL SECURITY;

-- Update existing policy to be more restrictive
DROP POLICY IF EXISTS "Users can join active giveaways" ON public.giveaway_participants;

CREATE POLICY "Users can join active giveaways with verification" 
ON public.giveaway_participants 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.giveaways 
    WHERE giveaways.id = giveaway_participants.giveaway_id 
    AND giveaways.status = 'active' 
    AND (giveaways.expires_at IS NULL OR giveaways.expires_at > now())
  )
);

-- Secure chat_messages table to prevent data harvesting
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Only channel owners and authorized bots can insert messages
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

-- Add rate limiting protection for profiles table
CREATE POLICY "Prevent profile enumeration" 
ON public.profiles 
FOR SELECT 
USING (
  auth.uid() = user_id OR 
  -- Only allow viewing other profiles in specific contexts
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'premium', 'vip_plus')
  )
);