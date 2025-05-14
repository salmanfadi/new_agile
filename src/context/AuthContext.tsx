import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session } from '@supabase/supabase-js';
import { UserRole } from '@/types/auth';

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
  signOut: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
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
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        setSession(initialSession);
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
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    }
    getInitialSession();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        if ((event === 'SIGNED_IN' || event === 'USER_UPDATED') && session?.user) {
          setIsAuthenticated(true);
          await fetchUserProfile(session.user.id);
        }
        if (event === 'SIGNED_OUT') {
          setUser(null);
          setIsAuthenticated(false);
        }
        setIsLoading(false);
      }
    );
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Function to fetch user profile data from profiles table
  const fetchUserProfile = async (userId: string) => {
    try {
      console.log("AuthContext: Fetching user profile for ID:", userId);
      
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.error("AuthContext: Error fetching profile:", profileError);
        throw profileError;
      }

      if (!profileData) {
        console.error("AuthContext: Profile not found for user:", userId);
        throw new Error('Profile not found');
      }

      // Get auth user to get the email
      console.log("AuthContext: Fetching auth user data");
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        console.error("AuthContext: Error fetching auth user:", authError);
        throw authError;
      }

      // Ensure the role is properly set from the profile data
      const userRole = profileData.role as UserRole;
      if (!userRole) {
        console.error("AuthContext: User role not found in profile");
        throw new Error('User role not found in profile');
      }

      // Combine auth user data with profile data
      const userData = {
        id: userId,
        email: authUser?.email,
        role: userRole,
        name: profileData.name || authUser?.user_metadata?.name,
        username: profileData.username
      };

      console.log("AuthContext: Setting user data:", userData);
      setUser(userData);
      setIsAuthenticated(true);
      
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Unknown error occurred';
      console.error("AuthContext: Error in fetchUserProfile:", errorMessage);
      setError(`Error fetching profile: ${errorMessage}`);
      throw e;
    }
  };

  // Sign out
  const signOut = async () => {
    setIsLoading(true);
    setUser(null);
    setIsAuthenticated(false);
    setSession(null);
    try {
      await supabase.auth.signOut({ scope: 'global' });
    } catch (e) {
      // ignore
    }
    // Clear local/session storage
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('supabase.auth.') || key.includes('sb-')) localStorage.removeItem(key);
    });
    Object.keys(sessionStorage).forEach((key) => {
      if (key.startsWith('supabase.auth.') || key.includes('sb-')) sessionStorage.removeItem(key);
    });
    setIsLoading(false);
    window.location.href = '/login';
  };

  // Login function
  const login = async (email: string, password: string) => {
    try {
      console.log("AuthContext: Starting login process");
      setIsLoading(true);
      setError(null);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error("AuthContext: Sign in error:", error);
        throw error;
      }

      if (!data.user) {
        console.error("AuthContext: No user data returned from authentication");
        throw new Error('No user data returned from authentication');
      }

      console.log("AuthContext: Sign in successful, fetching user profile");
      await fetchUserProfile(data.user.id);
      console.log("AuthContext: Login process completed successfully");
      
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Unknown error occurred';
      console.error("AuthContext: Login error:", errorMessage);
      setError(`Login error: ${errorMessage}`);
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  // Create the value object
  const value: AuthContextType = {
    session,
    user,
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
