/*
  # Add approved_quantity column to stock_out table

  1. Changes
    - Add `approved_quantity` column to `stock_out` table
    - Column is nullable to allow for cases where approval quantity is not set
    - Add index for performance on approved_quantity queries

  2. Security
    - No changes to RLS policies needed as this is just adding a column
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

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_stock_out_approved_quantity 
ON stock_out (approved_quantity) 
WHERE approved_quantity IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN stock_out.approved_quantity IS 'The quantity approved by warehouse manager for stock out';