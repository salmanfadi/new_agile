export type UserRole = 'admin' | 'warehouse_manager' | 'field_operator' | 'sales_operator' | 'customer';

export interface User {
  id: string;
  username: string;
  role: UserRole;
  name: string | null;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface RequireAuthProps {
  children: React.ReactNode | ((props: { user: User }) => React.ReactElement);
  allowedRoles?: UserRole[];
}

export interface ScanResponse {
  status: 'success' | 'error';
  data?: {
    box_id: string;
    product: {
      id: string;
      name: string;
      sku: string;
      description?: string;
    };
    box_quantity: number;
    total_product_quantity?: number;
    location?: {
      warehouse: string;
      zone: string;
      position: string;
    };
    status: 'available' | 'reserved' | 'out-of-stock' | 'in-transit';
    attributes?: Record<string, string | number | null>;
    history?: {
      action: string;
      timestamp: string;
    }[];
  };
  error?: string;
}
