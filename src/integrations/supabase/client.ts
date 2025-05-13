import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Enhanced error checking for environment variables
const checkEnvVars = () => {
  const missingVars = [];
  
  if (!import.meta.env.VITE_SUPABASE_URL) {
    console.error('❌ Missing required environment variable: VITE_SUPABASE_URL');
    missingVars.push('VITE_SUPABASE_URL');
  }
  
  if (!import.meta.env.VITE_SUPABASE_ANON_KEY) {
    console.error('❌ Missing required environment variable: VITE_SUPABASE_ANON_KEY');
    missingVars.push('VITE_SUPABASE_ANON_KEY');
  }
  
  return missingVars.length === 0;
};

// Fallback to hardcoded values if environment variables are not set
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://kysvcexqmywyrawakwfs.supabase.co";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt5c3ZjZXhxbXl3eXJhd2Frd2ZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYwOTEyNzYsImV4cCI6MjA2MTY2NzI3Nn0.koDEH1N85o1NdAyBAuuw3GUN4tFhIsmUVQ-QwEZs2Tw";

// Enhanced Supabase client configuration with CORS and better error handling
const supabaseOptions: any = {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storageKey: 'agile-warehouse-auth-token',
    flowType: 'pkce',
  },
  global: {
    headers: {
      'X-Client-Info': 'agile-warehouse-ui',
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
  },
  db: {
    schema: 'public' as const, // Use const assertion for type safety
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
};

// Custom fetch implementation with better error handling and fallback
const customFetch = async (url: RequestInfo, options?: RequestInit) => {
  // Check if we're in a restricted environment
  const isRestrictedEnvironment = window.self !== window.top || 
    /webcontainer|gpteng\.co/.test(navigator.userAgent);

  // Create fetch options with default headers
  const fetchOptions: RequestInit = {
    ...options,
    headers: {
      ...options?.headers,
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    mode: 'cors',
    credentials: 'include',
  };

  // In restricted environments, we need to be more permissive
  if (isRestrictedEnvironment) {
    console.log('Running in restricted environment, using permissive CORS settings');
    fetchOptions.mode = 'cors';
    fetchOptions.credentials = 'include';
    
    // Add additional headers for restricted environments
    fetchOptions.headers = {
      ...fetchOptions.headers,
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info',
    };
  }

  try {
    // Try the fetch with the configured options
    const response = await fetch(url.toString(), fetchOptions);
    
    // Handle 401 Unauthorized
    if (response.status === 401) {
      console.error('Unauthorized access - please log in again');
      // Clear any existing auth state
      localStorage.removeItem('agile-warehouse-auth-token');
      throw new Error('Unauthorized access - please log in again');
    }
    
    return response;
  } catch (error) {
    console.error('Network error in custom fetch:', error);
    
    // If we're in a restricted environment and the first attempt failed,
    // try with more permissive settings
    if (isRestrictedEnvironment) {
      console.log('First fetch attempt failed, trying with more permissive settings');
      
      try {
        const permissiveOptions = {
          ...fetchOptions,
          mode: 'cors' as const,
          credentials: 'include' as const,
          headers: {
            ...fetchOptions.headers,
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': '*',
          },
        };
        
        const response = await fetch(url.toString(), permissiveOptions);
        return response;
      } catch (fallbackError) {
        console.error('Fallback fetch also failed:', fallbackError);
        throw new Error(`Network error (fallback failed): ${fallbackError instanceof Error ? fallbackError.message : 'Unknown error'}`);
      }
    }
    
    throw new Error(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Create and export the Supabase client with custom fetch
const createSupabaseClient = () => {
  try {
    const options = {
      ...supabaseOptions,
      global: {
        ...supabaseOptions.global,
        fetch: customFetch,
      },
    };
    
    const client = createClient<Database>(
      SUPABASE_URL,
      SUPABASE_ANON_KEY,
      options
    );

    return client;
  } catch (error) {
    console.error('Failed to create Supabase client:', error);
    throw new Error('Failed to initialize Supabase client');
  }
};

export const supabase = createSupabaseClient();

// Log the Supabase configuration
console.group('🔐 Supabase Configuration');
console.log('Using Supabase URL:', SUPABASE_URL);
console.log('Using Supabase Anon Key:', 
  SUPABASE_ANON_KEY ? 
  `${SUPABASE_ANON_KEY.substring(0, 10)}...${SUPABASE_ANON_KEY.substring(SUPABASE_ANON_KEY.length - 4)}` : 
  'Not configured');
console.log('Environment variables check:', checkEnvVars() ? '✅ Passed' : '❌ Failed');
console.groupEnd();

// Test the connection with retry logic and better error reporting
const testConnection = async () => {
  const maxRetries = 2;
  let retryCount = 0;
  let lastError: any = null;
  
  const attemptConnection = async (): Promise<boolean> => {
    try {
      console.log(`🔌 Testing Supabase connection (attempt ${retryCount + 1}/${maxRetries})...`);
      
      // First, test a simple endpoint to check connectivity
      const healthCheck = await fetch(`${SUPABASE_URL}/rest/v1/`, {
        method: 'GET',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
      });
      
      if (!healthCheck.ok) {
        throw new Error(`Health check failed with status ${healthCheck.status}`);
      }
      
      // If health check passes, try a simple query
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);
      
      if (error) throw error;
      
      console.log('✅ Supabase connection successful!');
      return true;
    } catch (error) {
      lastError = error;
      retryCount++;
      
      if (retryCount < maxRetries) {
        const delayMs = 1000 * retryCount;
        console.warn(`⚠️ Connection attempt ${retryCount} failed, retrying in ${delayMs}ms...`, error);
        await new Promise(resolve => setTimeout(resolve, delayMs));
        return attemptConnection();
      }
      
      // Log detailed error information
      const errorInfo = {
        message: error instanceof Error ? error.message : 'Unknown error',
        name: error instanceof Error ? error.name : 'UnknownError',
        stack: error instanceof Error ? error.stack : undefined,
        url: SUPABASE_URL,
        timestamp: new Date().toISOString(),
      };
      
      console.error(`❌ Supabase connection failed after ${maxRetries} attempts:`, errorInfo);
      return false;
    }
  };
  
  const result = await attemptConnection();
  
  if (!result && lastError) {
    console.error('Final connection error details:', {
      name: lastError?.name,
      message: lastError?.message,
      code: lastError?.code,
      status: lastError?.status,
      statusText: lastError?.statusText,
    });
  }
  
  return result;
};

testConnection();