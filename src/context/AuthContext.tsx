
import React, { createContext, useContext, useEffect } from 'react';
import { User, UserRole, AuthState } from '../types/auth';
import { supabase } from '@/integrations/supabase/client';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { toast } from '@/components/ui/use-toast';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  signUp: (email: string, password: string, username: string, name: string) => Promise<void>;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// For development/demo purposes only - in a real app, remove this
// Now we export mockUsers so we can import it in Login.tsx
export const mockUsers: User[] = [
  { id: '1', username: 'admin', role: 'admin', name: 'Admin User' },
  { id: '2', username: 'warehouse', role: 'warehouse_manager', name: 'Warehouse Manager' },
  { id: '3', username: 'field', role: 'field_operator', name: 'Field Operator' },
  { id: '4', username: 'sales', role: 'sales_operator', name: 'Sales Operator' },
  { id: '5', username: 'salesoperator@gmail.com', role: 'sales_operator', name: 'Sales Operator' }
];

const mapSupabaseUser = async (supabaseUser: SupabaseUser | null): Promise<User | null> => {
  if (!supabaseUser) return null;
  
  try {
    // Fetch the user's profile from our profiles table
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('username, role, name')
      .eq('id', supabaseUser.id)
      .single();
    
    if (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
    
    if (!profile) {
      console.error('No profile found for user');
      return null;
    }
    
    return {
      id: supabaseUser.id,
      username: profile.username,
      role: profile.role as UserRole,
      name: profile.name || supabaseUser.email?.split('@')[0] || 'User',
    };
  } catch (error) {
    console.error('Error mapping Supabase user:', error);
    return null;
  }
};

// Helper function to clean up auth state
const cleanupAuthState = () => {
  // Remove standard auth tokens
  localStorage.removeItem('supabase.auth.token');
  
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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Fix: Properly define state using React.useState 
  const [state, setState] = React.useState<AuthState>(initialState);

  useEffect(() => {
    const initAuth = async () => {
      console.log("Starting auth initialization");
      
      try {
        // Check for mock users first (for demo purposes)
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          console.log("Found stored mock user on init");
          const user = JSON.parse(storedUser);
          setState({
            user,
            isAuthenticated: true,
            isLoading: false,
          });
          return;
        }
        
        // Set up auth state listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            console.log("Auth state changed:", event, !!session);
            
            try {
              if (session) {
                // Use setTimeout to prevent potential deadlocks
                setTimeout(async () => {
                  const user = await mapSupabaseUser(session.user);
                  setState({
                    user,
                    isAuthenticated: !!user,
                    isLoading: false,
                  });
                }, 0);
              } else {
                setState({
                  user: null,
                  isAuthenticated: false,
                  isLoading: false,
                });
              }
            } catch (error) {
              console.error("Error in auth state change handler:", error);
              setState({
                user: null,
                isAuthenticated: false,
                isLoading: false,
              });
            }
          }
        );
        
        // Check for existing session
        const { data: { session } } = await supabase.auth.getSession();
        console.log("Initial session check:", !!session);
        
        if (session) {
          const user = await mapSupabaseUser(session.user);
          setState({
            user,
            isAuthenticated: !!user,
            isLoading: false,
          });
        } else {
          // If no session and no mock user, set loading to false
          setState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
        
        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error("Auth initialization error:", error);
        setState({
          ...initialState,
          isLoading: false, // Important: set loading to false on error
        });
      }
    };

    // Set a timeout to ensure loading state doesn't get stuck forever
    const timeoutId = setTimeout(() => {
      if (state.isLoading) {
        console.log("Auth initialization timeout - forcing loading state to false");
        setState(prev => ({
          ...prev,
          isLoading: false
        }));
      }
    }, 3000); // Reduced from 5s to 3s for faster fallback

    initAuth();

    return () => clearTimeout(timeoutId);
  }, []);

  const login = async (email: string, password: string) => {
    setState(prev => ({ ...prev, isLoading: true }));
    console.log("Login attempt with:", email);
    
    try {
      // Clean up existing state first
      cleanupAuthState();
      
      // For demo purposes, support both real auth and mock users
      // Normalize email for comparison
      const normalizedEmail = email.toLowerCase();
      
      // Check if this is a mock user login (either by username or email)
      if (email === 'admin' || 
          email === 'warehouse' || 
          email === 'field' || 
          email === 'sales' ||
          normalizedEmail === 'salesoperator@gmail.com') {
        // Use mock users for demo
        // First try to find by username
        let user = mockUsers.find(u => u.username === email.toLowerCase());
        
        // If not found by username, try by email (for salesoperator@gmail.com)
        if (!user) {
          user = mockUsers.find(u => u.username === normalizedEmail);
        }
        
        if (!user) {
          console.error(`Mock user not found for: ${email}`);
          throw new Error('Invalid username or password');
        }
        
        console.log(`Mock user found: ${user.username} with role: ${user.role}`);
        localStorage.setItem('user', JSON.stringify(user));
        
        setState({
          user,
          isAuthenticated: true,
          isLoading: false,
        });
        
        toast({
          title: "Welcome back!",
          description: `Logged in as ${user.name} (${user.role})`,
        });

        // Fix: Correctly map all roles to their right paths, including sales_operator
        const redirectPath = user.role === 'admin' 
          ? '/admin' 
          : user.role === 'warehouse_manager' 
            ? '/manager' 
            : user.role === 'field_operator'
              ? '/operator'
              : user.role === 'sales_operator'
                ? '/sales'
                : '/login';
        
        console.log("Redirecting user to:", redirectPath, "with role:", user.role);
        window.location.href = redirectPath;
      } else {
        // Use Supabase auth
        // First attempt global sign out to ensure clean state
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
          throw error;
        }

        const user = await mapSupabaseUser(data.user);
        
        if (!user) {
          throw new Error('Failed to fetch user profile');
        }
        
        setState({
          user,
          isAuthenticated: true,
          isLoading: false,
        });
        
        toast({
          title: "Welcome back!",
          description: `Logged in as ${user.name}`,
        });

        // Direct navigation without timeout
        const redirectPath = user.role === 'admin' 
          ? '/admin' 
          : user.role === 'warehouse_manager' 
            ? '/manager' 
            : user.role === 'field_operator'
              ? '/operator'
              : '/sales';
            
        window.location.href = redirectPath;
      }
    } catch (error) {
      console.error('Login error:', error);
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
      
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "Invalid credentials",
        variant: "destructive",
      });
    }
  };

  const signUp = async (email: string, password: string, username: string, name: string) => {
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      const { data, error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          data: {
            username,
            name
          }
        }
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Account created",
        description: "Please check your email to verify your account",
      });
      
      setState(prev => ({ ...prev, isLoading: false }));
    } catch (error) {
      console.error('Signup error:', error);
      setState(prev => ({ ...prev, isLoading: false }));
      
      toast({
        title: "Signup failed",
        description: error instanceof Error ? error.message : "Failed to create account",
        variant: "destructive",
      });
    }
  };

  const logout = async () => {
    // Handle both mock and real auth
    const { user } = state;
    
    // Clean up auth state first
    cleanupAuthState();
    
    if (user && mockUsers.some(mockUser => mockUser.id === user.id)) {
      // Mock logout
      localStorage.removeItem('user');
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    } else {
      // Supabase logout - attempt global sign out for clean state
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (err) {
        // Ignore errors
        console.log("Sign out error:", err);
      }
      
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
    
    toast({
      title: "Logged out",
      description: "You have been successfully logged out",
    });
    
    // Force page reload for a clean state
    window.location.href = '/login';
  };

  // Add a debug value to see auth state in React DevTools
  const debugValue = {
    ...state,
    login,
    logout,
    signUp,
    _debug: {
      mockUsers,
      hasLocalStorageUser: !!localStorage.getItem('user')
    }
  };

  return (
    <AuthContext.Provider value={debugValue}>
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
