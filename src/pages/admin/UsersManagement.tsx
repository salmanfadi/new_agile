
import React from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { UserData } from '@/types/userManagement';
import { ViewUserDetailsDialog } from '@/components/admin/users/ViewUserDetailsDialog';
import { EditStaffDialog } from '@/components/admin/users/EditStaffDialog';
import { EditCustomerDialog } from '@/components/admin/users/EditCustomerDialog';
import { ResetPasswordDialog } from '@/components/admin/users/ResetPasswordDialog';
import { CreateUserDialog } from '@/components/admin/users/CreateUserDialog';
import { UsersTable } from '@/components/admin/users/UsersTable';
import { UsersFilters } from '@/components/admin/users/UsersFilters';
import { UsersManagementProvider, useUsersManagementContext } from '@/components/admin/users/UsersManagementProvider';
import { useUserManagement } from '@/hooks/useUserManagement';
import {
  EditStaffFormValues,
  EditCustomerFormValues,
  ResetPasswordFormValues,
  CreateUserFormValues,
} from '@/components/admin/users/userFormSchemas';
import { UserRole } from '@/types/auth';

const UsersManagementContent: React.FC = () => {
  const {
    // Dialog states
    isEditDialogOpen,
    setIsEditDialogOpen,
    isCustomerEditDialogOpen,
    setIsCustomerEditDialogOpen,
    isViewDetailsDialogOpen,
    setIsViewDetailsDialogOpen,
    isCreateDialogOpen,
    setIsCreateDialogOpen,
    isResetPasswordDialogOpen,
    setIsResetPasswordDialogOpen,
    
    // Selected users
    editingUser,
    setEditingUser,
    viewingUser,
    setViewingUser,
    selectedUser,
    setSelectedUser,
    
    // Filters
    roleFilter,
    activeTab,
  } = useUsersManagementContext();

  const {
    users,
    isLoading,
    createUser,
    updateStaff,
    updateCustomer,
    resetPassword,
    toggleUserStatus,
  } = useUserManagement();

  // Event handlers
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
    toggleUserStatus.mutate({
      id: user.id,
      active: !user.active
    });
  };

  const handleEditStaffSubmit = (values: EditStaffFormValues) => {
    if (!editingUser) return;

    updateStaff.mutate({
      id: editingUser.id,
      userData: values
    });
  };

  const handleEditCustomerSubmit = (values: EditCustomerFormValues) => {
    if (!editingUser) return;

    const userData = {
      ...values,
      role: 'customer' as UserRole
    };

    updateCustomer.mutate({
      id: editingUser.id,
      userData
    });
  };
  
  const handleResetPasswordSubmit = (values: ResetPasswordFormValues) => {
    if (!selectedUser) return;
    
    resetPassword.mutate({
      id: selectedUser.id,
      password: values.password
    });
  };

  const handleCreateUserSubmit = (values: CreateUserFormValues) => {
    createUser.mutate(values);
  };

  // Filter users based on selected filters
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
      
      <UsersFilters />
      
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
        onOpenChange={(open) => {
          setIsEditDialogOpen(open);
          if (!open) setEditingUser(null);
        }}
        user={editingUser}
        onSubmit={handleEditStaffSubmit}
        isLoading={updateStaff.isPending}
      />

      <EditCustomerDialog
        open={isCustomerEditDialogOpen}
        onOpenChange={(open) => {
          setIsCustomerEditDialogOpen(open);
          if (!open) setEditingUser(null);
        }}
        user={editingUser}
        onSubmit={handleEditCustomerSubmit}
        isLoading={updateCustomer.isPending}
      />

      <ResetPasswordDialog
        open={isResetPasswordDialogOpen}
        onOpenChange={(open) => {
          setIsResetPasswordDialogOpen(open);
          if (!open) setSelectedUser(null);
        }}
        user={selectedUser}
        onSubmit={handleResetPasswordSubmit}
        isLoading={resetPassword.isPending}
      />

      <CreateUserDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSubmit={handleCreateUserSubmit}
        isLoading={createUser.isPending}
      />
    </div>
  );
};

const UsersManagement: React.FC = () => {
  return (
    <UsersManagementProvider>
      <UsersManagementContent />
    </UsersManagementProvider>
  );
};

export default UsersManagement;
