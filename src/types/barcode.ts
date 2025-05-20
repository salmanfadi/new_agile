
export interface BatchItem {
  id: string;
  barcode: string;
  batch_id: string;
  warehouse_id: string;
  location_id: string;
  quantity: number;
  color?: string;
  size?: string;
  status: string;
  created_at: string;
}

export interface BoxDetails {
  id: string;
  barcode: string;
  batch_id?: string;
  productId: string;
  productName: string;
  productSku?: string;
  status: string;
  quantity: number;
  color?: string;
  size?: string;
  warehouseId?: string;
  warehouseName?: string;
  locationId?: string;
  locationDetails?: string;
  created_at: string;
  updated_at: string;
  history?: Array<{
    id: string;
    event_type: string;
    created_at: string;
    details?: string;
    user?: {
      id: string;
      name: string;
    };
  }>;
}
