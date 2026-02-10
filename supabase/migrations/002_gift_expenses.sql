-- Migration: Add is_gift field to expenses table
-- Allows tracking gift expenses that don't affect balance calculations

-- Add is_gift column to expenses
ALTER TABLE expenses 
ADD COLUMN IF NOT EXISTS is_gift BOOLEAN DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN expenses.is_gift IS 'Indicates if the expense is a gift (paid by someone but not counted in balance calculations)';
