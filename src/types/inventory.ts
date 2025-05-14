
// Define interfaces for inventory movement system

export type MovementType = 'in' | 'out' | 'adjustment' | 'reserve' | 'release';
export type MovementStatus = 'pending' | 'approved' | 'rejected' | 'in_transit';

export interface InventoryMovement {
  id: string;
  product_id: string;
  warehouse_id: string;
  location_id: string;
  movement_type: MovementType;
  quantity: number;
  status: MovementStatus;
  reference_table?: string;
  reference_id?: string;
  performed_by: string;
  created_at: string;
  details?: {
    barcode?: string;
    color?: string;
    size?: string;
    source?: string;
    notes?: string;
    [key: string]: any;
  };
  
  // Join fields
  product?: {
    name: string;
    sku?: string;
  };
  warehouse?: {
    name: string;
    location?: string;
  };
  location?: {
    floor: number;
    zone: string;
  };
  performer?: {
    name: string;
    username: string;
  };
}

export interface InventoryLedgerItem {
  product_id: string;
  product_name: string;
  product_sku?: string;
  warehouse_id: string;
  warehouse_name: string;
  location_id: string;
  location_name: string;
  stock_level: number;
  last_updated: string;
}

export interface InventoryMovementFilters {
  productId?: string;
  warehouseId?: string;
  locationId?: string;
  movementType?: MovementType;
  status?: MovementStatus;
  dateFrom?: string;
  dateTo?: string;
  referenceId?: string;
  performedBy?: string;
}
