-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE public.user_role AS ENUM (
            'admin',
            'warehouse_manager',
            'field_operator',
            'sales_operator',
            'customer'
        );
    END IF;
END $$;

-- Create or replace the profiles table with proper constraints
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    role user_role NOT NULL DEFAULT 'customer'::user_role,
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT username_length CHECK (char_length(username) >= 3 AND char_length(username) <= 50),
    CONSTRAINT username_format CHECK (username ~ '^[a-zA-Z0-9_]+$')
);

-- Add comments for documentation
COMMENT ON TABLE public.profiles IS 'User profile information';
COMMENT ON COLUMN public.profiles.id IS 'References the auth.users table';
COMMENT ON COLUMN public.profiles.username IS 'Unique username (3-50 chars, alphanumeric + _)';
COMMENT ON COLUMN public.profiles.role IS 'User role with specific permissions';
COMMENT ON COLUMN public.profiles.is_active IS 'Soft delete flag';

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS profiles_username_idx ON public.profiles (username);
CREATE INDEX IF NOT EXISTS profiles_role_idx ON public.profiles (role);
CREATE INDEX IF NOT EXISTS profiles_is_active_idx ON public.profiles (is_active);

-- Create a function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    username_base TEXT;
    username_suffix INT := 0;
    new_username TEXT;
    username_exists BOOLEAN;
BEGIN
    -- Generate a base username from email (before @)
    username_base := LOWER(SPLIT_PART(NEW.email, '@', 1));
    
    -- Clean up the username (only allow alphanumeric and underscores)
    username_base := REGEXP_REPLACE(username_base, '[^a-z0-9_]', '_', 'g');
    
    -- Ensure username is not empty
    IF username_base = '' THEN
        username_base := 'user';
    END IF;
    
    -- Check if username already exists
    new_username := username_base;
    LOOP
        SELECT EXISTS(SELECT 1 FROM public.profiles WHERE username = new_username) INTO username_exists;
        EXIT WHEN NOT username_exists;
        
        -- If username exists, append a number and try again
        username_suffix := username_suffix + 1;
        new_username := username_base || username_suffix::TEXT;
    END LOOP;
    
    -- Insert the new profile
    INSERT INTO public.profiles (id, username, full_name, role, is_active)
    VALUES (
        NEW.id,
        new_username,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', SPLIT_PART(NEW.email, '@', 1)),
        COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'customer'::user_role),
        true
    )
    ON CONFLICT (id) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Create a function to update the updated_at column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create update trigger for profiles table
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Set up Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for RLS
CREATE POLICY "Users can view their own profile"
    ON public.profiles
    FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON public.profiles
    FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Admins can manage all profiles"
    ON public.profiles
    FOR ALL
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'::user_role
    ));

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE profiles_id_seq TO authenticated;

-- Create a function to get the current user's profile
CREATE OR REPLACE FUNCTION public.get_user_profile()
RETURNS JSON
LANGUAGE SQL
SECURITY DEFINER
AS $$
    SELECT json_build_object(
        'id', p.id,
        'email', u.email,
        'username', p.username,
        'full_name', p.full_name,
        'avatar_url', p.avatar_url,
        'role', p.role,
        'is_active', p.is_active,
        'last_login', p.last_login_at,
        'created_at', p.created_at,
        'updated_at', p.updated_at,
        'email_confirmed', u.email_confirmed_at IS NOT NULL
    )
    FROM public.profiles p
    JOIN auth.users u ON p.id = u.id
    WHERE p.id = auth.uid();
$$;
