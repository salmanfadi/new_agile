import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Profile } from '@/types/database';
import { useNavigate } from 'react-router-dom';
import { toast } from './use-toast';

export function useAuth() {
  const [user, setUser] = useState<Profile | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const getUserProfile = async (userId: string) => {
    try {
      console.log('Fetching profile for user:', userId);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        throw error;
      }

      console.log('Profile data:', data);
      return data;
    } catch (error) {
      console.error('Profile fetch error:', error);
      return null;
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        setIsLoading(true);
        
        // Get current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          throw sessionError;
        }

        if (session?.user) {
          const profile = await getUserProfile(session.user.id);
          if (profile) {
            setUser(profile);
            setIsAuthenticated(true);
          } else {
            // Handle missing profile
            toast({
              variant: 'destructive',
              title: 'Profile Error',
              description: 'Unable to load user profile. Please try logging in again.',
            });
            await supabase.auth.signOut();
            navigate('/login');
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        toast({
          variant: 'destructive',
          title: 'Authentication Error',
          description: 'Please try logging in again.',
        });
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session);
      
      if (event === 'SIGNED_IN' && session?.user) {
        const profile = await getUserProfile(session.user.id);
        if (profile) {
          setUser(profile);
          setIsAuthenticated(true);
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setIsAuthenticated(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  return { user, isAuthenticated, isLoading };
}
