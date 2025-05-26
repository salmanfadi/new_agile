
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { Plus, Filter } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { UserRole } from '@/types/auth';
import { UserData } from '@/types/userManagement';
import { logAdminAction } from '@/utils/userManagementUtils';
import { ViewUserDetailsDialog } from '@/components/admin/users/ViewUserDetailsDialog';
import { EditStaffDialog } from '@/components/admin/users/EditStaffDialog';
import { EditCustomerDialog } from '@/components/admin/users/EditCustomerDialog';
import { ResetPasswordDialog } from '@/components/admin/users/ResetPasswordDialog';
import { CreateUserDialog } from '@/components/admin/users/CreateUserDialog';
import { UsersTable } from '@/components/admin/users/UsersTable';
import {
  EditStaffFormValues,
  EditCustomerFormValues,
  ResetPasswordFormValues,
  CreateUserFormValues,
} from '@/components/admin/users/userFormSchemas';

const UsersManagement = () => {
  const queryClient = useQueryClient();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCustomerEditDialogOpen, setIsCustomerEditDialogOpen] = useState(false);
  const [isViewDetailsDialogOpen, setIsViewDetailsDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [viewingUser, setViewingUser] = useState<UserData | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [roleFilter, setRoleFilter] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('all');

  // Fetch users from the database
  const { data: users, isLoading } = useQuery({
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
    mutationFn: async (userData: CreateUserFormValues) => {
      try {
        // First create the auth user
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: userData.email,
          password: userData.password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
            data: {
              username: userData.username,
              name: userData.name,
              role: userData.role,
            },
          },
        });

        if (authError) {
          console.error('Auth Error:', authError);
          throw new Error(authError.message);
        }

        if (!authData.user) {
          throw new Error('No user data returned from signup');
        }

        // Wait a short moment to ensure auth data is propagated
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Update the profile with additional data
        const profileData: any = {
          id: authData.user.id,
          username: userData.username,
          name: userData.name,
          role: userData.role,
          active: userData.active,
        };

        // Add customer-specific fields if role is customer
        if (userData.role === 'customer') {
          profileData.company_name = userData.company_name || null;
          profileData.gstin = userData.gstin || null;
          profileData.phone = userData.phone || null;
          profileData.business_type = userData.business_type || null;
          profileData.address = userData.address || null;
          profileData.business_reg_number = userData.business_reg_number || null;
        }

        // Upsert the profile data
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert(profileData, {
            onConflict: 'id',
            ignoreDuplicates: false,
          });

        if (profileError) {
          console.error('Profile Error:', profileError);
          // If profile update fails, delete the auth user to maintain consistency
          await supabase.auth.admin.deleteUser(authData.user.id);
          throw new Error(`Failed to create user profile: ${profileError.message}`);
        }

        // Log the admin action
        await logAdminAction({
          userId: 'admin',
          action: 'create_user',
          details: {
            user_id: authData.user.id,
            role: userData.role,
          },
          timestamp: new Date().toISOString(),
        });

        return { user: authData.user, profile: profileData };
      } catch (error) {
        console.error('Create User Error:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setIsCreateDialogOpen(false);
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

  // Update user mutation (for staff)
  const updateStaffMutation = useMutation({
    mutationFn: async ({ id, userData }: { id: string; userData: Partial<EditStaffFormValues> }) => {
      const { data, error } = await supabase
        .from('profiles')
        .update(userData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Log the admin action
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
      setIsEditDialogOpen(false);
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

  // Update user mutation (for customer)
  const updateCustomerMutation = useMutation({
    mutationFn: async ({ id, userData }: { id: string; userData: Partial<EditCustomerFormValues> }) => {
      const { data, error } = await supabase
        .from('profiles')
        .update(userData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Log the admin action
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
      setIsCustomerEditDialogOpen(false);
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
      // Using the Supabase Admin API to update user password
      // This requires admin privileges
      const { error } = await supabase.auth.admin.updateUserById(
        id,
        { password }
      );
      
      if (error) throw error;

      // Log the admin action
      await logAdminAction({
        userId: 'admin',
        action: 'reset_password',
        details: { 
          user_id: id,
        },
        timestamp: new Date().toISOString(),
      });
      
      return { success: true };
    },
    onSuccess: () => {
      setIsResetPasswordDialogOpen(false);
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

  // Toggle user active status
  const toggleUserStatusMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { data, error } = await supabase
        .from('profiles')
        .update({ active })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Log the admin action
      await logAdminAction({
        userId: 'admin',
        action: active ? 'activate_user' : 'deactivate_user',
        details: { 
          user_id: id,
          active,
        },
        timestamp: new Date().toISOString(),
      });

      return data;
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

  const handleEditUser = (user: UserData) => {
    if (user.role === 'customer') {
      setEditingUser(user);
      setIsCustomerEditDialogOpen(true);
    } else {
      setEditingUser(user);
      setIsEditDialogOpen(true);
    }
  };

  const handleViewUserDetails = (user: UserData) => {
    setViewingUser(user);
    setIsViewDetailsDialogOpen(true);
  };
  
  const handleResetPassword = (user: UserData) => {
    setSelectedUser(user);
    setIsResetPasswordDialogOpen(true);
  };

  const handleToggleUserStatus = (user: UserData) => {
    toggleUserStatusMutation.mutate({
      id: user.id,
      active: !user.active
    });
  };

  const handleEditStaffSubmit = (values: EditStaffFormValues) => {
    if (!editingUser) return;

    updateStaffMutation.mutate({
      id: editingUser.id,
      userData: values
    });
  };

  const handleEditCustomerSubmit = (values: EditCustomerFormValues) => {
    if (!editingUser) return;

    // Ensure role remains 'customer'
    const userData = {
      ...values,
      role: 'customer' as UserRole
    };

    updateCustomerMutation.mutate({
      id: editingUser.id,
      userData
    });
  };
  
  const handleResetPasswordSubmit = (values: ResetPasswordFormValues) => {
    if (!selectedUser) return;
    
    resetPasswordMutation.mutate({
      id: selectedUser.id,
      password: values.password
    });
  };

  const handleCreateUserSubmit = (values: CreateUserFormValues) => {
    createUserMutation.mutate(values);
  };

  // Filter users based on selected role
  const filteredUsers = users?.filter(user => {
    if (activeTab === 'customers') {
      return user.role === 'customer';
    } else if (activeTab === 'staff') {
      return user.role !== 'customer';
    }
    return true;
  }).filter(user => {
    if (roleFilter) {
      return user.role === roleFilter;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Users Management" 
        description="View and manage system users"
      />
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
          <TabsList>
            <TabsTrigger value="all">All Users</TabsTrigger>
            <TabsTrigger value="staff">Staff</TabsTrigger>
            <TabsTrigger value="customers">Customers</TabsTrigger>
          </TabsList>
        </Tabs>
        
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full sm:w-auto">
                <Filter className="mr-2 h-4 w-4" /> Filter by Role
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Select Role</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setRoleFilter(null)}>
                All Roles
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setRoleFilter('admin')}>
                Admin
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setRoleFilter('warehouse_manager')}>
                Warehouse Manager
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setRoleFilter('field_operator')}>
                Field Operator
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setRoleFilter('sales_operator')}>
                Sales Operator
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setRoleFilter('customer')}>
                Customer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button onClick={() => setIsCreateDialogOpen(true)} className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" /> Add New User
          </Button>
        </div>
      </div>
      
      <Card>
        <CardContent className="p-6">
          <UsersTable
            users={filteredUsers || []}
            activeTab={activeTab}
            isLoading={isLoading}
            onViewDetails={handleViewUserDetails}
            onEdit={handleEditUser}
            onResetPassword={handleResetPassword}
            onToggleStatus={handleToggleUserStatus}
          />
        </CardContent>
      </Card>

      {/* All Dialogs */}
      <ViewUserDetailsDialog
        open={isViewDetailsDialogOpen}
        onOpenChange={setIsViewDetailsDialogOpen}
        user={viewingUser}
      />

      <EditStaffDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        user={editingUser}
        onSubmit={handleEditStaffSubmit}
        isLoading={updateStaffMutation.isPending}
      />

      <EditCustomerDialog
        open={isCustomerEditDialogOpen}
        onOpenChange={setIsCustomerEditDialogOpen}
        user={editingUser}
        onSubmit={handleEditCustomerSubmit}
        isLoading={updateCustomerMutation.isPending}
      />

      <ResetPasswordDialog
        open={isResetPasswordDialogOpen}
        onOpenChange={setIsResetPasswordDialogOpen}
        user={selectedUser}
        onSubmit={handleResetPasswordSubmit}
        isLoading={resetPasswordMutation.isPending}
      />

      <CreateUserDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSubmit={handleCreateUserSubmit}
        isLoading={createUserMutation.isPending}
      />
    </div>
  );
};

export default UsersManagement;
