
export interface DashboardStats {
  users: number;
  warehouses: number;
  products: number;
  inventory: number;
}

export interface RecentActivity {
  id: string;
  action: string;
  user: string;
  timestamp: string;
  details?: string;
}
