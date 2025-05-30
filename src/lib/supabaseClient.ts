import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';

// Use Vite's import.meta.env for environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Verify environment variables are loaded
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Please check your .env file.');
}

// Create a single supabase client for the entire app
declare global {
  interface Window {
    __SUPABASE_CLIENT__?: ReturnType<typeof createClient<Database>>;
  }
}

// Use existing instance if it exists, otherwise create a new one
if (!window.__SUPABASE_CLIENT__) {
  window.__SUPABASE_CLIENT__ = createClient<Database>(supabaseUrl, supabaseAnonKey);
}

export const supabase = window.__SUPABASE_CLIENT__;