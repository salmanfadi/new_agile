-- Add boxes column to stock_in_details table
ALTER TABLE stock_in_details
ADD COLUMN boxes INTEGER NOT NULL DEFAULT 1;

-- Add index for better query performance
CREATE INDEX idx_stock_in_details_boxes ON stock_in_details(boxes);
