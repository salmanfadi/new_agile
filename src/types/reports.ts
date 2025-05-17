
import { InventoryItem } from "@/hooks/useInventoryData";
import { InventoryMovement } from "@/types/inventory";
import { ProcessedBatch } from "@/types/database";
import { StockInRequest, StockOutRequest, Warehouse, WarehouseLocation } from "@/types/database";

// Common types for reports
export type ReportDateRange = {
  from: Date | null;
  to: Date | null;
};

export type ReportFilters = {
  dateRange: ReportDateRange;
  warehouseId?: string;
  productId?: string;
  locationId?: string;
  batchId?: string;
  status?: string;
  userId?: string;
};

export type ReportData<T> = {
  data: T[];
  summary: Record<string, any>;
  loading: boolean;
  error: Error | null;
};

// Types for specific report data
export type InventoryStatusData = {
  items: InventoryItem[];
  totalItems: number;
  totalQuantity: number;
  byStatus: Record<string, number>;
  byWarehouse: Record<string, number>;
};

export type InventoryMovementData = {
  movements: InventoryMovement[];
  totalIn: number;
  totalOut: number;
  netChange: number;
  byProduct: Record<string, number>;
  byWarehouse: Record<string, number>;
};

export type BatchTrackingData = {
  batches: ProcessedBatch[];
  totalBatches: number;
  totalQuantity: number;
  byStatus: Record<string, number>;
  bySource: Record<string, number>;
};

export type WarehouseUtilizationData = {
  warehouses: Warehouse[];
  locations: WarehouseLocation[];
  totalLocations: number;
  usedLocations: number;
  utilizationRate: number;
  byWarehouse: Record<string, {
    total: number;
    used: number;
    rate: number;
  }>;
};

export type StockProcessingData = {
  stockIn: StockInRequest[];
  stockOut: StockOutRequest[];
  averageProcessingTime: number; // in hours
  byStatus: Record<string, number>;
  byUser: Record<string, number>;
};

export type TransferData = {
  transfers: any[]; // Replace with proper type once available
  totalTransfers: number;
  pendingTransfers: number;
  completedTransfers: number;
  byWarehouse: Record<string, number>;
};

export type ExecutiveSummaryData = {
  inventoryValue: number;
  turnoverRate: number;
  stockMovements: {
    in: number;
    out: number;
    net: number;
  };
  topProducts: Array<{
    id: string;
    name: string;
    quantity: number;
  }>;
  warehouseUtilization: Record<string, number>;
};

export type AuditData = {
  actions: Array<{
    id: string;
    userId: string;
    userName: string;
    action: string;
    timestamp: string;
    details: any;
  }>;
  byActionType: Record<string, number>;
  byUser: Record<string, number>;
};

// Report card type for the dashboard
export type ReportCard = {
  id: string;
  title: string;
  description: string;
  path: string;
  icon: 'BarChart' | 'BarChart2' | 'PieChart';
  access: ('admin' | 'warehouse_manager' | 'field_operator' | 'sales_operator')[];
  category: 'inventory' | 'operational' | 'management';
};
