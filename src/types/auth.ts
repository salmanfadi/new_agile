
export type UserRole = 'admin' | 'warehouse_manager' | 'field_operator' | 'sales_operator';

export interface User {
  id: string;
  username: string;
  role: UserRole;
  name: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
