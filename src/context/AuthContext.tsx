
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { UserRole } from '@/types/auth';

export interface User extends Omit<SupabaseUser, 'role'> {
  role: UserRole;
}

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  error: Error | null;
  login: (email: string, password: string) => Promise<{ error: Error | null; data: Session | null }>;
  signUp: (email: string, password: string, role: UserRole) => Promise<{ error: Error | null; data: any }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isLoading: true,
  error: null,
  login: async () => ({ error: null, data: null }),
  signUp: async () => ({ error: null, data: null }),
  logout: async () => {},
});

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      setIsLoading(true);
      
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          setError(error);
        } else if (data.session) {
          setSession(data.session);
          
          // Need to fetch user role from profiles table
          if (data.session.user) {
            const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .select('role')
              .eq('id', data.session.user.id)
              .single();
              
            if (profileError) {
              console.error('Error fetching user profile:', profileError);
            } else if (profileData) {
              // Set the user with the role from the profiles table
              setUser({ 
                ...data.session.user, 
                role: profileData.role as UserRole 
              });
            }
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error('An unknown error occurred'));
      } finally {
        setIsLoading(false);
      }
    };
    
    getInitialSession();
    
    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      
      if (session?.user) {
        try {
          // Fetch the user role from profiles table
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single();
            
          if (profileError) {
            console.error('Error fetching user profile:', profileError);
          } else if (profileData) {
            // Set the user with the role from the profiles table
            setUser({ 
              ...session.user, 
              role: profileData.role as UserRole 
            });
          }
        } catch (err) {
          console.error('Error in auth state change:', err);
        }
      } else {
        setUser(null);
      }
    });
    
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        setError(error);
        return { error, data: null };
      }
      
      return { error: null, data: data.session };
    } catch (err) {
      const error = err instanceof Error ? err : new Error('An unknown error occurred');
      setError(error);
      return { error, data: null };
    }
  };

  const signUp = async (email: string, password: string, role: UserRole) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role,
          },
        },
      });
      
      if (error) {
        setError(error);
        return { error, data: null };
      }
      
      return { error: null, data };
    } catch (err) {
      const error = err instanceof Error ? err : new Error('An unknown error occurred');
      setError(error);
      return { error, data: null };
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('An unknown error occurred'));
    }
  };

  const value = {
    user,
    session,
    isLoading,
    error,
    login,
    signUp,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
