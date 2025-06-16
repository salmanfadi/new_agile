/*
  # Add approved_quantity column to stock_out table

  1. Changes
    - Add `approved_quantity` column to `stock_out` table
    - Set default value to NULL
    - Add check constraint to ensure approved_quantity is positive when not null

  2. Security
    - No changes to existing RLS policies
*/

-- Add approved_quantity column to stock_out table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'stock_out' AND column_name = 'approved_quantity'
  ) THEN
    ALTER TABLE stock_out ADD COLUMN approved_quantity integer;
    
    -- Add check constraint to ensure approved_quantity is positive when not null
    ALTER TABLE stock_out ADD CONSTRAINT stock_out_approved_quantity_check 
      CHECK (approved_quantity IS NULL OR approved_quantity > 0);
  END IF;
END $$;