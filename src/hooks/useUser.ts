
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

export interface UserProfile {
  id: string;
  username: string;
  name?: string;
  role: string;
  active: boolean;
}

export const useUser = (userId?: string) => {
  const { user: authUser } = useAuth();
  
  // Use provided userId, or fall back to current authenticated user
  const targetUserId = userId || authUser?.id;
  
  return useQuery({
    queryKey: ['user-profile', targetUserId],
    queryFn: async (): Promise<UserProfile | null> => {
      if (!targetUserId) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', targetUserId)
        .single();
      
      if (error) {
        console.error('Error fetching user profile:', error);
        throw error;
      }
      
      return data;
    },
    enabled: !!targetUserId,
  });
};

export default useUser;
