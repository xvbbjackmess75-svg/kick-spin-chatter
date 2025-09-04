-- Add comprehensive slot database with popular slots
INSERT INTO public.slots (name, provider, rtp, max_multiplier, theme, is_user_added, added_by_user_id) VALUES
-- Popular Play'n GO slots
('Big Win Cat', 'Play''n GO', 96.26, 5000, 'Animals', false, null),
('Charlie Chance in Hell to Pay', 'Play''n GO', 96.20, 2000, 'Adventure', false, null),
('Contact', 'Play''n GO', 96.20, 10000, 'Alien', false, null),
('Doom of Egypt', 'Play''n GO', 96.20, 5000, 'Egyptian', false, null),
('Golden Osiris', 'Play''n GO', 96.27, 5000, 'Egyptian', false, null),
('Honey Rush', 'Play''n GO', 96.50, 9000, 'Animals', false, null),
('Moon Princess', 'Play''n GO', 96.50, 5000, 'Anime', false, null),
('Rise of Olympus', 'Play''n GO', 96.50, 5000, 'Mythology', false, null),
('Tome of Madness', 'Play''n GO', 96.59, 2000, 'Horror', false, null),
('Wild North', 'Play''n GO', 96.55, 2000, 'Animals', false, null),

-- Pragmatic Play slots
('Aztec Bonanza', 'Pragmatic Play', 96.50, 5000, 'Adventure', false, null),
('Big Bass Bonanza', 'Pragmatic Play', 96.71, 2100, 'Animals', false, null),
('Bigger Bass Bonanza', 'Pragmatic Play', 96.71, 2100, 'Animals', false, null),
('Buffalo King', 'Pragmatic Play', 96.06, 5000, 'Animals', false, null),
('Great Rhino', 'Pragmatic Play', 96.53, 4000, 'Animals', false, null),
('John Hunter and the Tomb of the Scarab Queen', 'Pragmatic Play', 96.50, 10500, 'Adventure', false, null),
('Madame Destiny', 'Pragmatic Play', 96.66, 3600, 'Fortune', false, null),
('Money Train 2', 'Pragmatic Play', 96.40, 50000, 'Western', false, null),
('Starlight Princess', 'Pragmatic Play', 96.50, 5000, 'Fantasy', false, null),
('Sugar Rush', 'Pragmatic Play', 96.50, 5000, 'Candy', false, null),
('Wolf Gold', 'Pragmatic Play', 96.01, 2500, 'Animals', false, null),

-- NetEnt slots
('Blood Suckers', 'NetEnt', 98.00, 900, 'Horror', false, null),
('Dead or Alive 2', 'NetEnt', 96.82, 111111, 'Western', false, null),
('Divine Fortune', 'NetEnt', 96.59, 8000, 'Mythology', false, null),
('Jack and the Beanstalk', 'NetEnt', 96.28, 1000, 'Fantasy', false, null),
('Mega Fortune', 'NetEnt', 96.00, NULL, 'Luxury', false, null),
('Narcos', 'NetEnt', 96.23, 1506, 'Crime', false, null),
('Planet of the Apes', 'NetEnt', 96.33, 3000, 'Sci-Fi', false, null),
('Steam Tower', 'NetEnt', 97.04, 2000, 'Steampunk', false, null),
('Twin Spin', 'NetEnt', 96.55, 1000, 'Classic', false, null),

-- Push Gaming slots
('Big Bamboo', 'Push Gaming', 96.71, 50000, 'Adventure', false, null),
('Fat Rabbit', 'Push Gaming', 96.45, 50000, 'Animals', false, null),
('Jammin'' Jars', 'Push Gaming', 96.83, 20000, 'Fruit', false, null),
('Jammin'' Jars 2', 'Push Gaming', 96.40, 50000, 'Fruit', false, null),
('Mystery Museum', 'Push Gaming', 96.58, 5000, 'Adventure', false, null),
('The Shadow Order', 'Push Gaming', 96.98, 5000, 'Fantasy', false, null),
('Wild Swarm', 'Push Gaming', 97.03, 4500, 'Animals', false, null),

