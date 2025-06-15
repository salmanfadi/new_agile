
export interface Location {
  id: string;
  name?: string;
  description?: string;
  warehouse_id: string;
  zone: string;
  floor: string;
  created_at: string;
  updated_at?: string;
}

export interface WarehouseLocationDetails {
  id: string;
  warehouse_id: string;
  zone: string;
  floor: string;
  created_at: string;
  updated_at?: string;
}
