/*
  # Add approved_quantity column to stock_out table

  1. New Columns
    - `approved_quantity` (integer, nullable) - Stores the approved quantity for stock out requests

  2. Changes
    - Add approved_quantity column to stock_out table
    - Column allows null values to maintain backward compatibility
    - No default value set to preserve existing data integrity

  3. Notes
    - This column will be used to track the approved quantity for stock out requests
    - Existing records will have null values for this column
    - Future stock out approvals can set this value as needed
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'stock_out' AND column_name = 'approved_quantity'
  ) THEN
    ALTER TABLE stock_out ADD COLUMN approved_quantity integer;
  END IF;
END $$;