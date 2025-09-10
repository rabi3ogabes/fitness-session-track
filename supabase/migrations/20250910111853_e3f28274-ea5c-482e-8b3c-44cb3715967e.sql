-- Fix the remaining sessions calculation for the user who should have 9 remaining
-- Based on the data showing sessions: 9 and total_sessions: 9, 
-- it seems they have used 0 sessions, so remaining should be 9

UPDATE members 
SET remaining_sessions = 9 
WHERE email = 'rabii1@gmail.com' 
AND remaining_sessions = 2;