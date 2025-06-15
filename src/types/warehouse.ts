import { BoxData } from './shared';

export interface BatchData {
  // Core fields
  id: string;
  warehouse_id: string;
  warehouse_name: string;
  location_id: string;
  location_name: string;
  boxCount: number;
  quantityPerBox: number;
  color: string | null;
  size: string | null;
  boxes: BoxData[];
  batchBarcode?: string;
  boxBarcodes?: string[];
  
  // For backward compatibility with BarcodeViewerDialog
  batch_number?: string;
  product_name?: string;
  product_sku?: string;
  quantity_per_box?: number;
  barcodes?: string[]; // Alias for boxBarcodes
}

export interface BarcodeViewerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  batchData: BatchData | null;
  batches?: BatchData[];
  onBatchChange?: (batchId: string) => void;
}
