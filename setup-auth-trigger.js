import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kysvcexqmywyrawakwfs.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt5c3ZjZXhxbXl3eXJhd2Frd2ZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYwOTEyNzYsImV4cCI6MjA2MTY2NzI3Nn0.koDEH1N85o1NdAyBAuuw3GUN4tFhIsmUVQ-QwEZs2Tw';

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

async function setupAuthTrigger() {
  try {
    // First, sign in with service role key (you'll need to replace this with a service role key)
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'your-admin-email@example.com',
      password: 'your-admin-password'
    });

    if (signInError) {
      console.error('Error signing in:', signInError);
      return;
    }

    console.log('Successfully signed in');

    // Now execute the SQL to create the trigger
    const { data, error } = await supabase.rpc('exec_sql', {
      query: `
        -- Create or replace the function that will handle new user signups
        CREATE OR REPLACE FUNCTION public.handle_new_user() 
        RETURNS TRIGGER AS $$
        BEGIN
          INSERT INTO public.profiles (id, username, name, role, active, created_at, updated_at)
          VALUES (
            NEW.id,
            COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
            COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
            COALESCE((NEW.raw_user_meta_data->>'role')::text, 'user'),
            true,
            NOW(),
            NOW()
          )
          ON CONFLICT (id) DO UPDATE SET
            username = EXCLUDED.username,
            name = EXCLUDED.name,
            updated_at = NOW();
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;

        -- Create the trigger that calls our function
        DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
        CREATE TRIGGER on_auth_user_created
          AFTER INSERT OR UPDATE ON auth.users
          FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
      `
    });

    if (error) {
      console.error('Error setting up auth trigger:', error);
      return;
    }

    console.log('Auth trigger setup successfully!');

  } catch (error) {
    console.error('Error:', error);
  }
}

setupAuthTrigger();
