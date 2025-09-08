-- Fix the trigger function to run with definer privileges to bypass RLS
CREATE OR REPLACE FUNCTION public.update_session_balance_on_payout()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
    -- When a payout is recorded, recalculate the session balance
    IF NEW.payout_recorded_at IS NOT NULL AND OLD.payout_recorded_at IS NULL THEN
        -- This is a new payout being recorded
        UPDATE bonus_hunt_sessions 
        SET current_balance = (
            SELECT 
                starting_balance + COALESCE(SUM(payout_amount), 0) - COALESCE(SUM(bet_size), 0)
            FROM bonus_hunt_bets 
            WHERE session_id = NEW.session_id 
            AND payout_recorded_at IS NOT NULL
        )
        WHERE id = NEW.session_id;
    END IF;
    
    RETURN NEW;
END;
$function$;