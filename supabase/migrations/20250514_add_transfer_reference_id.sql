
-- Add transfer_reference_id column to inventory_movements table
ALTER TABLE inventory_movements ADD COLUMN transfer_reference_id UUID DEFAULT NULL;

-- Add indexes for transfer_reference_id
CREATE INDEX idx_inventory_movements_transfer_reference_id ON inventory_movements(transfer_reference_id);

-- Update movement_type enum to include 'transfer'
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'movement_type' AND typelem <> 0) THEN
        -- Create the enum if it doesn't exist
        CREATE TYPE movement_type AS ENUM ('in', 'out', 'adjustment', 'reserve', 'release', 'transfer');
    ELSE
        -- Add 'transfer' to the existing enum if it doesn't already include it
        BEGIN
            ALTER TYPE movement_type ADD VALUE 'transfer' IF NOT EXISTS;
        EXCEPTION
            WHEN duplicate_object THEN
                -- Type value already exists, do nothing
        END;
    END IF;
END$$;

-- Update RLS policies if they exist
DO $$
BEGIN
    -- Check if we need to drop existing policies
    IF EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'inventory_movements'
    ) THEN
        -- Drop existing policies
        DROP POLICY IF EXISTS admin_inventory_movements ON inventory_movements;
        DROP POLICY IF EXISTS warehouse_manager_inventory_movements ON inventory_movements;
        DROP POLICY IF EXISTS field_operator_inventory_movements ON inventory_movements;
        
        -- Recreate policies with updated permissions
        CREATE POLICY admin_inventory_movements ON inventory_movements
        FOR ALL TO authenticated
        USING (
            EXISTS (
                SELECT 1 FROM profiles 
                WHERE profiles.id = auth.uid() 
                AND profiles.role = 'admin'
            )
        );
        
        CREATE POLICY warehouse_manager_inventory_movements ON inventory_movements
        FOR ALL TO authenticated
        USING (
            EXISTS (
                SELECT 1 FROM profiles 
                WHERE profiles.id = auth.uid() 
                AND profiles.role = 'warehouse_manager'
            )
        );
        
        CREATE POLICY field_operator_inventory_movements ON inventory_movements
        FOR SELECT, INSERT TO authenticated
        USING (
            (performed_by = auth.uid() AND
            EXISTS (
                SELECT 1 FROM profiles 
                WHERE profiles.id = auth.uid() 
                AND profiles.role = 'field_operator'
            ))
        );
    END IF;
END$$;
