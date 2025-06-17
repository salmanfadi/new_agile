/*
  # Add approved_quantity column to stock_out table

  1. New Columns
    - `approved_quantity` (integer, nullable) - stores the quantity approved by warehouse manager
  
  2. Changes
    - Add approved_quantity column to stock_out table
    - Set default value to null to allow for pending requests
*/

-- Add approved_quantity column to stock_out table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'stock_out' AND column_name = 'approved_quantity'
  ) THEN
    ALTER TABLE stock_out ADD COLUMN approved_quantity integer;
  END IF;
END $$;

-- Add comment for the new column
COMMENT ON COLUMN stock_out.approved_quantity IS 'Quantity approved by warehouse manager for stock out';