-- Add unique constraint to prevent duplicate slot calls per user per event for the same slot
CREATE UNIQUE INDEX IF NOT EXISTS unique_slot_call_per_user_event 
ON public.slots_calls (event_id, viewer_kick_id, slot_name);

-- Add a check to ensure max_calls_per_user is reasonable
ALTER TABLE public.slots_events 
ADD CONSTRAINT check_max_calls_reasonable 
CHECK (max_calls_per_user >= 1 AND max_calls_per_user <= 10);