-- Big Time Gaming slots
('Bonanza', 'Big Time Gaming', 96.00, 12000, 'Mining', false, null),
('Danger High Voltage', 'Big Time Gaming', 95.67, 5000, 'Music', false, null),
('Extra Chilli', 'Big Time Gaming', 96.82, 20000, 'Mexican', false, null),
('Lil Devil', 'Big Time Gaming', 96.61, 50000, 'Horror', false, null),
('Megaways Jack', 'Big Time Gaming', 96.28, 250000, 'Adventure', false, null),
('Temple Tumble', 'Big Time Gaming', 96.25, 7767, 'Adventure', false, null),
('White Rabbit', 'Big Time Gaming', 97.24, 13000, 'Fantasy', false, null),
('Who Wants to Be a Millionaire', 'Big Time Gaming', 96.24, 50000, 'Game Show', false, null),

-- Nolimit City slots
('Deadwood', 'Nolimit City', 96.03, 13950, 'Western', false, null),
('East Coast vs West Coast', 'Nolimit City', 96.04, 30000, 'Hip Hop', false, null),
('Fire in the Hole', 'Nolimit City', 96.06, 60000, 'Mining', false, null),
('Mental', 'Nolimit City', 96.08, 66666, 'Horror', false, null),
('San Quentin', 'Nolimit City', 96.03, 150000, 'Prison', false, null),
('Tombstone', 'Nolimit City', 96.08, 300000, 'Western', false, null),
('Punk Rocker', 'Nolimit City', 96.54, 46656, 'Music', false, null),

-- Relax Gaming slots
('Beast Mode', 'Relax Gaming', 96.20, 50000, 'Animals', false, null),
('Buyin'' Da Vinci', 'Relax Gaming', 96.00, 30000, 'Art', false, null),
('Dead Man''s Trail', 'Relax Gaming', 96.21, 50000, 'Western', false, null),
('Hellcatraz', 'Relax Gaming', 96.46, 51840, 'Prison', false, null),
('Money Train', 'Relax Gaming', 96.20, 20000, 'Western', false, null),
('Snake Arena', 'Relax Gaming', 96.20, 50000, 'Animals', false, null),
('Temple Tumble 2', 'Relax Gaming', 94.25, 50000, 'Adventure', false, null),

-- Red Tiger slots
('Dragon''s Luck', 'Red Tiger', 96.29, 888, 'Asian', false, null),
('Primate King', 'Red Tiger', 96.16, 4000, 'Animals', false, null),
('Pirate''s Plenty', 'Red Tiger', 95.12, 5000, 'Pirates', false, null),
('Mystery Reels', 'Red Tiger', 96.24, 1000, 'Classic', false, null),
('Phoenix Fire', 'Red Tiger', 95.05, 7000, 'Mythology', false, null),

-- Yggdrasil slots
('Baron Samedi', 'Yggdrasil', 96.00, 55000, 'Horror', false, null),
('Golden Fish Tank', 'Yggdrasil', 96.40, 5000, 'Animals', false, null),
('Holmes and the Stolen Stones', 'Yggdrasil', 96.80, 5000, 'Detective', false, null),
('Jungle Books', 'Yggdrasil', 96.68, 3500, 'Adventure', false, null),
('Vikings go Berzerk', 'Yggdrasil', 96.10, 10976, 'Vikings', false, null),
('Vikings go Wild', 'Yggdrasil', 96.30, 2500, 'Vikings', false, null),

-- Hacksaw Gaming slots
('Chaos Crew', 'Hacksaw Gaming', 96.31, 25000, 'Street', false, null),
('Cubes 2', 'Hacksaw Gaming', 96.34, 5000, 'Abstract', false, null),
('Hand of Anubis', 'Hacksaw Gaming', 96.31, 10000, 'Egyptian', false, null),
('Le Bandit', 'Hacksaw Gaming', 96.35, 10000, 'Crime', false, null),
('RIP City', 'Hacksaw Gaming', 96.30, 25000, 'Street', false, null),
('Wanted Dead or a Wild', 'Hacksaw Gaming', 96.38, 12500, 'Western', false, null),

