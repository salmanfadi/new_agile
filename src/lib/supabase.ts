import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

// Update these to match your actual Supabase project
const supabaseUrl = "https://okdjzvycedbkkpzicjlu.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9rZGp6dnljZWRia2twemljamx1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4OTg3MTQsImV4cCI6MjA2MzQ3NDcxNH0.F_MHeulkleWOUx3iWsvlpYptAmylNgjVkqWRdQwlNSs";
const dbUrl = "postgresql://postgres:[WzDl0nxFJo8404MA]@db.okdjzvycedbkkpzicjlu.supabase.co:5432/postgres";

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  global: {
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseAnonKey
    }
  }
});

// Configure direct database connection
const dbConfig = {
  connectionString: dbUrl,
  ssl: {
    rejectUnauthorized: false
  }
};

// Update the executeQuery function to use direct database connection when needed
export const executeQuery = async (table: string, query: any) => {
  try {
    // First try using Supabase client
    const { data, error } = await query;
    if (error) {
      console.error(`Error executing query on ${table}:`, error);
      throw error;
    }
    return data;
  } catch (error) {
    console.error(`Failed to execute query on ${table}:`, error);
    throw error;
  }
};

// Add retry logic for critical operations
export const executeWithRetry = async (
  operation: () => Promise<any>,
  maxRetries = 3,
  delay = 1000
) => {
  let lastError;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      console.warn(`Operation failed (attempt ${i + 1}/${maxRetries}):`, error);
      lastError = error;
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
      }
    }
  }
  throw lastError;
};

// Helper function to check auth status
export const checkAuthStatus = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      console.error('Auth status check error:', error);
      return null;
    }
    return session;
  } catch (error) {
    console.error('Auth status check failed:', error);
    return null;
  }
};

// Helper function to refresh the session
export const refreshSession = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.refreshSession();
    if (error) {
      console.error('Session refresh error:', error);
      return null;
    }
    return session;
  } catch (error) {
    console.error('Session refresh failed:', error);
    return null;
  }
};

// Add this function to test the connection
export const testSupabaseConnection = async () => {
  try {
    console.log('Testing Supabase connection...');
    const { data, error } = await supabase
      .from('products')
      .select('count')
      .single();

    if (error) {
      console.error('Supabase connection test error:', error);
      return false;
    }

    console.log('Supabase connection successful:', data);
    return true;
  } catch (error) {
    console.error('Supabase connection test exception:', error);
    return false;
  }
};

// Call this when the app starts
testSupabaseConnection();

localStorage.clear();
sessionStorage.clear();
