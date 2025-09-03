-- Update the check constraint to allow 'completed' status
ALTER TABLE public.giveaways 
DROP CONSTRAINT giveaways_status_check;

ALTER TABLE public.giveaways 
ADD CONSTRAINT giveaways_status_check 
CHECK (status = ANY (ARRAY['active'::text, 'ended'::text, 'cancelled'::text, 'completed'::text]));