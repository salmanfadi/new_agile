
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from '@/components/ui/use-toast';
import { User, Users, Edit, Plus, Eye, EyeOff, Ban, UserCheck, Filter, ExternalLink, KeyRound } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { UserRole } from '@/types/auth';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
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
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';

// Business Types
const businessTypes = [
  { value: 'manufacturer', label: 'Manufacturer' },
  { value: 'wholesaler', label: 'Wholesaler' },
  { value: 'retailer', label: 'Retailer' },
  { value: 'distributor', label: 'Distributor' },
  { value: 'ecommerce', label: 'E-Commerce' },
  { value: 'service_provider', label: 'Service Provider' },
  { value: 'other', label: 'Other' }
];

interface UserData {
  id: string;
  username: string;
  name: string | null;
  role: UserRole;
  active: boolean;
  created_at: string;
  company_name?: string | null;
  gstin?: string | null;
  phone?: string | null;
  business_type?: string | null;
  address?: string | null;
  business_reg_number?: string | null;
}

// Define form schema for staff edit
const editStaffSchema = z.object({
  username: z.string().min(3, { message: "Username must be at least 3 characters" }),
  name: z.string().optional(),
  role: z.enum(['admin', 'warehouse_manager', 'field_operator', 'sales_operator', 'customer'] as const),
  active: z.boolean().default(true),
});

// Define form schema for customer edit
const editCustomerSchema = z.object({
  username: z.string().email({ message: "Invalid email address" }),
  name: z.string().min(2, { message: "Full name is required" }),
  company_name: z.string().min(2, { message: "Company name is required" }),
  gstin: z.string().optional(),
  phone: z.string().optional(),
  business_type: z.string().optional(),
  address: z.string().optional(),
  business_reg_number: z.string().optional(),
  active: z.boolean().default(true),
  // Role is fixed as 'customer' for this schema
});

// Schema for reset password form
const resetPasswordSchema = z.object({
  password: z.string().min(8, { message: "Password must be at least 8 characters" }),
});

