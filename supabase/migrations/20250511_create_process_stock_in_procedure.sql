-- Create stored procedure for processing stock-in
CREATE OR REPLACE FUNCTION process_stock_in(
    stock_in_id UUID,
    processed_by UUID,
    boxes_data JSONB
)
RETURNS TABLE(
    id UUID,
    barcode TEXT,
    quantity INTEGER,
    color TEXT,
    size TEXT,
    warehouse_id UUID,
    location_id UUID,
    product_id UUID,
    created_by UUID
) AS $$
DECLARE
    v_stock_in RECORD;
    v_box RECORD;
    v_barcode TEXT;
    v_error TEXT;
BEGIN
    -- Check if stock-in exists and is pending
    SELECT * INTO v_stock_in 
    FROM stock_in 
    WHERE id = stock_in_id 
    AND status = 'pending';

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Stock-in request not found or not in pending status';
    END IF;

    -- Start transaction
    BEGIN
        -- Update stock-in status
        UPDATE stock_in 
        SET 
            status = 'completed',
            processed_by = processed_by,
            processed_at = NOW()
        WHERE id = stock_in_id;

        -- Insert stock-in details
        FOR v_box IN SELECT * FROM jsonb_to_recordset(boxes_data) AS x(
            barcode TEXT,
            quantity INTEGER,
            color TEXT,
            size TEXT,
            warehouse_id UUID,
            location_id UUID,
            product_id UUID
        )
        LOOP
            -- Validate barcode
            IF v_box.barcode IS NULL OR LENGTH(v_box.barcode) = 0 THEN
                RAISE EXCEPTION 'Invalid barcode for box';
            END IF;

            -- Insert stock-in detail
            INSERT INTO stock_in_details (
                stock_in_id,
                barcode,
                quantity,
                color,
                size,
                warehouse_id,
                location_id,
                product_id,
                created_by
            ) VALUES (
                stock_in_id,
                v_box.barcode,
                v_box.quantity,
                v_box.color,
                v_box.size,
                v_box.warehouse_id,
                v_box.location_id,
                v_box.product_id,
                processed_by
            )
            RETURNING id, barcode, quantity, color, size, warehouse_id, location_id, product_id, created_by
            INTO v_box.id;

            -- Insert into inventory
            INSERT INTO inventory (
                product_id,
                warehouse_id,
                location_id,
                barcode,
                quantity,
                color,
                size,
                batch_id,
                status,
                created_by
            ) VALUES (
                v_box.product_id,
                v_box.warehouse_id,
                v_box.location_id,
                v_box.barcode,
                v_box.quantity,
                v_box.color,
                v_box.size,
                stock_in_id,
                'available',
                processed_by
            );

            -- Return the box data
            RETURN NEXT v_box;
        END LOOP;

        -- Commit transaction
        COMMIT;

    EXCEPTION
        WHEN OTHERS THEN
            -- Rollback transaction on error
            ROLLBACK;
            RAISE EXCEPTION 'Error processing stock-in: %', SQLERRM;
    END;
END;
$$ LANGUAGE plpgsql;
