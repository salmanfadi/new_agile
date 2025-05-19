
-- This migration fixes the relationship between inventory, stock_in_details, and processed_batches

-- First, temporarily disable the foreign key constraint
ALTER TABLE inventory DROP CONSTRAINT IF EXISTS fk_inventory_stock_in_details;

-- Make sure batch_id in inventory refers to processed_batches.id
ALTER TABLE inventory 
  DROP CONSTRAINT IF EXISTS fk_inventory_batch_id;

ALTER TABLE inventory
  ADD CONSTRAINT fk_inventory_batch_id
  FOREIGN KEY (batch_id)
  REFERENCES processed_batches(id);

-- Add a reference back to stock_in_details.id
ALTER TABLE inventory 
  DROP CONSTRAINT IF EXISTS fk_inventory_stock_in_detail_id;

ALTER TABLE inventory
  ADD CONSTRAINT fk_inventory_stock_in_detail_id
  FOREIGN KEY (stock_in_detail_id)
  REFERENCES stock_in_details(id);

-- Make sure batch_number in stock_in_details can be a UUID
ALTER TABLE stock_in_details
  ALTER COLUMN batch_number TYPE UUID USING batch_number::UUID;

-- Add index on barcode for faster lookups
CREATE INDEX IF NOT EXISTS idx_inventory_barcode ON inventory (barcode);
CREATE INDEX IF NOT EXISTS idx_stock_in_details_barcode ON stock_in_details (barcode);

-- Add a function to check for duplicate barcodes before insertion
CREATE OR REPLACE FUNCTION check_barcode_exists()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM inventory WHERE barcode = NEW.barcode) THEN
    RAISE EXCEPTION 'Barcode % already exists in inventory', NEW.barcode;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to check for duplicate barcodes
DROP TRIGGER IF EXISTS check_inventory_barcode_exists ON inventory;
CREATE TRIGGER check_inventory_barcode_exists
BEFORE INSERT ON inventory
FOR EACH ROW
EXECUTE FUNCTION check_barcode_exists();
