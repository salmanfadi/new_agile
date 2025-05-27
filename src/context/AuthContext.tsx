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

  // Remove or conditionally enable debug logging
  const DEBUG = false;
  // Replace all console.log with:
  if (DEBUG) {
    console.log('...');
  }

  // Helper function to clean up auth state
  const cleanupAuthState = () => {
    console.log('Cleaning up auth state...');
    
    // Clear all localStorage
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('supabase.') || key.includes('sb-') || key.includes('auth.')) {
        console.log('Removing from localStorage:', key);
        localStorage.removeItem(key);
      }
    });
    
    // Clear all sessionStorage
    Object.keys(sessionStorage || {}).forEach((key) => {
      if (key.startsWith('supabase.') || key.includes('sb-') || key.includes('auth.')) {
        console.log('Removing from sessionStorage:', key);
        sessionStorage.removeItem(key);
      }
    });

    // Reset auth state
    setUser(null);
    setSession(null);
    setIsAuthenticated(false);
    setError(null);
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
          setIsLoading(false);
          return;
        }

        if (data.session) {
          console.log('Session found, checking user profile...');
          setSession(data.session);
          
          if (data.session.user) {
            try {
              console.log('Fetching user profile for user ID:', data.session.user.id);
              const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('id, role')
                .eq('id', data.session.user.id)
                .single();
              
              if (profileError) {
                console.error('Error fetching user profile:', profileError);
                setIsAuthenticated(false);
                setUser(null);
                throw profileError;
              }

              if (!profileData) {
                console.error('No profile found for user');
                setIsAuthenticated(false);
                setUser(null);
                throw new Error('No profile found for user');
              }

              if (!profileData.active) {
                console.error('User account is inactive');
                setIsAuthenticated(false);
                setUser(null);
                throw new Error('Your account is currently inactive');
              }

              // Set the user with the role from the profiles table
              const userData: User = {
                ...data.session.user,
                role: profileData.role as UserRole,
                name: profileData.name || data.session.user.email?.split('@')[0] || 'User',
                username: profileData.username || data.session.user.email || '',
                active: profileData.active
              };

              console.log('Setting user data:', userData);
              setUser(userData);
              setIsAuthenticated(true);
            } catch (err) {
              console.error('Error processing user profile:', err);
              setIsAuthenticated(false);
              setUser(null);
              setError(err instanceof Error ? err : new Error('Failed to process user profile'));
            }
          }
        } else {
          setIsAuthenticated(false);
          setUser(null);
        }
      } catch (err) {
        console.error('Error in getInitialSession:', err);
        setError(err instanceof Error ? err : new Error('An unknown error occurred'));
        setIsAuthenticated(false);
        setUser(null);
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
            .select('id, role')
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
      // Clear any existing session first
      await supabase.auth.signOut();
      
      console.log('Attempting login for:', email);
      
      // Basic login attempt
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error('Login error:', error);
        throw new Error('Login failed. Please check your credentials and try again.');
      }

      if (!data?.user) {
        throw new Error('No user data received');
      }

      console.log('Auth successful, checking for existing profile...', data.user.id);

      // First check if profile exists
      const { data: existingProfiles, error: checkError } = await supabase
        .from('profiles')
        .select('id, role')
        .eq('id', data.user.id);

      if (checkError) {
        console.error('Error checking profile:', checkError);
        throw new Error(`Error checking profile: ${checkError.message}`);
      }

      let profileData;

      // If no profile exists or empty array returned, create one
      if (!existingProfiles || existingProfiles.length === 0) {
        console.log('No profile found, creating new profile...');
        
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert([{
            id: data.user.id,
            role: 'field_operator'
          }])
          .select('id, role')
          .single();

        if (createError) {
          console.error('Profile creation error:', createError);
          throw new Error(`Failed to create profile: ${createError.message}`);
        }

        profileData = newProfile;
        console.log('New profile created:', profileData);
      } else {
        // Use the first profile found
        profileData = existingProfiles[0];
        console.log('Existing profile found:', profileData);
      }

      // Set up the authenticated session with minimal required data
      const userData = {
        ...data.user,
        role: profileData.role,
        email: email
      };

      console.log('Final user data:', userData);

      setUser(userData);
      setSession(data.session);
      setIsAuthenticated(true);
      setError(null);

      return userData;

    } catch (error) {
      console.error('Login process error:', error);
      setUser(null);
      setSession(null);
      setIsAuthenticated(false);
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

  const forceRefreshSession = async () => {
    setIsLoading(true);
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) throw error;
      
      if (session?.user) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('role, name, username, active')
          .eq('id', session.user.id)
          .single();
          
        if (profileError) throw profileError;
        
        if (!profileData) throw new Error('No profile found');
        
        setUser({
          ...session.user,
          role: profileData.role as UserRole,
          name: profileData.name,
          username: profileData.username,
          active: profileData.active
        } as User);
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Force refresh error:', error);
      cleanupAuthState();
    } finally {
      setIsLoading(false);
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
    forceRefreshSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
