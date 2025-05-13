-- Enable Row Level Security
ALTER TABLE public.barcode_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for barcode_logs
CREATE POLICY select_own_logs ON public.barcode_logs
FOR SELECT
USING (created_by = auth.uid());

CREATE POLICY insert_logs ON public.barcode_logs
FOR INSERT
WITH CHECK (created_by = auth.uid());

CREATE POLICY update_own_logs ON public.barcode_logs
FOR UPDATE
USING (created_by = auth.uid());

CREATE POLICY delete_own_logs ON public.barcode_logs
FOR DELETE
USING (created_by = auth.uid());

-- Add comment to explain the policies
COMMENT ON TABLE public.barcode_logs IS 'Table for tracking barcode operations with RLS policies ensuring users can only access their own logs'; 