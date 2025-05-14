
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { UserRole } from '@/types/auth';

// Extend the User type to include our custom fields
export interface User extends SupabaseUser {
  role?: UserRole;
  name?: string;
  avatar_url?: string;
}

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error?: string;
  signIn: (email: string, password: string) => Promise<{
    error: Error | null;
    data: Session | null;
  }>;
  login: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, metadata?: { [key: string]: any }) => Promise<{
    error: Error | null;
    data: any;
  }>;
  signOut: () => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
  updateUser: (data: any) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  verifyOTP: (email: string, token: string, type: 'email' | 'magiclink') => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [error, setError] = useState<string | undefined>(undefined);

  useEffect(() => {
    const loadSession = async () => {
      try {
        setLoading(true);
        const { data: { session } } = await supabase.auth.getSession();

        setSession(session);
        setIsAuthenticated(!!session);

        if (session) {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profileError) {
            console.error("Error fetching profile:", profileError);
            setUser({
              ...session.user,
              role: undefined,
            } as User);
          } else {
            setUser({
              ...session.user,
              role: profile?.role as UserRole,
              name: profile?.name,
              avatar_url: profile?.avatar_url,
            } as User);
          }
        }
      } catch (error: any) {
        console.error("Error loading session:", error);
        setError(error?.message);
      } finally {
        setLoading(false);
      }
    };

    loadSession();

    supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setIsAuthenticated(!!session);
      if (session) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profileError) {
          console.error("Error fetching profile:", profileError);
          setUser({
            ...session.user,
            role: undefined,
          } as User);
        } else {
          setUser({
            ...session.user,
            role: profile?.role as UserRole,
            name: profile?.name,
            avatar_url: profile?.avatar_url,
          } as User);
        }
      } else {
        setUser(null);
      }
    });
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
        return { data: null, error };
      }

      return { data: data?.session, error: null };
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
        throw error;
      }
      
      setIsAuthenticated(true);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, metadata?: { [key: string]: any }) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
        },
      });

      return { data, error };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  // Alias for signOut
  const logout = signOut;

  // Placeholder functions for additional auth functionality
  const updateUser = async (data: any) => {
    // Implementation would go here
    console.log("Update user with data:", data);
  };

  const resetPassword = async (email: string) => {
    // Implementation would go here
    console.log("Reset password for email:", email);
  };

  const verifyOTP = async (email: string, token: string, type: 'email' | 'magiclink') => {
    // Implementation would go here
    console.log("Verify OTP for email:", email, "token:", token, "type:", type);
  };

  const value: AuthContextType = {
    user,
    session,
    isAuthenticated,
    signIn,
    login,
    signUp,
    signOut,
    logout,
    loading,
    isLoading: loading,
    error,
    updateUser,
    resetPassword,
    verifyOTP,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
