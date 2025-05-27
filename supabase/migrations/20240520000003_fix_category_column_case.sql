-- Fix the category column case in products table
ALTER TABLE products 
RENAME COLUMN "Category" TO category;

-- Add comment to explain the change
COMMENT ON COLUMN products.category IS 'Product category - normalized to lowercase for consistency'; 