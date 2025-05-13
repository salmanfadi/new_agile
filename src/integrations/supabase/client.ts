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

// Custom fetch implementation with better error handling
const customFetch = async (url: RequestInfo, options?: RequestInit) => {
  try {
    // Add CORS credentials if needed
    const fetchOptions: RequestInit = {
      ...options,
      credentials: 'include',
      mode: 'cors',
      headers: {
        ...options?.headers,
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
      },
    };

    const response = await fetch(url, fetchOptions);
    
    // Handle 401 Unauthorized
    if (response.status === 401) {
      console.error('Unauthorized access - please log in again');
      // You might want to trigger a logout or token refresh here
    }
    
    return response;
  } catch (error) {
    console.error('Network error in custom fetch:', error);
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

// Test the connection with retry logic
const testConnection = async () => {
  const maxRetries = 3;
  let retryCount = 0;
  
  const attemptConnection = async (): Promise<boolean> => {
    try {
      console.log(`🔌 Testing Supabase connection (attempt ${retryCount + 1}/${maxRetries})...`);
      
      // Test both REST and Realtime APIs
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .limit(1);
      
      if (error) throw error;
      
      console.log('✅ Supabase connection successful!');
      return true;
    } catch (error) {
      retryCount++;
      
      if (retryCount < maxRetries) {
        console.warn(`⚠️ Connection attempt ${retryCount} failed, retrying...`, error);
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
        return attemptConnection();
      }
      
      console.error(`❌ Supabase connection failed after ${maxRetries} attempts:`, error);
      return false;
    }
  };
  
  return attemptConnection();
};

testConnection();