
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  try {
    const { barcode, user_id, role } = await req.json();
    
    // Validate request
    if (!barcode) {
      return new Response(
        JSON.stringify({ 
          status: 'error', 
          error: 'Barcode is required' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    if (!user_id) {
      return new Response(
        JSON.stringify({ 
          status: 'error', 
          error: 'User ID is required' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Since we don't have a proper box table yet,
    // let's mock the response based on barcode
    // In a real implementation, this would query the inventory table
    
    // Mock data for development purposes
    const mockBoxData = {
      id: 'box-' + barcode.substring(0, 8),
      product: {
        id: 'prod-' + Math.floor(Math.random() * 1000),
        name: `Product ${barcode.substring(0, 4).toUpperCase()}`,
        sku: `SKU-${barcode.substring(0, 6)}`,
        description: 'This is a sample product description',
      },
      box_quantity: Math.floor(Math.random() * 50) + 1,
      total_product_quantity: Math.floor(Math.random() * 200) + 50,
      status: ['available', 'reserved', 'in-transit'][Math.floor(Math.random() * 3)] as 'available' | 'reserved' | 'in-transit',
      attributes: {
        color: ['Red', 'Blue', 'Green', 'Black'][Math.floor(Math.random() * 4)],
        size: ['Small', 'Medium', 'Large', 'XL'][Math.floor(Math.random() * 4)],
      },
      location: {
        warehouse: `Warehouse ${Math.floor(Math.random() * 3) + 1}`,
        zone: `Zone ${String.fromCharCode(65 + Math.floor(Math.random() * 6))}`,
        position: `Floor ${Math.floor(Math.random() * 3) + 1}`,
      },
      history: [
        {
          action: 'Stock In',
          timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          user: 'John Doe',
        },
        {
          action: 'Location Change',
          timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          user: 'Jane Smith',
        },
        {
          action: 'Inventory Count',
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          user: 'Admin User',
        },
      ],
    };
    
    // Prepare response based on user role
    const responseData = { ...mockBoxData };
    
    // Field operators don't get to see total quantity or full history
    if (role === 'field_operator') {
      delete responseData.total_product_quantity;
      responseData.history = responseData.history.slice(0, 1);
    }
    
    // Return successful response
    return new Response(
      JSON.stringify({ 
        status: 'success', 
        data: responseData 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
    
  } catch (error) {
    console.error('Request error:', error.message);
    return new Response(
      JSON.stringify({ 
        status: 'error', 
        error: 'Server error processing barcode scan' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
