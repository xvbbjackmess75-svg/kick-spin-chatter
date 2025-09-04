-- Add comprehensive slot database with popular slots (batch 1)
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
('Twin Spin', 'NetEnt', 96.55, 1000, 'Classic', false, null);