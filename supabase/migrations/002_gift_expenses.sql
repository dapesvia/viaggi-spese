-- Migration: Add is_gift field to expenses and trips tables
-- Allows tracking gift expenses/trips that don't affect balance calculations

-- Add is_gift column to expenses
ALTER TABLE expenses 
ADD COLUMN IF NOT EXISTS is_gift BOOLEAN DEFAULT false;

-- Add is_gift column to trips (for trip initial cost)
ALTER TABLE trips 
ADD COLUMN IF NOT EXISTS is_gift BOOLEAN DEFAULT false;

-- Add comments for documentation
COMMENT ON COLUMN expenses.is_gift IS 'Indicates if the expense is a gift (paid by someone but not counted in balance calculations)';
COMMENT ON COLUMN trips.is_gift IS 'Indicates if the trip cost is a gift (paid by someone but not counted in balance calculations)';
