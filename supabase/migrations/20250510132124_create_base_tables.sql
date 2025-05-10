-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types for status and movement types
CREATE TYPE stock_status AS ENUM ('pending', 'approved', 'rejected', 'completed');
CREATE TYPE movement_type AS ENUM ('in', 'out', 'transfer');
CREATE TYPE batch_status AS ENUM ('pending', 'processing', 'completed', 'failed');

-- Create base tables
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    role TEXT CHECK (role IN ('admin', 'warehouse_manager', 'field_operator', 'sales_operator')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS warehouses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS warehouse_locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    warehouse_id UUID REFERENCES warehouses(id),
    zone TEXT NOT NULL,
    floor TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    specifications JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create stock_in and stock_in_details before inventory
CREATE TABLE IF NOT EXISTS stock_in (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    warehouse_id UUID REFERENCES warehouses(id),
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status stock_status DEFAULT 'pending',
    approved_by UUID REFERENCES profiles(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    notes TEXT
);

CREATE TABLE IF NOT EXISTS stock_in_details (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stock_in_id UUID REFERENCES stock_in(id),
    product_id UUID REFERENCES products(id),
    quantity INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stock_out (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    warehouse_id UUID REFERENCES warehouses(id),
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status stock_status DEFAULT 'pending',
    approved_by UUID REFERENCES profiles(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    notes TEXT
);

CREATE TABLE IF NOT EXISTS stock_out_details (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stock_out_id UUID REFERENCES stock_out(id),
    product_id UUID REFERENCES products(id),
    quantity INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Now create inventory, which references stock_in and stock_in_details
CREATE TABLE IF NOT EXISTS inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id),
    warehouse_location_id UUID REFERENCES warehouse_locations(id),
    quantity INTEGER NOT NULL DEFAULT 0,
    barcode TEXT UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    stock_in_id UUID REFERENCES stock_in(id),
    stock_in_detail_id UUID REFERENCES stock_in_details(id),
    last_updated_by UUID REFERENCES profiles(id),
    last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status stock_status DEFAULT 'completed'
);

-- Create audit table for stock movements
CREATE TABLE IF NOT EXISTS stock_movement_audit (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inventory_id UUID REFERENCES inventory(id),
    movement_type movement_type,
    quantity INTEGER NOT NULL,
    previous_quantity INTEGER NOT NULL,
    new_quantity INTEGER NOT NULL,
    performed_by UUID REFERENCES profiles(id),
    performed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT,
    reference_id UUID, -- Can reference stock_in, stock_out, or batch_operations
    reference_type TEXT CHECK (reference_type IN ('stock_in', 'stock_out', 'batch'))
);

-- Create batch processing tables
CREATE TABLE IF NOT EXISTS batch_operations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_number TEXT UNIQUE NOT NULL,
    operation_type movement_type NOT NULL,
    status batch_status DEFAULT 'pending',
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    source_warehouse_id UUID REFERENCES warehouses(id),
    destination_warehouse_id UUID REFERENCES warehouses(id)
);

CREATE TABLE IF NOT EXISTS batch_inventory_items (
    batch_id UUID REFERENCES batch_operations(id),
    inventory_id UUID REFERENCES inventory(id),
    product_id UUID REFERENCES products(id),
    warehouse_location_id UUID REFERENCES warehouse_locations(id),
    stock_in_detail_id UUID REFERENCES stock_in_details(id),
    quantity INTEGER NOT NULL,
    PRIMARY KEY (batch_id, inventory_id, product_id, warehouse_location_id, stock_in_detail_id)
);

-- Barcodes table for real-time barcode management
CREATE TABLE IF NOT EXISTS barcodes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    barcode TEXT UNIQUE NOT NULL,
    batch_id UUID REFERENCES stock_in(id) ON DELETE SET NULL,
    box_id UUID,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    warehouse_id UUID REFERENCES warehouses(id) ON DELETE SET NULL,
    location_id UUID REFERENCES warehouse_locations(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT DEFAULT 'active'
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_inventory_product ON inventory(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_location ON inventory(warehouse_location_id);
CREATE INDEX IF NOT EXISTS idx_stock_in_warehouse ON stock_in(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_stock_out_warehouse ON stock_out(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_inventory_stock_in ON inventory(stock_in_id);
CREATE INDEX IF NOT EXISTS idx_inventory_stock_in_detail ON inventory(stock_in_detail_id);
CREATE INDEX IF NOT EXISTS idx_inventory_last_updated_by ON inventory(last_updated_by);
CREATE INDEX IF NOT EXISTS idx_stock_movement_audit_inventory ON stock_movement_audit(inventory_id);
CREATE INDEX IF NOT EXISTS idx_stock_movement_audit_performed_by ON stock_movement_audit(performed_by);
CREATE INDEX IF NOT EXISTS idx_batch_operations_status ON batch_operations(status);
CREATE INDEX IF NOT EXISTS idx_batch_operations_created_by ON batch_operations(created_by);
CREATE INDEX IF NOT EXISTS idx_barcodes_barcode ON barcodes(barcode);
CREATE INDEX IF NOT EXISTS idx_barcodes_batch_id ON barcodes(batch_id);
CREATE INDEX IF NOT EXISTS idx_barcodes_product_id ON barcodes(product_id);
CREATE INDEX IF NOT EXISTS idx_barcodes_warehouse_id ON barcodes(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_barcodes_location_id ON barcodes(location_id);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouse_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_in ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_in_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_out ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_out_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movement_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE batch_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE batch_inventory_items ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies
CREATE POLICY "Public profiles are viewable by everyone"
    ON profiles FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id);

-- Create policies for inventory
CREATE POLICY "Admins can do everything with inventory"
    ON inventory FOR ALL
    TO authenticated
    USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Warehouse managers can view and update inventory"
    ON inventory FOR SELECT
    TO authenticated
    USING (auth.jwt() ->> 'role' = 'warehouse_manager');

CREATE POLICY "Field operators can view inventory"
    ON inventory FOR SELECT
    TO authenticated
    USING (auth.jwt() ->> 'role' = 'field_operator');

-- Create policies for stock movement audit
CREATE POLICY "Admins can view all audit records"
    ON stock_movement_audit FOR SELECT
    TO authenticated
    USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Warehouse managers can view audit records"
    ON stock_movement_audit FOR SELECT
    TO authenticated
    USING (auth.jwt() ->> 'role' = 'warehouse_manager');

-- Create policies for batch operations
CREATE POLICY "Admins can manage all batch operations"
    ON batch_operations FOR ALL
    TO authenticated
    USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Warehouse managers can manage batch operations"
    ON batch_operations FOR ALL
    TO authenticated
    USING (auth.jwt() ->> 'role' = 'warehouse_manager');

CREATE POLICY "Field operators can create batch operations"
    ON batch_operations FOR INSERT
    TO authenticated
    WITH CHECK (auth.jwt() ->> 'role' = 'field_operator');

-- Create function to handle updated_at
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON warehouses
    FOR EACH ROW
    EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON warehouse_locations
    FOR EACH ROW
    EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON inventory
    FOR EACH ROW
    EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON stock_in
    FOR EACH ROW
    EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON stock_in_details
    FOR EACH ROW
    EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON stock_out
    FOR EACH ROW
    EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON stock_out_details
    FOR EACH ROW
    EXECUTE FUNCTION handle_updated_at();

-- Create function to update inventory and create audit record
CREATE OR REPLACE FUNCTION update_inventory_with_audit()
RETURNS TRIGGER AS $$
BEGIN
    -- Update last_updated fields
    NEW.last_updated_by = auth.uid();
    NEW.last_updated_at = NOW();
    
    -- Create audit record
    INSERT INTO stock_movement_audit (
        inventory_id,
        movement_type,
        quantity,
        previous_quantity,
        new_quantity,
        performed_by,
        reference_id,
        reference_type
    ) VALUES (
        NEW.id,
        CASE 
            WHEN NEW.quantity > OLD.quantity THEN 'in'
            WHEN NEW.quantity < OLD.quantity THEN 'out'
            ELSE 'transfer'
        END,
        ABS(NEW.quantity - OLD.quantity),
        OLD.quantity,
        NEW.quantity,
        auth.uid(),
        NEW.stock_in_id,
        'stock_in'
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for inventory updates
CREATE TRIGGER inventory_update_audit
    BEFORE UPDATE ON inventory
    FOR EACH ROW
    WHEN (OLD.quantity IS DISTINCT FROM NEW.quantity)
    EXECUTE FUNCTION update_inventory_with_audit();

-- Create function to handle batch operations
CREATE OR REPLACE FUNCTION process_batch_operation()
RETURNS TRIGGER AS $$
DECLARE
    bi RECORD;
    inv_id UUID;
BEGIN
    -- Update batch status
    IF NEW.status = 'completed' THEN
        NEW.completed_at = NOW();
        
        -- For each batch_inventory_item, create or update inventory
        FOR bi IN SELECT * FROM batch_inventory_items WHERE batch_id = NEW.id LOOP
            -- Try to find an existing inventory record
            SELECT id INTO inv_id FROM inventory
            WHERE product_id = bi.product_id
              AND warehouse_location_id = bi.warehouse_location_id
            LIMIT 1;
            
            IF inv_id IS NOT NULL THEN
                -- Update existing inventory
                UPDATE inventory
                SET quantity = quantity + bi.quantity,
                    stock_in_id = NEW.id,
                    stock_in_detail_id = bi.stock_in_detail_id,
                    last_updated_by = auth.uid(),
                    last_updated_at = NOW(),
                    status = 'completed'
                WHERE id = inv_id;
            ELSE
                -- Insert new inventory record
                INSERT INTO inventory (
                    product_id, warehouse_location_id, quantity, stock_in_id, stock_in_detail_id, last_updated_by, last_updated_at, status, created_at, updated_at
                ) VALUES (
                    bi.product_id, bi.warehouse_location_id, bi.quantity, NEW.id, bi.stock_in_detail_id, auth.uid(), NOW(), 'completed', NOW(), NOW()
                );
            END IF;
        END LOOP;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for batch operations
CREATE TRIGGER batch_operation_process
    BEFORE UPDATE ON batch_operations
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status)
    EXECUTE FUNCTION process_batch_operation();
