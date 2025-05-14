
import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session } from '@supabase/supabase-js';
import { UserRole } from '@/types/auth';

// Mock users for development
export const mockUsers = [
  { username: 'admin', password: 'password', role: 'admin', name: 'Admin User', id: '1' },
  { username: 'warehouse', password: 'password', role: 'warehouse_manager', name: 'Warehouse Manager', id: '2' },
  { username: 'field', password: 'password', role: 'field_operator', name: 'Field Operator', id: '3' },
  { username: 'sales', password: 'password', role: 'sales_operator', name: 'Sales Operator', id: '4' },
];

// Define the type for the user object that includes email
export interface User {
  id: string;
  email?: string;
  role?: UserRole;
  name?: string;
  username?: string;
}

// Define the Auth Context type
export interface AuthContextType {
  session: Session | null;
  user: User | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
}

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component
interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  // Initialize session on mount
  useEffect(() => {
    async function getInitialSession() {
      setIsLoading(true);
      
      try {
        // Clean up any existing auth state first
        cleanupAuthState();
        
        // Get initial session
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        
        // Set the session
        setSession(initialSession);
        
        // If session exists, fetch user profile
        if (initialSession?.user) {
          await fetchUserProfile(initialSession.user.id);
          setIsAuthenticated(true);
        } else {
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : 'Unknown error occurred';
        setError(`Error initializing session: ${errorMessage}`);
        console.error('Error initializing session:', e);
      } finally {
        setIsLoading(false);
      }
    }
    
    getInitialSession();

    // Set up auth listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change event:', event);
        setSession(session);
        
        // Handle sign in and user update events - use setTimeout to avoid deadlocks
        if ((event === 'SIGNED_IN' || event === 'USER_UPDATED') && session?.user) {
          setIsAuthenticated(true);
          
          // Use setTimeout to avoid potential Supabase auth deadlocks
          setTimeout(async () => {
            await fetchUserProfile(session.user.id);
          }, 0);
        }
        
        // Handle sign out event
        if (event === 'SIGNED_OUT') {
          setUser(null);
          setIsAuthenticated(false);
        }
        
        setIsLoading(false);
      }
    );
    
    // Clean up subscription
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Function to clean up auth state
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

  // Function to fetch user profile data from profiles table
  const fetchUserProfile = async (userId: string) => {
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        throw profileError;
      }

      // Get auth user to get the email
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        console.error('Error fetching auth user:', authError);
        throw authError;
      }

      // Combine auth user data with profile data
      setUser({
        id: userId,
        email: authUser?.email,
        role: profileData?.role as UserRole,
        name: profileData?.name || authUser?.user_metadata?.name,
        username: profileData?.username
      });
      
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Unknown error occurred';
      setError(`Error fetching profile: ${errorMessage}`);
      console.error('Error fetching profile:', e);
      
      // Still set basic user data from auth
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        setUser({
          id: authUser.id,
          email: authUser.email || undefined,
        });
      }
    }
  };

  // Sign in with email and password
  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Clean up existing state first
      cleanupAuthState();
      
      // Attempt global sign out first
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (err) {
        // Continue even if this fails
        console.log("Sign out before sign in failed:", err);
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        throw error;
      }

      // Session is automatically updated via the auth listener
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Unknown error occurred';
      setError(`Sign in error: ${errorMessage}`);
      console.error('Sign in error:', e);
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Clean up auth state
      cleanupAuthState();
      
      // Attempt global sign out
      const { error } = await supabase.auth.signOut({ scope: 'global' });
      
      if (error) {
        throw error;
      }
      
      // Force a page reload for a clean state
      window.location.href = '/login';
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Unknown error occurred';
      setError(`Sign out error: ${errorMessage}`);
      console.error('Sign out error:', e);
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  // Mock login function for development
  const login = async (username: string, password: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Check if the username matches any of our mock users
      const mockUser = mockUsers.find(u => 
        u.username.toLowerCase() === username.toLowerCase() && u.password === password
      );
      
      if (mockUser) {
        setUser({
          id: mockUser.id,
          email: `${mockUser.username}@example.com`,
          role: mockUser.role as UserRole,
          name: mockUser.name,
          username: mockUser.username
        });
        setIsAuthenticated(true);
        
        // Navigate to the appropriate dashboard based on role
        console.log("Mock login successful for", mockUser.role);
      } else {
        // Try real Supabase auth if no mock user found
        await signIn(username, password);
      }
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Unknown error occurred';
      setError(`Login error: ${errorMessage}`);
      console.error('Login error:', e);
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  // Create the value object
  const value: AuthContextType = {
    session,
    user,
    signIn,
    signOut,
    isLoading,
    error,
    isAuthenticated,
    login
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use the auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};
