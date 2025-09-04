-- First, delete duplicate slot calls, keeping only the earliest one for each user/event/slot combination
WITH duplicates AS (
  SELECT id, 
         ROW_NUMBER() OVER (PARTITION BY event_id, viewer_kick_id, slot_name ORDER BY submitted_at ASC) as rn
  FROM public.slots_calls
)
DELETE FROM public.slots_calls 
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- Now add the unique constraint to prevent future duplicates
CREATE UNIQUE INDEX unique_slot_call_per_user_event 
ON public.slots_calls (event_id, viewer_kick_id, slot_name);

-- Add a check to ensure max_calls_per_user is reasonable  
ALTER TABLE public.slots_events 
ADD CONSTRAINT check_max_calls_reasonable 
CHECK (max_calls_per_user >= 1 AND max_calls_per_user <= 10);