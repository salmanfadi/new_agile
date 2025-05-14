export type UserRole = 'admin' | 'warehouse_manager' | 'field_operator' | 'sales_operator' | 'customer';

export interface AuthUser {
  id: string;
  email?: string;
  role?: UserRole;
  name?: string;
  username?: string;
  active?: boolean;
}

export interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegistrationData {
  email: string;
  password: string;
  username?: string;
  name?: string;
  role?: UserRole;
}

export interface RequireAuthProps {
  allowedRoles?: string[];
  children: React.ReactNode;
}

export interface ScanResponse {
  id?: string;
  barcode: string;
  product?: {
    id: string;
    name: string;
    description?: string;
    specifications?: string;
    sku?: string;
    category?: string;
    image_url?: string;
  };
  inventory?: {
    id: string;
    quantity: number;
    warehouse_id: string;
    location_id?: string;
    color?: string;
    size?: string;
  };
  timestamp?: string;
  status?: 'success' | 'error' | 'not_found';
  message?: string;
}
