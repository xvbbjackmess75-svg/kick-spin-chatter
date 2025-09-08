-- Enable real-time for bonus hunt tables to ensure data synchronization
ALTER PUBLICATION supabase_realtime ADD TABLE bonus_hunt_bets;
ALTER PUBLICATION supabase_realtime ADD TABLE bonus_hunt_sessions;

-- Add replica identity to ensure complete row data is captured during updates
ALTER TABLE bonus_hunt_bets REPLICA IDENTITY FULL;
ALTER TABLE bonus_hunt_sessions REPLICA IDENTITY FULL;

-- Create index on bonus hunt bets for faster queries by session
CREATE INDEX IF NOT EXISTS idx_bonus_hunt_bets_session_id ON bonus_hunt_bets(session_id);
CREATE INDEX IF NOT EXISTS idx_bonus_hunt_bets_payout_recorded ON bonus_hunt_bets(payout_recorded_at) WHERE payout_recorded_at IS NOT NULL;

-- Create function to automatically update session balance when payout is recorded
CREATE OR REPLACE FUNCTION update_session_balance_on_payout()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- Create trigger for automatic balance updates
DROP TRIGGER IF EXISTS trigger_update_session_balance ON bonus_hunt_bets;
CREATE TRIGGER trigger_update_session_balance
    AFTER UPDATE ON bonus_hunt_bets
    FOR EACH ROW
    EXECUTE FUNCTION update_session_balance_on_payout();