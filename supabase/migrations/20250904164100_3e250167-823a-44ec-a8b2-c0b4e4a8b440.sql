-- Add foreign key relationship between bonus_hunt_bets and slots
ALTER TABLE public.bonus_hunt_bets 
ADD CONSTRAINT fk_bonus_hunt_bets_slot_id 
FOREIGN KEY (slot_id) REFERENCES public.slots(id) ON DELETE CASCADE;