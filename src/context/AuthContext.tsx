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
    // Only remove specific auth keys we know are problematic
    const keysToRemove = [
      'supabase.auth.token',
      'sb-access-token',
      'sb-refresh-token'
    ];
    
    keysToRemove.forEach(key => {
        localStorage.removeItem(key);
      if (sessionStorage) {
        sessionStorage.removeItem(key);
      }
    });
  };

  // Helper function to get user profile
  const getUserProfile = async (authUser: any) => {
    try {
      console.log('Fetching user profile for user ID:', authUser.id);
      
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('role, full_name, email, active')
        .eq('id', authUser.id)
        .single();
        
      console.log('Profile fetch result:', { profileData, profileError });
      
      if (profileError) {
        console.error('Error fetching user profile:', profileError);
        // Return null to trigger re-login
        return null;
      }
      
      if (profileData) {
        // Ensure admin@gmail.com always has admin role
        const role = authUser.email === 'admin@gmail.com' ? 'admin' : profileData.role;
        return {
          ...authUser,
          role: role as UserRole,
          name: profileData.full_name || authUser.email?.split('@')[0] || 'User',
          email: profileData.email || authUser.email,
          active: profileData.active !== false
        } as User;
      }
      
      // If no profile data, return null to trigger re-login
      return null;
    } catch (err) {
      console.error('Error processing user profile:', err);
      return null;
    }
  };

  useEffect(() => {
    console.log('AuthContext: Initializing...');
    
    // Get initial session
    const getInitialSession = async () => {
      setIsLoading(true);
      
      try {
        console.log('Fetching session from Supabase...');
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          setError(error);
          setSession(null);
          setUser(null);
          setIsAuthenticated(false);
        } else if (data.session) {
          console.log('Session found, processing user...');
          setSession(data.session);
          
          if (data.session.user) {
            const userWithProfile = await getUserProfile(data.session.user);
            setUser(userWithProfile);
            setIsAuthenticated(true);
            console.log('User authenticated:', userWithProfile);
          } else {
            setUser(null);
            setIsAuthenticated(false);
          }
        } else {
          console.log('No session found');
          setSession(null);
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (err) {
        console.error('Error in getInitialSession:', err);
        setError(err instanceof Error ? err : new Error('An unknown error occurred'));
        setSession(null);
        setUser(null);
        setIsAuthenticated(false);
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
        console.log('User session found, processing profile...');
          try {
            const userWithProfile = await getUserProfile(session.user);
          if (userWithProfile) {
            setUser(userWithProfile);
            setIsAuthenticated(true);
            console.log('User profile updated and authenticated:', userWithProfile);
          } else {
            setUser(null);
            setIsAuthenticated(false);
            console.log('User profile not found or inactive');
          }
          } catch (err) {
            console.error('Error in auth state change:', err);
            setError(err instanceof Error ? err : new Error('Failed to load user profile'));
          setUser(null);
          setIsAuthenticated(false);
          }
      } else {
        console.log('No user session, clearing state');
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
      setError(null);
      setIsLoading(true);
      
      console.log('Attempting login with email:', email);
      
      // Only clean up if there's an existing session
      const { data: existingSession } = await supabase.auth.getSession();
      if (existingSession?.session) {
        try {
          await supabase.auth.signOut();
        } catch (err) {
          console.log("Sign out before login failed:", err);
        }
      }
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        console.error('Login error:', error);
        setError(error);
        throw error;
      }
      
      console.log('Login successful:', data);
      
      // The auth state change listener will handle setting the user
      return;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('An unknown error occurred');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
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