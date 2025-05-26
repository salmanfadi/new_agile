-- Create sales inquiry status enum
CREATE TYPE inquiry_status AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');

-- Create sales inquiries table
CREATE TABLE IF NOT EXISTS sales_inquiries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES auth.users(id),
    product_id UUID REFERENCES products(id),
    quantity INTEGER NOT NULL,
    status inquiry_status DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create sales inquiry responses table
CREATE TABLE IF NOT EXISTS sales_inquiry_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inquiry_id UUID REFERENCES sales_inquiries(id),
    responder_id UUID REFERENCES auth.users(id),
    response_text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create RLS policies for sales inquiries
ALTER TABLE sales_inquiries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers can view their own inquiries"
ON sales_inquiries FOR SELECT
TO authenticated
USING (auth.uid() = customer_id);

CREATE POLICY "Customers can create inquiries"
ON sales_inquiries FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Sales operators can view all inquiries"
ON sales_inquiries FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND (role = 'sales_operator' OR role = 'admin')
    )
);

CREATE POLICY "Sales operators can update inquiries"
ON sales_inquiries FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND (role = 'sales_operator' OR role = 'admin')
    )
);

-- Create RLS policies for inquiry responses
ALTER TABLE sales_inquiry_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers can view responses to their inquiries"
ON sales_inquiry_responses FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM sales_inquiries
        WHERE sales_inquiries.id = inquiry_id
        AND sales_inquiries.customer_id = auth.uid()
    )
);

CREATE POLICY "Sales operators can manage responses"
ON sales_inquiry_responses FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND (role = 'sales_operator' OR role = 'admin')
    )
);

-- Create function to update sales inquiry timestamps
CREATE OR REPLACE FUNCTION update_sales_inquiry_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating sales inquiry timestamps
CREATE TRIGGER update_sales_inquiry_timestamp
    BEFORE UPDATE ON sales_inquiries
    FOR EACH ROW
    EXECUTE FUNCTION update_sales_inquiry_timestamp(); 