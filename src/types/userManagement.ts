
import { UserRole } from '@/types/auth';

export interface UserData {
  id: string;
  username: string;
  name: string | null;
  role: UserRole;
  active: boolean;
  created_at: string;
  updated_at?: string;
  company_name?: string | null;
  gstin?: string | null;
  phone?: string | null;
  business_type?: string | null;
  address?: string | null;
  business_reg_number?: string | null;
}
