
export interface Warehouse {
  id: string;
  name: string;
  code: string | null;
  location: string | null;
  address: string | null;
  contact_person: string | null;
  contact_phone: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface WarehouseLocation {
  id: string;
  warehouse_id: string;
  zone: string;
  floor: string;
  created_at: string;
  updated_at: string;
}

// Enhanced BatchData type with all needed properties
export interface BatchData {
  id: string;
  product_id: string;
  total_quantity: number;
  total_boxes: number;
  status: string;
  created_at: string;
  processed_at: string;
  warehouse_id: string;
  // Additional properties for barcode viewer
  batch_number?: string;
  barcodes?: string[];
  boxBarcodes?: string[];
  quantity_per_box?: number;
  quantityPerBox?: number;
  product_name?: string;
  product_sku?: string;
  warehouse_name?: string;
  location_name?: string;
  color?: string;
  size?: string;
  product: {
    id: string;
    name: string;
  };
}

// Updated interface for BarcodeViewerDialog
export interface BarcodeViewerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  batch: BatchData | null;
  batchData?: BatchData | null; // For backward compatibility
  batches?: BatchData[];
  onBatchChange?: (batchId: string) => void;
}
