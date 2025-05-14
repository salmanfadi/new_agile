-- Create stock movement audit table
CREATE TABLE IF NOT EXISTS stock_movement_audit (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    inventory_id UUID NOT NULL REFERENCES stock_in_details(id),
    movement_type TEXT NOT NULL CHECK (movement_type IN ('stock_in', 'stock_out', 'batch')),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    previous_quantity INTEGER NOT NULL CHECK (previous_quantity >= 0),
    new_quantity INTEGER NOT NULL CHECK (new_quantity >= 0),
    performed_by UUID NOT NULL REFERENCES auth.users(id),
    performed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    notes TEXT,
    reference_id UUID,
    reference_type TEXT CHECK (reference_type IN ('stock_in', 'stock_out', 'batch')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_stock_movement_audit_inventory_id ON stock_movement_audit(inventory_id);
CREATE INDEX IF NOT EXISTS idx_stock_movement_audit_performed_by ON stock_movement_audit(performed_by);
CREATE INDEX IF NOT EXISTS idx_stock_movement_audit_movement_type ON stock_movement_audit(movement_type);
CREATE INDEX IF NOT EXISTS idx_stock_movement_audit_reference_id ON stock_movement_audit(reference_id);

-- Add RLS policies
ALTER TABLE stock_movement_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for authenticated users" ON stock_movement_audit
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Enable insert for warehouse managers" ON stock_movement_audit
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'warehouse_manager'
        )
    );

-- Add trigger for updated_at
CREATE TRIGGER set_timestamp
    BEFORE UPDATE ON stock_movement_audit
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp(); 