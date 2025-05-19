
-- Drop the existing constraint that's causing problems
ALTER TABLE inventory DROP CONSTRAINT IF EXISTS fk_inventory_stock_in_details;

-- Make the stock_in_detail_id column nullable to prevent issues during record creation
ALTER TABLE inventory ALTER COLUMN stock_in_detail_id DROP NOT NULL;

-- Add the constraint back but now allowing NULL values
ALTER TABLE inventory 
  ADD CONSTRAINT fk_inventory_stock_in_detail_id
  FOREIGN KEY (stock_in_detail_id)
  REFERENCES stock_in_details(id)
  DEFERRABLE INITIALLY DEFERRED; -- This allows us to create records in any order within a transaction

-- Add related index for performance
CREATE INDEX IF NOT EXISTS idx_inventory_stock_in_detail_id ON inventory(stock_in_detail_id);

-- Update the batch processing function to handle the dependencies correctly
CREATE OR REPLACE FUNCTION public.create_inventory_from_batch_item()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
    -- Get the product_id from the associated batch
    INSERT INTO inventory (
        product_id,
        warehouse_id,
        location_id,
        barcode,
        quantity,
        color,
        size,
        status,
        batch_id,
        stock_in_detail_id -- Allow NULL here temporarily
    )
    SELECT
        pb.product_id,
        NEW.warehouse_id,
        NEW.location_id,
        NEW.barcode,
        NEW.quantity,
        NEW.color,
        NEW.size,
        'available',
        NEW.batch_id,
        NULL -- Initialize with NULL, will be updated later
    FROM
        processed_batches pb
    WHERE
        pb.id = NEW.batch_id;
        
    RETURN NEW;
END;
$function$;
