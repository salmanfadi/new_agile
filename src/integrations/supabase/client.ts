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

// Enhanced Supabase client configuration
const supabaseOptions = {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
  global: {
    headers: {
      'X-Client-Info': 'agile-warehouse-ui',
    },
  },
};

// Create and export the Supabase client
export const supabase = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  supabaseOptions
);

// Log the Supabase configuration
console.group('🔐 Supabase Configuration');
console.log('Using Supabase URL:', SUPABASE_URL);
console.log('Using Supabase Anon Key:', 
  SUPABASE_ANON_KEY ? 
  `${SUPABASE_ANON_KEY.substring(0, 10)}...${SUPABASE_ANON_KEY.substring(SUPABASE_ANON_KEY.length - 4)}` : 
  'Not configured');
console.log('Environment variables check:', checkEnvVars() ? '✅ Passed' : '❌ Failed');
console.groupEnd();

// Test the connection
const testConnection = async () => {
  try {
    const { data, error } = await supabase.from('profiles').select('*').limit(1);
    if (error) throw error;
    console.log('✅ Supabase connection successful');
  } catch (error) {
    console.error('❌ Supabase connection failed:', error);
  }
};

testConnection();