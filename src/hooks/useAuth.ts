
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AuthSession, User } from '@supabase/supabase-js';
import { Profile } from '@/types/database';
import { UserRole } from '@/types/auth';

interface AuthUser extends Omit<User, 'role'> {
  role: UserRole;
  name?: string;
  username?: string;
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      setLoading(true);
      
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error getting session:', error);
      }
      
      setSession(session);
      
      if (session?.user) {
        await getUserProfile(session.user);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
      
      setLoading(false);
    };

    const getUserProfile = async (authUser: User) => {
      try {
        // Get user profile from profiles table
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('role, name, username')
          .eq('id', authUser.id)
          .single();
          
        if (profileError) {
          console.error('Error fetching user profile:', profileError);
          setUser(null);
          setIsAuthenticated(false);
          return;
        }
        
        if (profileData) {
          // Combine auth user data with profile data
          const userWithRole: AuthUser = {
            ...authUser,
            role: profileData.role as UserRole,
            name: profileData.name || undefined,
            username: profileData.username
          };
          
          setUser(userWithRole);
          setIsAuthenticated(true);
        } else {
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Error in getUserProfile:', error);
        setUser(null);
        setIsAuthenticated(false);
      }
    };

    getSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        
        if (session?.user) {
          await getUserProfile(session.user);
        } else {
          setUser(null);
          setIsAuthenticated(false);
        }
        
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return {
    user,
    session,
    loading: loading,
    isLoading: loading,
    isAuthenticated
  };
}
