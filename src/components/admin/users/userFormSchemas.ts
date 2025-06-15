
import * as z from 'zod';
import { UserRole } from '@/types/auth';

// Define form schema for staff edit
export const editStaffSchema = z.object({
  username: z.string().min(3, { message: "Username must be at least 3 characters" }),
  name: z.string().optional(),
  role: z.enum(['admin', 'warehouse_manager', 'field_operator', 'sales_operator', 'customer'] as const),
  active: z.boolean().default(true),
});

// Define form schema for customer edit
export const editCustomerSchema = z.object({
  username: z.string().email({ message: "Invalid email address" }),
  name: z.string().min(2, { message: "Full name is required" }),
  company_name: z.string().min(2, { message: "Company name is required" }),
  gstin: z.string().optional(),
  phone: z.string().optional(),
  business_type: z.string().optional(),
  address: z.string().optional(),
  business_reg_number: z.string().optional(),
  active: z.boolean().default(true),
});

// Schema for reset password form
export const resetPasswordSchema = z.object({
  password: z.string().min(8, { message: "Password must be at least 8 characters" }),
});

// Define form schema for user creation
export const createUserSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(8, { 
    message: "Password must be at least 8 characters" 
  }),
  username: z.string().min(3, { message: "Username must be at least 3 characters" }),
  name: z.string().min(2, { message: "Name is required" }),
  role: z.enum(['admin', 'warehouse_manager', 'field_operator', 'sales_operator', 'customer'] as const),
  active: z.boolean().default(true),
  // Customer fields (optional based on role)
  company_name: z.string().optional(),
  gstin: z.string().optional(),
  phone: z.string().optional(),
  business_type: z.string().optional(),
  address: z.string().optional(),
  business_reg_number: z.string().optional(),
});

export type EditStaffFormValues = z.infer<typeof editStaffSchema>;
export type EditCustomerFormValues = z.infer<typeof editCustomerSchema>;
export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;
export type CreateUserFormValues = z.infer<typeof createUserSchema>;
