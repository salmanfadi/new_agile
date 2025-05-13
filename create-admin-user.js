import { createClient } from '@supabase/supabase-js';

// Configuration
const supabaseUrl = 'https://kysvcexqmywyrawakwfs.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt5c3ZjZXhxbXl3eXJhd2Frd2ZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYwOTEyNzYsImV4cCI6MjA2MTY2NzI3Nn0.koDEH1N85o1NdAyBAuuw3GUN4tFhIsmUVQ-QwEZs2Tw';

// Get email and password from command line arguments
const [email, password] = process.argv.slice(2);

if (!email || !password) {
  console.error('❌ Error: Please provide email and password');
  console.log('Usage: node create-admin-user.js <email> <password>');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

async function createAdminUser() {
  try {
    console.log('🚀 Creating admin user...');
    
    // 1. Sign up the user
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: 'Admin User',
          role: 'admin'
        },
        emailRedirectTo: `${supabaseUrl}/auth/callback`
      }
    });

    if (signUpError) {
      if (signUpError.message.includes('already registered')) {
        console.log('ℹ️ User already exists. Updating role to admin...');
        
        // If user exists, update their profile
        const { data: profileData, error: updateError } = await supabase
          .from('profiles')
          .update({ 
            role: 'admin',
            is_active: true 
          })
          .eq('email', email)
          .select()
          .single();
          
        if (updateError) throw updateError;
        
        console.log('✅ Successfully updated user to admin');
        console.log('\n🔑 Admin user credentials:');
        console.log(`   Email: ${email}`);
        console.log(`   Password: [the one you provided]`);
        return;
      }
      throw signUpError;
    }
    
    console.log('✅ Successfully created admin user');
    console.log('\n🔑 Admin user credentials:');
    console.log(`   Email: ${email}`);
    console.log(`   Password: [the one you provided]`);
    console.log('\n📧 Please check your email to verify your account');
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    process.exit(1);
  }
}

createAdminUser();
