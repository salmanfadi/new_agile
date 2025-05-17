
export type ReportFilters = {
  dateRange?: {
    from: Date;
    to: Date;
  };
  warehouse?: string;
  product?: string;
  status?: string;
  user?: string;
  movementType?: string;
};

export type MovementType = 'stock-in' | 'stock-out' | 'transfer' | 'adjustment';

export type InventoryItem = {
  id: string;
  productId: string;
  productName: string;
  productSku: string;
  warehouseId: string;
  warehouseName: string;
  locationId: string;
  locationName: string;
  quantity: number;
  barcode: string;
  color: string;
  size: string;
  status: string;
};

export type InventoryMovement = {
  id: string;
  inventory_id: string;
  product_id: string;
  quantity: number;
  previous_quantity: number;
  movement_type: MovementType;
  reference_id: string;
  reference_table: string;
  created_at: string;
  warehouse_id: string;
  product_name: string;
  product_sku: string;
  warehouse_name: string;
};

export type ProcessedBatch = {
  id: string;
  stock_in_id: string;
  created_at: string;
  updated_at: string;
  status: string;
  quantity: number;
  boxes: number;
  notes?: string;
  submitted_by: string;
  processed_by: string;
  processing_time?: string;
  productId: string;
  productName: string;
  productSku: string;
  warehouse_id: string;
  warehouseName: string;
  submittedByName: string;
  processedByName: string;
};

export type AuditRecord = {
  id: string;
  event: string;
  userId: string;
  userName: string;
  timestamp: string;
  details: any;
  entity: string;
  entityId: string;
  ip_address?: string;
  severity: 'info' | 'warning' | 'critical';
};
