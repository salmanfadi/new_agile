import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kysvcexqmywyrawakwfs.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt5c3ZjZXhxbXl3eXJhd2Frd2ZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYwOTEyNzYsImV4cCI6MjA2MTY2NzI3Nn0.koDEH1N85o1NdAyBAuuw3GUN4tFhIsmUVQ-QwEZs2Tw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestUser() {
  try {
    // Sign up a new user
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: 'test.manager@example.com',
      password: 'Test@1234',
      options: {
        data: {
          name: 'Test Manager',
          role: 'warehouse_manager'
        }
      }
    });

    if (signUpError) {
      console.error('Error creating user:', signUpError);
      return;
    }

    console.log('User created successfully:', authData);
    
    // Sign in to verify
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'test.manager@example.com',
      password: 'Test@1234'
    });

    if (signInError) {
      console.error('Error signing in:', signInError);
      return;
    }

    console.log('Successfully signed in:', signInData);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

createTestUser();
