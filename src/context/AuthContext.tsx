
import React, { createContext, useContext, useState, useEffect } from 'react';
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
const mockUsers: User[] = [
  { id: '1', username: 'admin', role: 'admin', name: 'Admin User' },
  { id: '2', username: 'warehouse', role: 'warehouse_manager', name: 'Warehouse Manager' },
  { id: '3', username: 'field', role: 'field_operator', name: 'Field Operator' }
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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>(initialState);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    const initAuth = async () => {
      // First check for existing session
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const user = await mapSupabaseUser(session.user);
          setState({
            user,
            isAuthenticated: !!user,
            isLoading: false,
          });
        } else {
          // Check if there's a mock user in localStorage (for demo)
          const storedUser = localStorage.getItem('user');
          if (storedUser) {
            const user = JSON.parse(storedUser);
            setState({
              user,
              isAuthenticated: true,
              isLoading: false,
            });
          } else {
            setState({
              ...initialState,
              isLoading: false,
            });
          }
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        setState({
          ...initialState,
          isLoading: false,
        });
      }
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        try {
          if (session) {
            const user = await mapSupabaseUser(session.user);
            setState({
              user,
              isAuthenticated: !!user,
              isLoading: false,
            });
          } else {
            // Check for mock users when Supabase session is not available
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
              const user = JSON.parse(storedUser);
              setState({
                user,
                isAuthenticated: true,
                isLoading: false,
              });
            } else {
              setState({
                user: null,
                isAuthenticated: false,
                isLoading: false,
              });
            }
          }
        } catch (error) {
          console.error("Auth state change error:", error);
          setState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      }
    );

    initAuth();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      // For demo purposes, support both real auth and mock users
      if (email === 'admin' || email === 'warehouse' || email === 'field') {
        // Use mock users for demo
        const user = mockUsers.find(u => u.username === email.toLowerCase());
        
        if (!user) {
          throw new Error('Invalid username or password');
        }
        
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
      } else {
        // Use Supabase auth
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
    
    if (user && mockUsers.some(mockUser => mockUser.id === user.id)) {
      // Mock logout
      localStorage.removeItem('user');
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    } else {
      // Supabase logout
      await supabase.auth.signOut();
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
  };

  return (
    <AuthContext.Provider value={{ ...state, login, logout, signUp }}>
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
