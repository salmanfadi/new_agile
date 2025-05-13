-- 1. First, let's check if the profiles table exists and its structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles';

-- 2. Create or replace the function that will handle new user signups
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, name, role, active, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'username' OR split_part(NEW.email, '@', 1),
    NEW.raw_user_meta_data->>'name' OR split_part(NEW.email, '@', 1),
    COALESCE(NEW.raw_user_meta_data->>'role', 'user')::text,
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

-- 3. Create the trigger that calls our function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 4. Grant necessary permissions
GRANTANT ALL PRIVILEGES ON FUNCTION public.handle_new_user() TO authenticated, anon, service_role;
