-- Update membership types with correct sessions and prices
UPDATE membership_types 
SET sessions = 1, price = 80 
WHERE name = 'Basic';

UPDATE membership_types 
SET sessions = 8, price = 690 
WHERE name = 'Standard';

UPDATE membership_types 
SET sessions = 10, price = 790 
WHERE name = 'Premium';