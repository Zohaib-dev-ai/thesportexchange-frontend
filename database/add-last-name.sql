-- Add last_name field to investors table
-- Run this SQL to add the last_name column

ALTER TABLE investors
ADD COLUMN last_name VARCHAR(255) NULL AFTER full_name;

-- Optional: Update existing records to split full_name into full_name and last_name
-- This is a simple example - you may need to adjust based on your data
-- UPDATE investors 
-- SET last_name = SUBSTRING_INDEX(full_name, ' ', -1),
--     full_name = SUBSTRING_INDEX(full_name, ' ', 1)
-- WHERE full_name LIKE '% %';
