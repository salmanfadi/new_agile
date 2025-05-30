import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from '@/components/ui/use-toast';
import { UserData } from '@/types/userManagement';
import { 
  CreateUserFormValues, 
  EditStaffFormValues, 
  EditCustomerFormValues, 
  ResetPasswordFormValues 
} from '@/components/admin/users/userFormSchemas';
import { createUser, updateUserStatus, resetUserPassword } from '@/services/userService';
import { logAdminAction } from '@/utils/userManagementUtils';
import { UserRole } from '@/types/auth';

export const useUserManagement = () => {
  const queryClient = useQueryClient();

  // Fetch users query
  const usersQuery = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        toast({
          variant: 'destructive',
          title: 'Error fetching users',
          description: error.message,
        });
        throw error;
      }

      return data as UserData[];
    },
  });

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: 'User created',
        description: 'New user has been created successfully.',
      });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Create failed',
        description: error instanceof Error 
          ? `Failed to create user: ${error.message}`
          : 'Failed to create user. Please try again or contact support if the issue persists.',
      });
    },
  });

  // Update staff mutation
  const updateStaffMutation = useMutation({
    mutationFn: async ({ id, userData }: { id: string; userData: Partial<EditStaffFormValues> }) => {
      const { data, error } = await supabase
        .from('profiles')
        .update(userData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      await logAdminAction({
        userId: 'admin',
        action: 'update_user',
        details: { 
          user_id: id,
          changes: userData,
        },
        timestamp: new Date().toISOString(),
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: 'User updated',
        description: 'User information has been updated successfully.',
      });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Update failed',
        description: error instanceof Error ? error.message : 'Failed to update user',
      });
    },
  });

  // Update customer mutation
  const updateCustomerMutation = useMutation({
    mutationFn: async ({ id, userData }: { id: string; userData: Partial<EditCustomerFormValues> }) => {
      const { data, error } = await supabase
        .from('profiles')
        .update(userData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      await logAdminAction({
        userId: 'admin',
        action: 'update_customer',
        details: { 
          user_id: id,
          changes: userData,
        },
        timestamp: new Date().toISOString(),
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: 'Customer updated',
        description: 'Customer information has been updated successfully.',
      });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Update failed',
        description: error instanceof Error ? error.message : 'Failed to update customer',
      });
    },
  });
  
  // Reset password mutation
  const resetPasswordMutation = useMutation({
    mutationFn: async ({ id, password }: { id: string; password: string }) => {
      return resetUserPassword(id, password);
    },
    onSuccess: () => {
      toast({
        title: 'Password reset',
        description: 'User password has been reset successfully.',
      });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Password reset failed',
        description: error instanceof Error ? error.message : 'Failed to reset user password',
      });
    },
  });

  // Toggle user status mutation
  const toggleUserStatusMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      return updateUserStatus(id, active);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: data.active ? 'User Activated' : 'User Blocked',
        description: data.active 
          ? `${data.name || data.username} has been activated and can now log in.` 
          : `${data.name || data.username} has been blocked from accessing the system.`,
      });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Operation failed',
        description: error instanceof Error ? error.message : 'Failed to update user status',
      });
    },
  });

  return {
    // Queries
    users: usersQuery.data,
    isLoading: usersQuery.isLoading,
    
    // Mutations
    createUser: createUserMutation,
    updateStaff: updateStaffMutation,
    updateCustomer: updateCustomerMutation,
    resetPassword: resetPasswordMutation,
    toggleUserStatus: toggleUserStatusMutation,
  };
};
