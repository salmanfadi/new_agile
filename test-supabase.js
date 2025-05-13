import { createClient } from '@supabase/supabase-js';

// Load environment variables
const supabaseUrl = 'https://kysvcexqmywyrawakwfs.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt5c3ZjZXhxbXl3eXJhd2Frd2ZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYwOTEyNzYsImV4cCI6MjA2MTY2NzI3Nn0.koDEH1N85o1NdAyBAuuw3GUN4tFhIsmUVQ-QwEZs2Tw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    console.log('Testing Supabase connection...');
    
    // Test auth users table
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(5);
    
    if (usersError) {
      console.error('Error querying users:', usersError);
    } else {
      console.log('Users:', users);
    }
    
    // Test profiles table
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(5);
    
    if (profilesError) {
      console.error('Error querying profiles:', profilesError);
    } else {
      console.log('Profiles:', profiles);
    }
    
    // Try to sign in with test user
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'warehouse.manager@test.com',
      password: 'test123'
    });
    
    if (signInError) {
      console.error('Error signing in:', signInError);
    } else {
      console.log('Successfully signed in:', signInData);
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testConnection();
