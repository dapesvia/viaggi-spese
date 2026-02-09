-- Migration for Enhanced Cost Management
-- Adds columns for manual cost splitting and payer tracking

ALTER TABLE trips 
ADD COLUMN IF NOT EXISTS cost_payer TEXT DEFAULT 'split',
ADD COLUMN IF NOT EXISTS cost_split_manual_alex numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS cost_split_manual_tina numeric DEFAULT 0;

ALTER TABLE trips 
ADD CONSTRAINT check_cost_payer CHECK (cost_payer IN ('alex', 'tina', 'split', 'custom'));
