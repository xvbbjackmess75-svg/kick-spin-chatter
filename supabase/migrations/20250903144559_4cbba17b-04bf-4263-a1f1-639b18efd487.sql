-- Add columns to store provably fair information
ALTER TABLE public.giveaways 
ADD COLUMN winning_ticket INTEGER,
ADD COLUMN total_tickets INTEGER,
ADD COLUMN tickets_per_participant INTEGER;