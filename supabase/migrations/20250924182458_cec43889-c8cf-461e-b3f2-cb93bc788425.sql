-- Get the user_id for contact@kickhelper.app to preserve it
DO $$
DECLARE
    preserve_user_id uuid;
BEGIN
    -- Find the user_id for contact@kickhelper.app from profiles table
    SELECT user_id INTO preserve_user_id 
    FROM profiles p
    WHERE EXISTS (
        SELECT 1 FROM auth.users au 
        WHERE au.id = p.user_id 
        AND au.email = 'contact@kickhelper.app'
    )
    LIMIT 1;

    -- If we found the user, clean up all other data
    IF preserve_user_id IS NOT NULL THEN
        -- Delete all other user roles
        DELETE FROM user_roles 
        WHERE user_id != preserve_user_id;
        
        -- Delete all other profiles
        DELETE FROM profiles 
        WHERE user_id != preserve_user_id;
        
        -- Delete all other chatbot monitors
        DELETE FROM chatbot_monitors 
        WHERE user_id != preserve_user_id;
        
        -- Delete all other kick channels
        DELETE FROM kick_channels 
        WHERE user_id != preserve_user_id;
        
        -- Delete all other bot settings
        DELETE FROM bot_settings 
        WHERE user_id != preserve_user_id;
        
        -- Delete all other commands
        DELETE FROM commands 
        WHERE user_id != preserve_user_id;
        
        -- Delete all other giveaways and related data
        DELETE FROM giveaway_participants 
        WHERE giveaway_id IN (
            SELECT id FROM giveaways WHERE user_id != preserve_user_id
        );
        
        DELETE FROM giveaway_winners 
        WHERE giveaway_id IN (
            SELECT id FROM giveaways WHERE user_id != preserve_user_id
        );
        
        DELETE FROM giveaway_states 
        WHERE user_id != preserve_user_id;
        
        DELETE FROM giveaways 
        WHERE user_id != preserve_user_id;
        
        -- Delete all other slots events and related data
        DELETE FROM slots_calls 
        WHERE event_id IN (
            SELECT id FROM slots_events WHERE user_id != preserve_user_id
        );
        
        DELETE FROM slots_events 
        WHERE user_id != preserve_user_id;
        
        -- Delete all other bonus hunt data
        DELETE FROM bonus_hunt_bets 
        WHERE session_id IN (
            SELECT id FROM bonus_hunt_sessions WHERE user_id != preserve_user_id
        );
        
        DELETE FROM bonus_hunt_sessions 
        WHERE user_id != preserve_user_id;
        
        DELETE FROM bonus_hunt_overlay_settings 
        WHERE user_id != preserve_user_id;
        
        -- Delete all other overlay settings
        DELETE FROM overlay_settings 
        WHERE user_id != preserve_user_id;
        
        -- Delete chat messages for channels not owned by the preserved user
        DELETE FROM chat_messages 
        WHERE channel_id NOT IN (
            SELECT id FROM kick_channels WHERE user_id = preserve_user_id
        );
        
        RAISE NOTICE 'Successfully cleaned up database. Preserved user: %', preserve_user_id;
    ELSE
        RAISE NOTICE 'User contact@kickhelper.app not found. No cleanup performed.';
    END IF;
END $$;