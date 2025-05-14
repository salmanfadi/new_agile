-- Add status column to stock_in_details
ALTER TABLE stock_in_details 
ADD COLUMN status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
ADD COLUMN batch_number TEXT,
ADD COLUMN processing_order INTEGER,
ADD COLUMN processed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN error_message TEXT;

-- Add index for status
CREATE INDEX idx_stock_in_details_status ON stock_in_details(status);

-- Add index for batch_number
CREATE INDEX idx_stock_in_details_batch_number ON stock_in_details(batch_number); 