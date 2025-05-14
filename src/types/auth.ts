
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
