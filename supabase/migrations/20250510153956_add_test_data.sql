-- First, ensure we have the correct stock_status type
DO $$ BEGIN
    CREATE TYPE public.stock_status AS ENUM ('pending', 'approved', 'rejected', 'completed', 'processing');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Insert test warehouse manager account
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_user_meta_data
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'warehouse.manager@test.com',
  crypt('test123', gen_salt('bf')),
  now(),
  '{"name": "Test Warehouse Manager", "username": "warehouse_manager"}'
);

INSERT INTO public.profiles (
  id,
  username,
  name,
  role,
  active
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'warehouse_manager',
  'Test Warehouse Manager',
  'warehouse_manager',
  true
);

-- Insert test warehouse
INSERT INTO public.warehouses (
  id,
  name,
  location,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000002',
  'Test Warehouse',
  'Test Location',
  now(),
  now()
);

-- Insert test warehouse location
INSERT INTO public.warehouse_locations (
  id,
  warehouse_id,
  floor,
  zone,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000002',
  1,
  'A1',
  now(),
  now()
);

-- Insert test product
INSERT INTO public.products (
  id,
  name,
  sku,
  specifications,
  category,
  created_by,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000004',
  'Test Product',
  'TEST-001',
  'Test Specifications',
  'Test Category',
  '00000000-0000-0000-0000-000000000001',
  now(),
  now()
); 