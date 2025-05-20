
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';
import { User, UserRole, AuthContextType } from '@/types/auth';

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isLoading: true,
  isAuthenticated: false,
  error: null,
  login: async () => {},
  signIn: async () => {},
  signUp: async () => {},
  logout: async () => {},
  signOut: async () => {},
  updateUser: async () => {},
  resetPassword: async () => {},
  verifyOTP: async () => ({}),
});

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Helper function to clean up auth state
  const cleanupAuthState = () => {
    // Remove all Supabase auth keys from localStorage
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
        localStorage.removeItem(key);
      }
    });
    
    // Remove from sessionStorage if in use
    Object.keys(sessionStorage || {}).forEach((key) => {
      if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
        sessionStorage.removeItem(key);
      }
    });
  };

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      setIsLoading(true);
      
      try {
        console.log('Fetching session from Supabase...');
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          setError(error);
        } else if (data.session) {
          console.log('Session found, checking user profile...');
          setSession(data.session);
          setIsAuthenticated(true);
          
          // Need to fetch user role from profiles table
          if (data.session.user) {
            try {
              console.log('Fetching user profile for user ID:', data.session.user.id);
              // Only select columns that exist in the profiles table
              const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('role, name, username, active')
                .eq('id', data.session.user.id)
                .single();
              
              console.log('Profile fetch result:', { profileData, profileError });
                
              if (profileError) {
                console.error('Error fetching user profile:', profileError);
                // Set default user role if profile not found
                setUser({ 
                  ...data.session.user, 
                  role: 'customer' as UserRole,
                  name: data.session.user.email?.split('@')[0] || 'User',
                  username: data.session.user.email || '',
                  active: true
                } as User);
              } else if (profileData) {
                // Set the user with the role from the profiles table
                setUser({ 
                  ...data.session.user, 
                  role: (profileData.role || 'customer') as UserRole,
                  name: profileData.name || data.session.user.email?.split('@')[0] || 'User',
                  username: profileData.username || data.session.user.email || '',
                  active: profileData.active !== false
                } as User);
              } else {
                // Handle case where profileData is null
                setUser({ 
                  ...data.session.user, 
                  role: 'customer' as UserRole,
                  name: data.session.user.email?.split('@')[0] || 'User',
                  username: data.session.user.email || '',
                  active: true
                } as User);
              }
            } catch (err) {
              console.error('Error processing user profile:', err);
              // Set default user values if there's an error
              setUser({ 
                ...data.session.user, 
                role: 'customer' as UserRole,
                name: data.session.user.email?.split('@')[0] || 'User',
                username: data.session.user.email || '',
                active: true
              } as User);
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
      console.log('Auth state changed:', { event, session });
      setSession(session);
      
      if (session?.user) {
        console.log('User session found, checking profile...');
        setIsAuthenticated(true);
        try {
          // Fetch the user role from profiles table
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('role, name, username, active')
            .eq('id', session.user.id)
            .single();
            
          if (profileError) {
            console.error('Error fetching user profile:', profileError);
          } else if (profileData) {
            // Set the user with the role from the profiles table
            setUser({ 
              ...session.user, 
              role: profileData.role as UserRole,
              name: profileData.name,
              username: profileData.username,
              active: profileData.active
            } as User);
          }
        } catch (err) {
          console.error('Error in auth state change:', err);
        }
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    });
    
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      // First clean up any existing auth state
      cleanupAuthState();
      
      // Attempt global sign out to ensure clean state
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (err) {
        // Continue even if this fails
        console.log("Sign out before login failed:", err);
      }
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        setError(error);
        throw error;
      }
      
      return;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('An unknown error occurred');
      setError(error);
      throw error;
    }
  };

  const signIn = async (provider: 'google' | 'github' | 'email', email?: string, password?: string) => {
    try {
      if (provider === 'email' && email && password) {
        return login(email, password);
      }
      
      // Handle other providers here
      setError(new Error(`Provider ${provider} not implemented`));
    } catch (err) {
      const error = err instanceof Error ? err : new Error('An unknown error occurred');
      setError(error);
      throw error;
    }
  };

  const signUp = async (email: string, password?: string) => {
    try {
      if (!password) {
        throw new Error("Password is required");
      }
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      
      if (error) {
        setError(error);
        throw error;
      }
      
      return;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('An unknown error occurred');
      setError(error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Clean up auth state first
      cleanupAuthState();
      
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setIsAuthenticated(false);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('An unknown error occurred'));
      throw err;
    }
  };

  // Alias for logout to match the type definition
  const signOut = logout;

  const updateUser = async (data: any) => {
    try {
      const { error } = await supabase.auth.updateUser(data);
      if (error) throw error;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('An unknown error occurred'));
      throw err;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('An unknown error occurred'));
      throw err;
    }
  };

  const verifyOTP = async (email: string, token: string, type: 'email' | 'magiclink') => {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token,
        type
      });
      
      if (error) throw error;
      return data;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('An unknown error occurred'));
      throw err;
    }
  };

  const value = {
    user,
    session,
    isLoading,
    isAuthenticated,
    error,
    login,
    signIn,
    signUp,
    logout,
    signOut,
    updateUser,
    resetPassword,
    verifyOTP,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
