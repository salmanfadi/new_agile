
import { User as SupabaseUser } from '@supabase/supabase-js';

export type UserRole = 'admin' | 'warehouse_manager' | 'field_operator';

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

export interface RequireAuthProps {
  children: React.ReactNode | ((props: { user: User }) => React.ReactElement);
  allowedRoles?: UserRole[];
}
