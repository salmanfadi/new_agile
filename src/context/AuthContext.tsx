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
        const defaultRole = authUser.email === 'admin@gmail.com' ? 'admin' : 'field_operator';
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert([{
            id: authUser.id,
            username: authUser.email?.split('@')[0] || 'user',
            name: authUser.email?.split('@')[0] || 'User',
            role: defaultRole as UserRole,
            active: true
          }])
          .select()
          .single();
          
        if (createError) {
          console.error('Error creating profile:', createError);
          // Fallback to default user with proper role
          return {
            ...authUser,
            role: defaultRole as UserRole,
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
        // Ensure admin@gmail.com always has admin role
        const role = authUser.email === 'admin@gmail.com' ? 'admin' : profileData.role;
        return {
          ...authUser,
          role: role as UserRole,
          name: profileData.name || authUser.email?.split('@')[0] || 'User',
          username: profileData.username || authUser.email || '',
          active: profileData.active !== false
        } as User;
      }
      
      // Fallback if no profile data, with proper role for admin
      const defaultRole = authUser.email === 'admin@gmail.com' ? 'admin' : 'field_operator';
      return {
        ...authUser,
        role: defaultRole as UserRole,
        name: authUser.email?.split('@')[0] || 'User',
        username: authUser.email || '',
        active: true
      } as User;
    } catch (err) {
      console.error('Error processing user profile:', err);
      // Return fallback user with proper role for admin
      const defaultRole = authUser.email === 'admin@gmail.com' ? 'admin' : 'field_operator';
      return {
        ...authUser,
        role: defaultRole as UserRole,
        name: authUser.email?.split('@')[0] || 'User',
        username: authUser.email || '',
        active: true
      } as User;
    }
  };

  useEffect(() => {
    console.log('AuthContext: Initializing...');
    
    // Get initial session with retry mechanism
    const getInitialSession = async () => {
      setIsLoading(true);
      let retryCount = 0;
      const maxRetries = 3;
      const timeout = 120000; // Increased timeout to 2 minutes
      
      const attemptSessionFetch = async () => {
        try {
          console.log(`Fetching session from Supabase (attempt ${retryCount + 1})...`);
          
          const sessionPromise = supabase.auth.getSession();
          const timeoutPromise = new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('Auth check timeout')), timeout)
          );
          
          const { data, error } = await Promise.race([
            sessionPromise,
            timeoutPromise
          ]);
          
          if (error) {
            throw error;
          }
          
          if (data?.session) {
            console.log('Session found, processing user...');
            setSession(data.session);
            
            if (data.session.user) {
              const userWithProfile = await getUserProfile(data.session.user);
              if (userWithProfile) {
                setUser(userWithProfile);
                setIsAuthenticated(true);
                console.log('User authenticated:', userWithProfile);
              } else {
                console.log('No user profile found');
                setUser(null);
                setIsAuthenticated(false);
              }
            }
          } else {
            console.log('No session found');
            setSession(null);
            setUser(null);
            setIsAuthenticated(false);
          }
          return true;
        } catch (err) {
          console.error(`Error in getInitialSession (attempt ${retryCount + 1}):`, err);
          if (retryCount < maxRetries - 1) {
            retryCount++;
            console.log(`Retrying in ${retryCount * 2} seconds...`);
            await new Promise(resolve => setTimeout(resolve, retryCount * 2000));
            return attemptSessionFetch();
          }
          setError(err instanceof Error ? err : new Error('Failed to initialize auth'));
          setSession(null);
          setUser(null);
          setIsAuthenticated(false);
          return false;
        }
      };
      
      try {
        await attemptSessionFetch();
      } finally {
        setIsLoading(false);
      }
    };
    
    getInitialSession();
    
    // Listen for auth changes with timeout handling
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', { event, session });
      
      try {
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Auth state change timeout')), 120000) // Increased timeout to 2 minutes
        );
        
        await Promise.race([
          (async () => {
            setSession(session);
            
            if (session?.user) {
              console.log('User session found, processing profile...');
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
            } else {
              console.log('No user session, clearing state');
              setUser(null);
              setIsAuthenticated(false);
            }
          })(),
          timeoutPromise
        ]);
      } catch (err) {
        console.error('Error in auth state change:', err);
        setError(err instanceof Error ? err : new Error('Auth state change failed'));
        // Don't clear auth state on timeout, maintain previous state
        if (!(err instanceof Error && err.message.includes('timeout'))) {
          setUser(null);
          setIsAuthenticated(false);
        }

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