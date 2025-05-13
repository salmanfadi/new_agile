import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { User, UserRole, AuthState } from '../types/auth';
import { supabase } from '@/integrations/supabase/client';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { toast } from '@/components/ui/use-toast';

// Check if we're in a restricted environment
const isRestrictedEnvironment = typeof window !== 'undefined' && 
  (window.self !== window.top || /webcontainer|gpteng\.co/.test(navigator.userAgent));

// Mock user data for development
type MockUser = Omit<User, 'user_metadata' | 'app_metadata' | 'avatar_url' | 'is_anonymous'> & {
  created_at: string;
  updated_at: string;
};

export const mockUsers: MockUser[] = [
  { 
    id: '1', 
    username: 'admin', 
    email: 'admin@example.com',
    role: 'admin', 
    name: 'Admin User',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  { 
    id: '2', 
    username: 'warehouse', 
    email: 'warehouse@example.com',
    role: 'warehouse_manager', 
    name: 'Warehouse Manager',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  { 
    id: '3', 
    username: 'field', 
    email: 'field@example.com',
    role: 'field_operator', 
    name: 'Field Operator',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  { 
    id: '4', 
    username: 'sales', 
    email: 'sales@example.com',
    role: 'sales_operator', 
    name: 'Sales Operator',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

// Create mock user function
const createMockUser = (email?: string): User => {
  // Create a base user object
  const baseUser: User = {
    id: 'mock-user-id',
    email: email || 'mock@example.com',
    username: '',
    name: 'Mock User',
    role: 'admin',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    user_metadata: {
      full_name: 'Mock User',
      avatar_url: ''
    },
    app_metadata: {
      provider: 'email',
      roles: ['admin']
    },
    avatar_url: '',
    is_anonymous: false
  };

  // If no email provided, return the base user
  if (!email) {
    return baseUser;
  }

  // Generate username and name from email
  const username = email.split('@')[0];
  const name = username.charAt(0).toUpperCase() + username.slice(1);
  
  // Try to find a matching mock user by email or username
  const matchedUser = mockUsers.find(user => 
    user.email === email || user.username === username
  );
  
  if (matchedUser) {
    return {
      ...matchedUser,
      user_metadata: {
        full_name: matchedUser.name,
        avatar_url: ''
      },
      app_metadata: {
        provider: 'email',
        roles: [matchedUser.role]
      },
      avatar_url: '',
      is_anonymous: false
    };
  }
  
  // Return a user based on the provided email
  return {
    ...baseUser,
    email: email,
    username: username,
    name: name,
    user_metadata: {
      full_name: name,
      avatar_url: ''
    }
  };
};

interface SignUpResponse {
  data: { 
    user: User | null;
    session?: any;
  } | null;
  error: Error | null;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  signUp: (
    email: string, 
    password: string, 
    username: string, 
    name: string
  ) => Promise<SignUpResponse>;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper function to delay execution
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Check for required environment variables
const checkEnvVars = () => {
  if (!import.meta.env.VITE_SUPABASE_URL) {
    console.error('Missing required environment variable: VITE_SUPABASE_URL');
    return false;
  }
  if (!import.meta.env.VITE_SUPABASE_ANON_KEY) {
    console.error('Missing required environment variable: VITE_SUPABASE_ANON_KEY');
    return false;
  }
  return true;
};

// Enhanced retry function with better error handling and network detection
const retryWithBackoff = async <T,>(
  fn: () => Promise<T>,
  retries = 3,
  baseDelay = 1000,
  operation = 'operation'
): Promise<T> => {
  // Check for network connectivity first
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    const error = new Error('No internet connection. Please check your network and try again.');
    console.error(error.message);
    throw error;
  }

  // Check environment variables
  const envCheck = checkEnvVars();
  if (!envCheck) {
    const error = new Error('Missing required Supabase environment variables. Please check your .env file.');
    console.error(error.message);
    throw error;
  }

  let lastError: unknown;

  for (let i = 0; i < retries; i++) {
    const attempt = i + 1;
    const delayTime = baseDelay * Math.pow(2, i);
    
    try {
      console.log(`Attempt ${attempt}/${retries}: ${operation}`);
      const result = await fn();
      console.log(`Success on attempt ${attempt}: ${operation}`);
      return result;
    } catch (error) {
      lastError = error;
      let errorMessage = 'Unknown error';
      let status = 'N/A';
      let url = 'N/A';

      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (error && typeof error === 'object') {
        // Handle Supabase errors
        if ('message' in error) {
          errorMessage = String(error.message);
        }
        if ('status' in error) {
          status = String(error.status);
        }
        if ('url' in error) {
          url = String(error.url);
        }
      }
      
      // Enhanced error logging
      console.error(`Attempt ${attempt} failed (${operation}):`, {
        error: errorMessage,
        status,
        url,
        retryIn: `${delayTime}ms`,
        remainingRetries: retries - attempt - 1,
        timestamp: new Date().toISOString(),
        errorObject: error
      });
      
      // Don't retry for certain errors
      if (errorMessage.includes('NetworkError') || 
          errorMessage.includes('Failed to fetch') ||
          errorMessage.includes('JWT expired') ||
          errorMessage.includes('Invalid login credentials')) {
        throw error;
      }
      
      if (i === retries - 1) {
        console.error(`All ${retries} attempts failed for operation: ${operation}`);
        throw error;
      }
      
      console.log(`Retrying in ${delayTime}ms...`);
      await delay(delayTime);
    }
  }
  
  throw lastError || new Error(`Retry failed after ${retries} attempts for operation: ${operation}`);
};

interface UserProfile {
  id: string;
  username: string;
  role: string;
  name: string;
  created_at: string;
  updated_at: string;
}

const mapSupabaseUser = async (supabaseUser: SupabaseUser | null): Promise<User | null> => {
  if (!supabaseUser) {
    console.log('No Supabase user provided to mapSupabaseUser');
    return null;
  }

  // In restricted environment or for mock users, return mock data
  if (isRestrictedEnvironment || supabaseUser.id === 'mock-user-id') {
    console.warn('Using mock user data for:', supabaseUser.email);
    return createMockUser(supabaseUser.email || undefined);
  }
  
  try {
    // Get the user's profile from the profiles table
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', supabaseUser.id)
      .single();
    
    if (profileError) {
      console.error('Error fetching user profile:', profileError);
      throw profileError;
    }
    
    if (!profileData) {
      console.error('No profile data found for user:', supabaseUser.id);
      throw new Error('No profile data found');
    }
    
    // Get the email from the auth user
    const email = supabaseUser.email || '';
    
    // Create user object with profile data
    const user: User = {
      id: supabaseUser.id,
      email: email,
      username: profileData.username || email.split('@')[0],
      name: profileData.full_name || profileData.username || email.split('@')[0],
      role: (profileData.role as UserRole) || 'customer',
      created_at: profileData.created_at || new Date().toISOString(),
      updated_at: profileData.updated_at || new Date().toISOString(),
      avatar_url: profileData.avatar_url || '',
      user_metadata: supabaseUser.user_metadata || {},
      app_metadata: supabaseUser.app_metadata || {},
      last_sign_in_at: supabaseUser.last_sign_in_at || new Date().toISOString()
    };
    
    return user;
  } catch (error) {
    console.error('Error in mapSupabaseUser:', error);
    
    // If we can't get the profile, return a minimal user object
    if (error instanceof Error) {
      // If it's a 404, the profile might not exist yet
      if (error.message.includes('No rows returned') || 
          error.message.includes('No profile data found')) {
        console.warn('No profile found for user, creating a default one');
        
        const email = supabaseUser.email || '';
        const username = email.split('@')[0];
        
        // Try to create a default profile
        try {
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert([{
              id: supabaseUser.id,
              username: username,
              full_name: username,
              role: 'customer',
              is_active: true
            }])
            .select()
            .single();
            
          if (createError) throw createError;
          
          return {
            id: supabaseUser.id,
            email: email,
            username: newProfile.username,
            name: newProfile.full_name || newProfile.username,
            role: (newProfile.role as UserRole) || 'customer',
            created_at: newProfile.created_at || new Date().toISOString(),
            updated_at: newProfile.updated_at || new Date().toISOString(),
            avatar_url: newProfile.avatar_url || ''
          };
        } catch (innerError) {
          console.error('Error creating default profile:', innerError);
        }
      }
    }
    
    // If all else fails, return a minimal user object
    const email = supabaseUser.email || '';
    const username = email.split('@')[0];
    
    return {
      id: supabaseUser.id,
      email: email,
      username: username,
      name: username,
      role: 'customer',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }
};

// Helper function to clean up auth state
const cleanupAuthState = (isMockUser = false) => {
  if (isMockUser) {
    localStorage.removeItem('user');
  } else {
    // Clear any auth tokens from localStorage
    localStorage.removeItem('sb-access-token');
    localStorage.removeItem('sb-refresh-token');
  }
  
  // Clear any session data
  sessionStorage.clear();
  
  // Clear any cookies that might be set by Supabase
  document.cookie.split(';').forEach(cookie => {
    const [name] = cookie.split('=');
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  });
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>(initialState);
  
  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          const user = await mapSupabaseUser(session.user);
          if (user) {
            setState({
              user,
              isAuthenticated: true,
              isLoading: false
            });
            return;
          }
        }
        
        setState(prev => ({ ...prev, isLoading: false }));
      } catch (error) {
        console.error('Auth initialization error:', error);
        setState(prev => ({ ...prev, isLoading: false }));
      }
    };

    initAuth();
    
    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event);
        
        if (session?.user) {
          const user = await mapSupabaseUser(session.user);
          if (user) {
            setState({
              user,
              isAuthenticated: true,
              isLoading: false
            });
            return;
          }
        }
        
        setState(prev => ({
          ...prev,
          user: null,
          isAuthenticated: false,
          isLoading: false
        }));
      }
    );
    
    return () => {
      subscription?.unsubscribe();
    };
  }, []);
  
  const login = useCallback(async (email: string, password: string): Promise<User> => {
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      if (isRestrictedEnvironment) {
        const mockUser = createMockUser(email);
        setState({
          user: mockUser,
          isAuthenticated: true,
          isLoading: false
        });
        return mockUser;
      }
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        throw error;
      }
      
      if (!data?.user) {
        throw new Error('No user data returned from authentication');
      }
      
      // Map the Supabase user to our User type
      const user = await mapSupabaseUser(data.user);
      
      if (!user) {
        throw new Error('Failed to map user data');
      }
      
      setState({
        user,
        isAuthenticated: true,
        isLoading: false
      });
      
      return user;
    } catch (error) {
      console.error('Login error:', error);
      setState(prev => ({
        ...prev,
        user: null,
        isAuthenticated: false,
        isLoading: false
      }));
      throw error;
    }
  }, []);
  
  const logout = useCallback(async () => {
    try {
      if (!isRestrictedEnvironment) {
        await supabase.auth.signOut();
      }
      
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false
      });
      
      cleanupAuthState(state.user?.id === 'mock-user-id');
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }, [state.user?.id]);
  
  const signUp = useCallback(async (email: string, password: string, username: string, name: string) => {
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      if (isRestrictedEnvironment) {
        const mockUser = createMockUser(email);
        setState({
          user: mockUser,
          isAuthenticated: true,
          isLoading: false
        });
        return { data: { user: mockUser }, error: null };
      }
      
      // First sign up the user with Supabase Auth
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            full_name: name,
            role: 'customer' // Default role for new users
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });
      
      if (signUpError) {
        throw signUpError;
      }
      
      let user: User | null = null;
      
      // If we have a user, create their profile
      if (authData.user) {
        // The trigger should create the profile, but we'll check and create if needed
        try {
          // Try to get the profile to see if it was created by the trigger
          const { data: profileData, error: profileFetchError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', authData.user.id)
            .single();
          
          // If profile doesn't exist, create it
          if (profileFetchError || !profileData) {
            const newProfile = {
              id: authData.user.id,
              username: username,
              full_name: name,
              email: email,
              role: 'customer',
              is_active: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };
            
            const { error: profileError } = await supabase
              .from('profiles')
              .insert(newProfile);
              
            if (profileError) {
              console.error('Manual profile creation failed:', profileError);
              throw new Error('Failed to create user profile');
            }
          }
          
          // Create the user object for our app
          user = {
            id: authData.user.id,
            email: email,
            username: username,
            name: name,
            role: 'customer',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            user_metadata: authData.user.user_metadata || {},
            app_metadata: authData.user.app_metadata || {}
          };
          
          setState({
            user,
            isAuthenticated: true,
            isLoading: false
          });
          
        } catch (error) {
          console.error('Error during profile setup:', error);
          // Don't fail the signup if profile creation fails, but log it
          // The user can update their profile later
        }
      }
      
      return { 
        data: { 
          user: user || null,
          session: authData.session
        },
        error: null 
      };
    } catch (error) {
      console.error('Signup error:', error);
      setState(prev => ({ ...prev, isLoading: false }));
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error('An unknown error occurred') 
      };
    }
  }, []);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    ...state,
    login,
    logout,
    signUp
  }), [state, login, logout, signUp]);

  // This helps with debugging in React DevTools
  React.useDebugValue(contextValue);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
