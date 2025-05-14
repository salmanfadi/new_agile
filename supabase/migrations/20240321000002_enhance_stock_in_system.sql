-- Create enum types for status
CREATE TYPE stock_in_status AS ENUM ('pending', 'processing', 'completed', 'approved', 'rejected');
CREATE TYPE stock_in_detail_status AS ENUM ('pending', 'processing', 'completed', 'failed');

-- Add new columns to stock_in table
ALTER TABLE stock_in
ADD COLUMN IF NOT EXISTS batch_id UUID,
ADD COLUMN IF NOT EXISTS processing_started_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS processing_completed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS processed_by UUID REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS status stock_in_status DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add new columns to stock_in_details table
ALTER TABLE stock_in_details
ADD COLUMN IF NOT EXISTS status stock_in_detail_status DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS batch_number TEXT,
ADD COLUMN IF NOT EXISTS processing_order INTEGER,
ADD COLUMN IF NOT EXISTS processed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS error_message TEXT;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_stock_in_status ON stock_in(status);
CREATE INDEX IF NOT EXISTS idx_stock_in_batch_id ON stock_in(batch_id);
CREATE INDEX IF NOT EXISTS idx_stock_in_details_status ON stock_in_details(status);
CREATE INDEX IF NOT EXISTS idx_stock_in_details_batch_number ON stock_in_details(batch_number);

-- Add trigger to update stock_in status based on stock_in_details
CREATE OR REPLACE FUNCTION update_stock_in_status()
RETURNS TRIGGER AS $$
BEGIN
    -- If all details are completed, update stock_in to completed
    IF NOT EXISTS (
        SELECT 1 FROM stock_in_details 
        WHERE stock_in_id = NEW.stock_in_id 
        AND status != 'completed'
    ) THEN
        UPDATE stock_in 
        SET status = 'completed',
            processing_completed_at = CURRENT_TIMESTAMP
        WHERE id = NEW.stock_in_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER stock_in_details_status_trigger
AFTER UPDATE ON stock_in_details
FOR EACH ROW
WHEN (NEW.status = 'completed')
EXECUTE FUNCTION update_stock_in_status();

-- Add function to process stock-in details
CREATE OR REPLACE FUNCTION process_stock_in_detail(
    p_detail_id UUID,
    p_status stock_in_detail_status,
    p_error_message TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    UPDATE stock_in_details
    SET status = p_status,
        processed_at = CASE WHEN p_status = 'completed' THEN CURRENT_TIMESTAMP ELSE NULL END,
        error_message = p_error_message
    WHERE id = p_detail_id;
END;
$$ LANGUAGE plpgsql; 