// Define form schema for user creation
const createUserSchema = z.object({
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

type EditStaffFormValues = z.infer<typeof editStaffSchema>;
type EditCustomerFormValues = z.infer<typeof editCustomerSchema>;
type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;
type CreateUserFormValues = z.infer<typeof createUserSchema>;

// This is for audit logging
interface AuditLogEntry {
  userId: string;
  action: string;
  details: object;
  timestamp: string;
}

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
  const [showPassword, setShowPassword] = useState(false);
  const [roleFilter, setRoleFilter] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [showCustomerFields, setShowCustomerFields] = useState(false);

  // Edit staff form
  const editStaffForm = useForm<EditStaffFormValues>({
    resolver: zodResolver(editStaffSchema),
    defaultValues: {
      username: '',
      name: '',
      role: 'field_operator',
      active: true,
    },
  });

  // Edit customer form
  const editCustomerForm = useForm<EditCustomerFormValues>({
    resolver: zodResolver(editCustomerSchema),
    defaultValues: {
      username: '',
      name: '',
      company_name: '',
      gstin: '',
      phone: '',
      business_type: '',
      address: '',
      business_reg_number: '',
      active: true,
    },
  });

  // Reset password form
  const resetPasswordForm = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
    },
  });

  // Create user form
  const createUserForm = useForm<CreateUserFormValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      email: '',
      password: '',
      username: '',
      name: '',
      role: 'field_operator',
      active: true,
      company_name: '',
      gstin: '',
      phone: '',
      business_type: '',
      address: '',
      business_reg_number: '',
    },
  });

  // Log admin actions for audit
  const logAdminAction = async (entry: AuditLogEntry) => {
    try {
      // In a real system, you'd save this to a database table
      // For now, we'll just log to console
      console.log('ADMIN AUDIT LOG:', entry);
      
      // You could implement this in the future with a database table:
      /*
      await supabase
        .from('admin_audit_logs')
        .insert({
          user_id: entry.userId,
          action: entry.action,
          details: entry.details,
          created_at: entry.timestamp,
        });
      */
    } catch (error) {
      console.error('Failed to log admin action:', error);
    }
  };

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
      // First create the user in auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            username: userData.username,
            name: userData.name,
            role: userData.role,
          },
        },
      });

      if (authError) throw authError;
      
      // The profile should automatically be created via the trigger
      // But we'll update it to ensure the role and additional fields are set correctly
      if (authData.user) {
        const profileData: any = {
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

        const { error: profileError } = await supabase
          .from('profiles')
          .update(profileData)
          .eq('id', authData.user.id);

        if (profileError) throw profileError;

        // Log the admin action
        await logAdminAction({
          userId: 'admin', // In a real app, get the current admin's ID
          action: 'create_user',
          details: { 
            user_id: authData.user.id,
            role: userData.role,
          },
          timestamp: new Date().toISOString(),
        });
      }

      return authData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setIsCreateDialogOpen(false);
      createUserForm.reset(); // Reset the form
      toast({
        title: 'User created',
        description: 'New user has been created successfully.',
      });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Create failed',
        description: error instanceof Error ? error.message : 'Failed to create user',
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
      resetPasswordForm.reset();
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

  // Watch the role field to show/hide customer fields
  useEffect(() => {
    const subscription = createUserForm.watch((value, { name }) => {
      if (name === 'role' || name === undefined) {
        setShowCustomerFields(value.role === 'customer');
      }
    });
    return () => subscription.unsubscribe();
  }, [createUserForm.watch]);

  const handleEditUser = (user: UserData) => {
    if (user.role === 'customer') {
      setEditingUser(user);
      editCustomerForm.reset({
        username: user.username,
        name: user.name || '',
        company_name: user.company_name || '',
        gstin: user.gstin || '',
        phone: user.phone || '',
        business_type: user.business_type || '',
        address: user.address || '',
        business_reg_number: user.business_reg_number || '',
        active: user.active,
      });
      setIsCustomerEditDialogOpen(true);
    } else {
      setEditingUser(user);
      editStaffForm.reset({
        username: user.username,
        name: user.name || '',
        role: user.role,
        active: user.active,
      });
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

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'warehouse_manager':
        return 'bg-blue-100 text-blue-800';
      case 'field_operator':
        return 'bg-green-100 text-green-800';
      case 'sales_operator':
        return 'bg-yellow-100 text-yellow-800';
      case 'customer':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
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

  // Add the missing handleCreateUserSubmit function
  const handleCreateUserSubmit = (values: CreateUserFormValues) => {
    createUserMutation.mutate(values);
  };

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
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="h-10 w-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  {activeTab === 'customers' && (
                    <TableHead>Company</TableHead>
                  )}
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers && filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.username}</TableCell>
                      <TableCell>{user.name || '-'}</TableCell>
                      <TableCell>
                        <Badge className={getRoleBadgeColor(user.role)} variant="outline">
                          {user.role.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      {activeTab === 'customers' && (
                        <TableCell>{user.company_name || '-'}</TableCell>
                      )}
                      <TableCell>
                        <Badge variant={user.active ? 'default' : 'secondary'}>
                          {user.active ? 'Active' : 'Blocked'}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => handleViewUserDetails(user)}
                            title="View details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => handleEditUser(user)}
                            title="Edit user"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => handleResetPassword(user)}
                            title="Reset password"
                          >
                            <KeyRound className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant={user.active ? "ghost" : "outline"} 
                            onClick={() => handleToggleUserStatus(user)}
                            className={user.active ? "text-red-500 hover:text-red-700" : "text-green-500 hover:text-green-700"}
                            title={user.active ? "Block user" : "Activate user"}
                          >
                            {user.active ? <Ban className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={activeTab === 'customers' ? 7 : 6} className="text-center py-8 text-gray-500">
                      No users found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* View User Details Dialog */}
      <Dialog open={isViewDetailsDialogOpen} onOpenChange={setIsViewDetailsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
          </DialogHeader>
          
          {viewingUser && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Basic Information</h3>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div className="text-sm font-medium">Username:</div>
                  <div className="text-sm">{viewingUser.username}</div>
                  
                  <div className="text-sm font-medium">Name:</div>
                  <div className="text-sm">{viewingUser.name || '-'}</div>
                  
                  <div className="text-sm font-medium">Role:</div>
                  <div className="text-sm">
                    <Badge className={getRoleBadgeColor(viewingUser.role)} variant="outline">
                      {viewingUser.role.replace('_', ' ')}
                    </Badge>
                  </div>
                  
                  <div className="text-sm font-medium">Status:</div>
                  <div className="text-sm">
                    <Badge variant={viewingUser.active ? 'default' : 'secondary'}>
                      {viewingUser.active ? 'Active' : 'Blocked'}
                    </Badge>
                  </div>
                  
                  <div className="text-sm font-medium">Created:</div>
                  <div className="text-sm">{new Date(viewingUser.created_at).toLocaleString()}</div>
                </div>
              </div>
              
              {viewingUser.role === 'customer' && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Customer Information</h3>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div className="text-sm font-medium">Company:</div>
                    <div className="text-sm">{viewingUser.company_name || '-'}</div>
                    
                    <div className="text-sm font-medium">GSTIN:</div>
                    <div className="text-sm">{viewingUser.gstin || '-'}</div>
                    
                    <div className="text-sm font-medium">Phone:</div>
                    <div className="text-sm">{viewingUser.phone || '-'}</div>
                    
                    <div className="text-sm font-medium">Business Type:</div>
                    <div className="text-sm">
                      {viewingUser.business_type 
                        ? businessTypes.find(t => t.value === viewingUser.business_type)?.label || viewingUser.business_type
                        : '-'
                      }
                    </div>
                    
                    <div className="text-sm font-medium">Address:</div>
                    <div className="text-sm">{viewingUser.address || '-'}</div>
                    
                    <div className="text-sm font-medium">Business Reg #:</div>
                    <div className="text-sm">{viewingUser.business_reg_number || '-'}</div>
                  </div>
                </div>
              )}
              
              <DialogFooter>
                <Button
                  onClick={() => setIsViewDetailsDialogOpen(false)}
                >
                  Close
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Staff Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          
          <Form {...editStaffForm}>
            <form onSubmit={editStaffForm.handleSubmit(handleEditStaffSubmit)} className="space-y-4">
              <FormField
                control={editStaffForm.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editStaffForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editStaffForm.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select 
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="warehouse_manager">Warehouse Manager</SelectItem>
                        <SelectItem value="field_operator">Field Operator</SelectItem>
                        <SelectItem value="sales_operator">Sales Operator</SelectItem>
                        <SelectItem value="customer">Customer</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editStaffForm.control}
                name="active"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2">
                    <FormControl>
                      <input 
                        type="checkbox" 
                        className="h-4 w-4 rounded border-gray-300"
                        checked={field.value}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="m-0">Active</FormLabel>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={updateStaffMutation.isPending}
                >
                  {updateStaffMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Customer Dialog */}
      <Dialog open={isCustomerEditDialogOpen} onOpenChange={setIsCustomerEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Customer</DialogTitle>
          </DialogHeader>
          
          <Form {...editCustomerForm}>
            <form onSubmit={editCustomerForm.handleSubmit(handleEditCustomerSubmit)} className="space-y-4">
              <FormField
                control={editCustomerForm.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editCustomerForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editCustomerForm.control}
                name="company_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editCustomerForm.control}
                  name="gstin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>GSTIN</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editCustomerForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={editCustomerForm.control}
                name="business_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Type</FormLabel>
                    <Select 
                      onValueChange={field.onChange}
                      defaultValue={field.value || ''}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select business type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {businessTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editCustomerForm.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editCustomerForm.control}
                name="business_reg_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Registration Number</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editCustomerForm.control}
                name="active"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2">
                    <FormControl>
                      <input 
                        type="checkbox" 
                        className="h-4 w-4 rounded border-gray-300"
                        checked={field.value}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="m-0">Active</FormLabel>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsCustomerEditDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={updateCustomerMutation.isPending}
                >
                  {updateCustomerMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={isResetPasswordDialogOpen} onOpenChange={setIsResetPasswordDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
          </DialogHeader>
          
          {selectedUser && (
            <Form {...resetPasswordForm}>
              <form onSubmit={resetPasswordForm.handleSubmit(handleResetPasswordSubmit)} className="space-y-4">
                <p className="text-sm text-slate-600">
                  Reset password for <span className="font-medium">{selectedUser.name || selectedUser.username}</span>.
                </p>
                
                <FormField
                  control={resetPasswordForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Password</FormLabel>
                      <div className="relative">
                        <FormControl>
                          <Input 
                            type={showPassword ? "text" : "password"} 
                            {...field} 
                          />
                        </FormControl>
                        <button
                          type="button"
                          className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
                          onClick={togglePasswordVisibility}
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                      <FormDescription>
                        Password must be at least 8 characters long.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <DialogFooter>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsResetPasswordDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    disabled={resetPasswordMutation.isPending}
                  >
                    {resetPasswordMutation.isPending ? 'Resetting...' : 'Reset Password'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>

      {/* Create User Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>
              Create a new user account in the system.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...createUserForm}>
            <form onSubmit={createUserForm.handleSubmit(handleCreateUserSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={createUserForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" placeholder="user@example.com" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={createUserForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input {...field} type="password" placeholder="Minimum 8 characters" />
                      </FormControl>
                      <FormDescription>
                        Password must be at least 8 characters.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={createUserForm.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Username" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={createUserForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Full Name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={createUserForm.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select 
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="warehouse_manager">Warehouse Manager</SelectItem>
                        <SelectItem value="field_operator">Field Operator</SelectItem>
                        <SelectItem value="sales_operator">Sales Operator</SelectItem>
                        <SelectItem value="customer">Customer</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={createUserForm.control}
                name="active"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2">
                    <FormControl>
                      <input 
                        type="checkbox" 
                        className="h-4 w-4 rounded border-gray-300"
                        checked={field.value}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="m-0">Active</FormLabel>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Customer-specific fields */}
              {showCustomerFields && (
                <div className="border border-gray-200 rounded-md p-4 space-y-4">
                  <h3 className="font-medium text-gray-700">Customer Information</h3>
                  
                  <FormField
                    control={createUserForm.control}
                    name="company_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Name</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Company name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={createUserForm.control}
                      name="gstin"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>GSTIN</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="GSTIN number" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={createUserForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Phone number" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={createUserForm.control}
                    name="business_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business Type</FormLabel>
                        <Select 
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select business type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {businessTypes.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={createUserForm.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Business address" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={createUserForm.control}
                    name="business_reg_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business Registration Number</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Business registration number" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={createUserMutation.isPending}
                >
                  {createUserMutation.isPending ? 'Creating...' : 'Create User'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UsersManagement;
