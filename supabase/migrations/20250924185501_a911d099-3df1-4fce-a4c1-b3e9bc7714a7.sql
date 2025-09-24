-- Remove non-verified participants from verified-only giveaways
DELETE FROM giveaway_participants 
WHERE giveaway_id IN (
  SELECT id FROM giveaways WHERE verified_only = true
)
AND kick_username NOT IN (
  SELECT linked_kick_username 
  FROM profiles 
  WHERE linked_kick_user_id IS NOT NULL 
  AND linked_discord_user_id IS NOT NULL
  AND linked_kick_username IS NOT NULL
);

-- Update participant counts for affected giveaways
UPDATE giveaways 
SET participants_count = (
  SELECT COUNT(*) 
  FROM giveaway_participants 
  WHERE giveaway_participants.giveaway_id = giveaways.id
)
WHERE verified_only = true;