
import { Session, User as SupabaseUser } from '@supabase/supabase-js';

export interface User extends SupabaseUser {
  id: string;
  email?: string;
  name?: string;
  role?: UserRole;
  username?: string;
  active?: boolean;
  avatar_url?: string;
}

export type UserRole = 'admin' | 'warehouse_manager' | 'field_operator' | 'sales_operator' | 'customer';

export interface AuthContextType {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error?: string | Error | null;
  signIn: (
    provider: 'google' | 'github' | 'email',
    email?: string,
    password?: string
  ) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password?: string) => Promise<void>;
  logout: () => Promise<void>;
  signOut: () => Promise<void>;
  updateUser: (data: any) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  verifyOTP: (email: string, token: string, type: 'email' | 'magiclink') => Promise<any>;
}

export interface ScanResponse {
  status: 'success' | 'error';
  data?: {
    box_id: string;
    product: {
      id: string;
      name: string;
      sku?: string;
      description?: string;
    };
    box_quantity: number;
    total_product_quantity?: number;
    location: {
      warehouse: string;
      zone: string;
      position: string;
    };
    status: string;
    attributes?: {
      color?: string;
      size?: string;
      batch_id?: string;
      [key: string]: any;
    };
    history?: Array<{
      action: string;
      timestamp: string;
    }>;
  };
  error?: string;
}

export interface ProcessableStockIn {
  id: string;
  boxes: number;
  status: string;
  created_at: string;
  source: string;
  notes?: string;
  product: {
    id: string;
    name: string;
    sku?: string;
    category?: string;
  };
  submitter: {
    id: string;
    name: string;
    username: string;
  };
}
