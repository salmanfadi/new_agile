
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') as string
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Fetch all active products
    const { data: products, error: productError } = await supabase
      .from('products')
      .select('id, name, sku, description, image_url, specifications')
      .eq('is_active', true)

    if (productError) {
      console.error('Product retrieval error:', productError)
      return new Response(
        JSON.stringify({ status: 'error', error: 'Failed to fetch products' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    // Calculate stock quantities for each product
    const productStock = await Promise.all(products.map(async (product) => {
      const { data: boxes, error: boxError } = await supabase
        .from('inventory')
        .select('quantity')
        .eq('product_id', product.id)
        .in('status', ['available', 'reserved'])

      if (boxError) {
        console.error('Box retrieval error:', boxError)
        return { ...product, in_stock_quantity: 0, is_out_of_stock: true }
      }

      const inStockQuantity = boxes ? boxes.reduce((sum, box) => sum + box.quantity, 0) : 0
      return {
        ...product,
        in_stock_quantity: inStockQuantity,
        is_out_of_stock: inStockQuantity === 0
      }
    }))

    return new Response(
      JSON.stringify(productStock),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    console.error('Request error:', error.message)
    return new Response(
      JSON.stringify({ status: 'error', error: 'Server error processing request' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
