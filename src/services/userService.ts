
import { supabase } from '@/lib/supabase';
import { CreateUserFormValues } from '@/components/admin/users/userFormSchemas';
import { UserRole } from '@/types/auth';
import { logAdminAction } from '@/utils/userManagementUtils';

export interface CreateUserData {
  email: string;
  password: string;
  username: string;
  name: string;
  role: UserRole;
  active: boolean;
  company_name?: string;
  gstin?: string;
  phone?: string;
  business_type?: string;
  address?: string;
  business_reg_number?: string;
}

export const createUser = async (userData: CreateUserFormValues) => {
  try {
    // First, create the auth user using admin API
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        username: userData.username,
        name: userData.name,
        role: userData.role,
      },
    });

    if (authError) {
      console.error('Auth Error:', authError);
      throw new Error(`Failed to create user: ${authError.message}`);
    }

    if (!authData.user) {
      throw new Error('No user data returned from signup');
    }

    // Create the profile data
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

    // Insert the profile data
    const { error: profileError } = await supabase
      .from('profiles')
      .insert(profileData);

    if (profileError) {
      console.error('Profile Error:', profileError);
      // If profile creation fails, delete the auth user to maintain consistency
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
};

export const updateUserStatus = async (userId: string, active: boolean) => {
  const { data, error } = await supabase
    .from('profiles')
    .update({ active })
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;

  await logAdminAction({
    userId: 'admin',
    action: active ? 'activate_user' : 'deactivate_user',
    details: { 
      user_id: userId,
      active,
    },
    timestamp: new Date().toISOString(),
  });

  return data;
};

export const resetUserPassword = async (userId: string, password: string) => {
  const { error } = await supabase.auth.admin.updateUserById(
    userId,
    { password }
  );
  
  if (error) throw error;

  await logAdminAction({
    userId: 'admin',
    action: 'reset_password',
    details: { 
      user_id: userId,
    },
    timestamp: new Date().toISOString(),
  });
  
  return { success: true };
};
