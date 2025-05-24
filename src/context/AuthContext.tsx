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

  // Helper function to get user profile
  const getUserProfile = async (authUser: any) => {
    try {
      console.log('Fetching user profile for user ID:', authUser.id);
      
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('role, name, username, active')
        .eq('id', authUser.id)
        .single();
        
      console.log('Profile fetch result:', { profileData, profileError });
      
      if (profileError) {
        console.error('Error fetching user profile:', profileError);
        // If profile doesn't exist, create a default one
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert([{
            id: authUser.id,
            username: authUser.email?.split('@')[0] || 'user',
            name: authUser.email?.split('@')[0] || 'User',
            role: 'field_operator' as UserRole,
            active: true
          }])
          .select()
          .single();
          
        if (createError) {
          console.error('Error creating profile:', createError);
          // Fallback to default user
          return {
            ...authUser,
            role: 'field_operator' as UserRole,
            name: authUser.email?.split('@')[0] || 'User',
            username: authUser.email || '',
            active: true
          } as User;
        }
        
        return {
          ...authUser,
          role: newProfile.role as UserRole,
          name: newProfile.name,
          username: newProfile.username,
          active: newProfile.active
        } as User;
      }
      
      if (profileData) {
        return {
          ...authUser,
          role: profileData.role as UserRole,
          name: profileData.name || authUser.email?.split('@')[0] || 'User',
          username: profileData.username || authUser.email || '',
          active: profileData.active !== false
        } as User;
      }
      
      // Fallback if no profile data
      return {
        ...authUser,
        role: 'field_operator' as UserRole,
        name: authUser.email?.split('@')[0] || 'User',
        username: authUser.email || '',
        active: true
      } as User;
    } catch (err) {
      console.error('Error processing user profile:', err);
      // Return fallback user
      return {
        ...authUser,
        role: 'field_operator' as UserRole,
        name: authUser.email?.split('@')[0] || 'User',
        username: authUser.email || '',
        active: true
      } as User;
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
        setIsAuthenticated(true);
        
        // Use setTimeout to avoid potential deadlocks
        setTimeout(async () => {
          try {
            const userWithProfile = await getUserProfile(session.user);
            setUser(userWithProfile);
            console.log('User profile updated:', userWithProfile);
          } catch (err) {
            console.error('Error in auth state change:', err);
            setError(err instanceof Error ? err : new Error('Failed to load user profile'));
          }
        }, 0);
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
      
      // Clean up any existing auth state
      cleanupAuthState();
      
      // Attempt global sign out to ensure clean state
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (err) {
        console.log("Sign out before login failed:", err);
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
