
import React, { createContext, useContext, useState } from 'react';
import { UserData } from '@/types/userManagement';

interface UsersManagementContextType {
  // Dialog states
  isEditDialogOpen: boolean;
  setIsEditDialogOpen: (open: boolean) => void;
  isCustomerEditDialogOpen: boolean;
  setIsCustomerEditDialogOpen: (open: boolean) => void;
  isViewDetailsDialogOpen: boolean;
  setIsViewDetailsDialogOpen: (open: boolean) => void;
  isCreateDialogOpen: boolean;
  setIsCreateDialogOpen: (open: boolean) => void;
  isResetPasswordDialogOpen: boolean;
  setIsResetPasswordDialogOpen: (open: boolean) => void;
  
  // Selected users
  editingUser: UserData | null;
  setEditingUser: (user: UserData | null) => void;
  viewingUser: UserData | null;
  setViewingUser: (user: UserData | null) => void;
  selectedUser: UserData | null;
  setSelectedUser: (user: UserData | null) => void;
  
  // Filters
  roleFilter: string | null;
  setRoleFilter: (filter: string | null) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const UsersManagementContext = createContext<UsersManagementContextType | undefined>(undefined);

export const useUsersManagementContext = () => {
  const context = useContext(UsersManagementContext);
  if (!context) {
    throw new Error('useUsersManagementContext must be used within a UsersManagementProvider');
  }
  return context;
};

interface UsersManagementProviderProps {
  children: React.ReactNode;
}

export const UsersManagementProvider: React.FC<UsersManagementProviderProps> = ({ children }) => {
  // Dialog states
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCustomerEditDialogOpen, setIsCustomerEditDialogOpen] = useState(false);
  const [isViewDetailsDialogOpen, setIsViewDetailsDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] = useState(false);
  
  // Selected users
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [viewingUser, setViewingUser] = useState<UserData | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  
  // Filters
  const [roleFilter, setRoleFilter] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('all');

  const value = {
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
    setRoleFilter,
    activeTab,
    setActiveTab,
  };

  return (
    <UsersManagementContext.Provider value={value}>
      {children}
    </UsersManagementContext.Provider>
  );
};
