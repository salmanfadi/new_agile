-- Add batch processing columns to stock_in table
ALTER TABLE stock_in 
ADD COLUMN batch_id UUID DEFAULT uuid_generate_v4(),
ADD COLUMN processing_started_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN processing_completed_at TIMESTAMP WITH TIME ZONE;

-- Add status tracking to stock_in_details
ALTER TABLE stock_in_details 
ADD COLUMN status TEXT DEFAULT 'pending' 
  CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
ADD COLUMN batch_number TEXT,
ADD COLUMN processing_order INTEGER,
ADD COLUMN processed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN error_message TEXT;

-- Add index for batch processing
CREATE INDEX idx_stock_in_batch_id ON stock_in(batch_id);
CREATE INDEX idx_stock_in_details_batch_number ON stock_in_details(batch_number);
CREATE INDEX idx_stock_in_details_status ON stock_in_details(status);

-- Add comment to explain the batch processing system
COMMENT ON COLUMN stock_in.batch_id IS 'Unique identifier for grouping related stock-in operations';
COMMENT ON COLUMN stock_in_details.status IS 'Current processing status of the stock-in detail record';
COMMENT ON COLUMN stock_in_details.batch_number IS 'Identifier for tracking items within a batch';
COMMENT ON COLUMN stock_in_details.processing_order IS 'Order in which items should be processed within a batch'; 