-- Thunderkick slots
('1429 Uncharted Seas', 'Thunderkick', 98.60, 670, 'Adventure', false, null),
('Barber Shop Uncut', 'Thunderkick', 97.00, 7000, 'Retro', false, null),
('Beat the Beast Griffin''s Gold', 'Thunderkick', 96.16, 22222, 'Mythology', false, null),
('Esqueleto Explosivo', 'Thunderkick', 96.00, 32000, 'Mexican', false, null),
('Flame Busters', 'Thunderkick', 96.10, 10000, 'Fire', false, null),
('Midas Golden Touch', 'Thunderkick', 96.10, 10100, 'Mythology', false, null),
('Pink Elephants', 'Thunderkick', 96.13, 8200, 'Animals', false, null),

-- Quickspin slots
('Big Bad Wolf', 'Quickspin', 97.29, 1250, 'Fantasy', false, null),
('Eastern Emeralds', 'Quickspin', 96.58, 15000, 'Asian', false, null),
('Goldilocks', 'Quickspin', 97.09, 2700, 'Fantasy', false, null),
('Ivan and the Immortal King', 'Quickspin', 96.59, 2500, 'Fantasy', false, null),
('Razortooth', 'Quickspin', 96.62, 13888, 'Prehistoric', false, null),
('Sakura Fortune', 'Quickspin', 96.58, 1000, 'Asian', false, null),

-- Elk Studios slots
('Cygnus', 'Elk Studios', 96.10, 2500, 'Space', false, null),
('DJ Wild', 'Elk Studios', 96.30, 1000, 'Music', false, null),
('Electric Sam', 'Elk Studios', 96.00, 2500, 'Fantasy', false, null),
('Sam on the Beach', 'Elk Studios', 96.30, 3125, 'Beach', false, null),
('Wild Toro', 'Elk Studios', 96.40, 2250, 'Spanish', false, null),

-- Blueprint Gaming slots
('Fishin'' Frenzy', 'Blueprint Gaming', 96.12, 2500, 'Animals', false, null),
('Genie Jackpots', 'Blueprint Gaming', 96.52, 250000, 'Arabian', false, null),
('Inspector Gadget', 'Blueprint Gaming', 95.10, 10000, 'Cartoon', false, null),
('King Kong Cash', 'Blueprint Gaming', 95.79, 1000, 'Animals', false, null),
('Primal Megaways', 'Blueprint Gaming', 96.68, 50000, 'Prehistoric', false, null),
('Ted', 'Blueprint Gaming', 95.78, 500, 'Comedy', false, null),

-- Additional popular slots from various providers
('Aztec Gold', 'Pragmatic Play', 96.52, 5000, 'Adventure', false, null),
('Buffalo King Megaways', 'Pragmatic Play', 96.06, 93750, 'Animals', false, null),
('Cash Patrol', 'Pragmatic Play', 96.56, 2000, 'Police', false, null),
('Drago - Jewels of Fortune', 'Pragmatic Play', 96.50, 48000, 'Fantasy', false, null),
('Fire Strike', 'Pragmatic Play', 96.48, 2500, 'Classic', false, null),
('Fruit Party', 'Pragmatic Play', 96.50, 5000, 'Fruit', false, null),
('Hot Safari', 'Pragmatic Play', 96.17, 6750, 'Animals', false, null),
('Jungle Gorilla', 'Pragmatic Play', 96.28, 1000, 'Animals', false, null),
('Madame Destiny Megaways', 'Pragmatic Play', 96.50, 50000, 'Fortune', false, null),
('Release the Kraken', 'Pragmatic Play', 96.50, 10000, 'Ocean', false, null),
('Spartan King', 'Pragmatic Play', 96.49, 5000, 'Ancient', false, null),
('Striking Hot 5', 'Pragmatic Play', 96.50, 625, 'Classic', false, null),
('Temujin Treasures', 'Pragmatic Play', 96.50, 5000, 'Adventure', false, null),
('Wild West Gold', 'Pragmatic Play', 96.51, 5000, 'Western', false, null)
ON CONFLICT (name, provider) DO NOTHING;