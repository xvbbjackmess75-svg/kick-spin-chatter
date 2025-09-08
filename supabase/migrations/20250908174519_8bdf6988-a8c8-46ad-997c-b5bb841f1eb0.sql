-- Fix the trigger function SQL error - starting_balance should come from session, not bets
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
                bhs.starting_balance + COALESCE(SUM(bhb.payout_amount), 0) - COALESCE(SUM(bhb.bet_size), 0)
            FROM bonus_hunt_sessions bhs
            LEFT JOIN bonus_hunt_bets bhb ON bhb.session_id = bhs.id AND bhb.payout_recorded_at IS NOT NULL
            WHERE bhs.id = NEW.session_id
            GROUP BY bhs.starting_balance
        )
        WHERE id = NEW.session_id;
    END IF;
    
    RETURN NEW;
END;
$function$;