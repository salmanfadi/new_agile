import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

// Configuration
const supabaseUrl = 'https://kysvcexqmywyrawakwfs.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt5c3ZjZXhxbXl3eXJhd2Frd2ZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYwOTEyNzYsImV4cCI6MjA2MTY2NzI3Nn0.koDEH1N85o1NdAyBAuuw3GUN4tFhIsmUVQ-QwEZs2Tw';

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: false
  }
});

// Test user credentials
const testEmail = `testuser.${uuidv4()}@example.com`;
const testPassword = 'Test@1234';
const testUsername = `testuser_${Date.now()}`;
const testName = 'Test User';

async function testAuthFlow() {
  console.log('🚀 Starting authentication flow test...');
  
  try {
    // 1. Test Sign Up
    console.log('\n1. Testing user sign up...');
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          username: testUsername,
          full_name: testName,
          role: 'customer'
        }
      }
    });

    if (signUpError) throw signUpError;
    
    const userId = signUpData.user?.id;
    if (!userId) throw new Error('No user ID returned from sign up');
    
    console.log('✅ User signed up successfully');
    console.log(`   User ID: ${userId}`);
    console.log(`   Email: ${testEmail}`);
    
    // 2. Test Profile Creation
    console.log('\n2. Verifying profile creation...');
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for trigger
    
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
      
    if (profileError) throw profileError;
    
    console.log('✅ Profile created successfully');
    console.log('   Profile data:', {
      username: profileData.username,
      full_name: profileData.full_name,
      role: profileData.role,
      is_active: profileData.is_active
    });
    
    // 3. Test Login
    console.log('\n3. Testing user login...');
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });
    
    if (loginError) throw loginError;
    
    console.log('✅ User logged in successfully');
    console.log('   Session expires at:', loginData.session?.expires_at);
    
    // 4. Test Profile Retrieval
    console.log('\n4. Testing profile retrieval...');
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError) throw userError;
    
    console.log('✅ User data retrieved successfully');
    console.log('   User email:', userData.user.email);
    console.log('   Last sign in:', userData.user.last_sign_in_at);
    
    // 5. Test Logout
    console.log('\n5. Testing user logout...');
    const { error: logoutError } = await supabase.auth.signOut();
    
    if (logoutError) throw logoutError;
    
    console.log('✅ User logged out successfully');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
testAuthFlow()
  .then(() => console.log('\n🎉 All tests completed successfully!'))
  .catch(error => console.error('Test failed:', error));
