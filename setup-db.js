import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

// Configuration
const supabaseUrl = 'https://kysvcexqmywyrawakwfs.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt5c3ZjZXhxbXl3eXJhd2Frd2ZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYwOTEyNzYsImV4cCI6MjA2MTY2NzI3Nn0.koDEH1N85o1NdAyBAuuw3GUN4tFhIsmUVQ-QwEZs2Tw';

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function runMigration() {
  try {
    console.log('🚀 Starting database setup...');
    
    // Read the SQL migration file
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const migrationPath = path.join(__dirname, 'supabase', 'migrations', '20250514000000_setup_user_profiles.sql');
    const sql = readFileSync(migrationPath, 'utf8');
    
    console.log('🔄 Running database migration...');
    
    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { query: sql });
    
    if (error) {
      console.error('❌ Error running migration:', error);
      return;
    }
    
    console.log('✅ Database setup completed successfully!');
    
    // Instructions for creating the first admin user
    console.log('\n👤 To create your first admin user, run:');
    console.log('   node create-admin-user.js \'your-email@example.com\' \'your-password\'');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

runMigration();
