import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';

export type TypedSupabaseClient = SupabaseClient<Database>;

// Check if we're in a restricted environment (like an iframe or web container)
const isRestrictedEnvironment = typeof window !== 'undefined' && 
  (window.self !== window.top || /webcontainer|gpteng\.co/.test(navigator.userAgent));

// Mock response for restricted environments
const createMockResponse = () => {
  return new Response(JSON.stringify({ data: null, error: null }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

// Helper function to determine if we should use mock data
const shouldUseMock = (): boolean => {
  return isRestrictedEnvironment || !checkEnvVars();
};

// Extend the Window interface to include ENV variables
declare global {
  interface Window {
    ENV: {
      SUPABASE_URL?: string;
      SUPABASE_ANON_KEY?: string;
    };
  }
}

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
const MOCK_SUPABASE_URL = "https://mock-supabase-url.supabase.co";
const MOCK_SUPABASE_KEY = "mock-supabase-key";

// Use environment variables or fallback to mock values in restricted environment
const SUPABASE_URL = isRestrictedEnvironment 
  ? MOCK_SUPABASE_URL 
  : import.meta.env.VITE_SUPABASE_URL || "https://kysvcexqmywyrawakwfs.supabase.co";

const SUPABASE_ANON_KEY = isRestrictedEnvironment 
  ? MOCK_SUPABASE_KEY 
  : import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt5c3ZjZXhxbXl3eXJhd2Frd2ZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYwOTEyNzYsImV4cCI6MjA2MTY2NzI3Nn0.koDEH1N85o1NdAyBAuuw3GUN4tFhIsmUVQ-QwEZs2Tw";

// Custom fetch implementation with better error handling and fallback
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
    },
  },
  db: {
    schema: 'public' as const,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
};

// Exponential backoff with jitter for retries
const getBackoffDelay = (retryCount: number, baseDelay = 1000) => {
  const maxDelay = 10000;
  const exponential = Math.min(maxDelay, baseDelay * Math.pow(2, retryCount));
  const jitter = exponential * 0.2 * Math.random();
  return Math.floor(exponential + jitter);
};

// Improved custom fetch with better error handling and retry logic
const customFetch = async (url: RequestInfo, options?: RequestInit): Promise<Response> => {
  const maxRetries = 3;
  let retryCount = 0;

  // Check if we're making a localhost request
  const isLocalhost = url.toString().includes('localhost') || url.toString().includes('127.0.0.1');

  // Base headers that should be included in all requests
  const baseHeaders = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    ...options?.headers,
  };

  // Add CORS headers for non-localhost requests
  const corsHeaders = !isLocalhost ? {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, apikey, Prefer',
  } : {};

  const fetchWithRetry = async (attempt: number): Promise<Response> => {
    const fetchOptions: RequestInit = {
      ...options,
      headers: {
        ...baseHeaders,
        ...corsHeaders,
      },
      mode: !isLocalhost ? 'cors' : 'same-origin',
      credentials: 'same-origin',
    };

    try {
      console.log(`📡 Attempt ${attempt + 1}/${maxRetries} to fetch ${url.toString()}`);
      const response = await fetch(url.toString(), fetchOptions);

      // Handle specific HTTP status codes
      if (response.status === 401) {
        console.error('🔒 Unauthorized access - clearing auth state');
        localStorage.removeItem('agile-warehouse-auth-token');
        throw new Error('Unauthorized access - please log in again');
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return response;
    } catch (error) {
      console.warn(`⚠️ Fetch attempt ${attempt + 1} failed:`, error);

      // If we have retries left, wait and try again
      if (attempt < maxRetries - 1) {
        const delay = getBackoffDelay(attempt);
        console.log(`⏳ Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return fetchWithRetry(attempt + 1);
      }

      // If all retries are exhausted, throw the error
      throw new Error(`Network error after ${maxRetries} attempts: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return fetchWithRetry(0);
};

// Create a mock Supabase client for restricted environments
const createMockSupabaseClient = () => {
  console.warn('Creating mock Supabase client for restricted environment');
  
  const mockClient = {
    auth: {
      signInWithPassword: async () => ({
        data: { user: null, session: null },
        error: new Error('Mock auth: signInWithPassword not available in restricted environment')
      }),
      signUp: async () => ({
        data: { user: null, session: null },
        error: new Error('Mock auth: signUp not available in restricted environment')
      }),
      signOut: async () => ({
        error: null
      }),
      onAuthStateChange: (callback: any) => ({
        data: { subscription: { unsubscribe: () => {} } }
      }),
      getSession: async () => ({
        data: { session: null },
        error: null
      })
    },
    from: (table: string) => ({
      select: (columns = '*') => ({
        eq: (column: string, value: any) => ({
          single: async () => ({ data: null, error: null })
        }),
        in_: (column: string, values: any[]) => ({
          select: (cols: string) => ({ data: [], error: null })
        }),
        order: (column: string, options: { ascending?: boolean }) => ({
          data: [],
          error: null
        })
      }),
      insert: (data: any) => ({
        select: () => ({
          data: null,
          error: null
        })
      }),
      update: (data: any) => ({
        eq: (column: string, value: any) => ({
          data: null,
          error: null
        })
      }),
      delete: () => ({
        eq: () => ({
          data: null,
          error: null
        })
      })
    }),
    channel: (name: string) => ({
      on: (event: string, callback: Function) => ({
        subscribe: () => ({
          unsubscribe: () => {}
        })
      })
    }),
    removeChannel: () => {},
    rpc: (fn: string, params?: any) => ({
      data: null,
      error: new Error('RPC not available in mock client')
    })
  };

  return mockClient as unknown as TypedSupabaseClient;
};

// Create and export the Supabase client with custom fetch
export const createSupabaseClient = (): TypedSupabaseClient => {
  // Use mock client in restricted environments or when env vars are missing
  if (shouldUseMock()) {
    console.log('Using mock Supabase client');
    return createMockSupabaseClient() as unknown as TypedSupabaseClient;
  }

  try {
    // Create a real client with custom fetch
    const options = {
      ...supabaseOptions,
      global: {
        ...supabaseOptions.global,
        fetch: customFetch,
      },
    };
    
    return createClient<Database>(
      SUPABASE_URL,
      SUPABASE_ANON_KEY,
      options
    ) as TypedSupabaseClient;
  } catch (error) {
    console.error('Failed to initialize Supabase client:', error);
    return createMockSupabaseClient() as unknown as TypedSupabaseClient;
  }
};

export const supabase: TypedSupabaseClient = createSupabaseClient();

// Log the Supabase configuration
console.group('🔐 Supabase Configuration');
console.log('Using Supabase URL:', SUPABASE_URL);
console.log('Using Supabase Anon Key:', 
  SUPABASE_ANON_KEY ? 
  `${SUPABASE_ANON_KEY.substring(0, 10)}...${SUPABASE_ANON_KEY.substring(SUPABASE_ANON_KEY.length - 4)}` : 
  'Not configured');
console.log('Environment variables check:', checkEnvVars() ? '✅ Passed' : '❌ Failed');
console.groupEnd();

// Test the connection with improved retry logic
const testConnection = async () => {
  try {
    console.log('🔌 Testing Supabase connection...');
    
    // Simple health check
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);
    
    if (error) throw error;
    
    console.log('✅ Supabase connection successful!');
    return true;
  } catch (error) {
    console.error('❌ Supabase connection test failed:', {
      name: error?.name,
      message: error?.message,
      code: error?.code,
      status: error?.status,
    });
    return false;
  }
};

testConnection();