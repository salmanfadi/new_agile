// This file is now a re-export of the main supabase client
// to maintain backward compatibility with existing imports
import { supabase } from '@/lib/supabase';
import type { Database } from './types';

export { supabase };