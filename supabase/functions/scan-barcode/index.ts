
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Mock data for testing
const mockInventory = {
  'BC123456789': {
    id: 'box-001',
    product: {
      id: 'prod-001',
      name: 'Test Product',
      sku: 'TEST-001',
      description: 'A test product description',
    },
    quantity: 25,
    total_quantity: 150,
    location: {
      warehouse: 'Main Warehouse',
      zone: 'Zone A',
      position: 'Shelf 3'
    },
    status: 'available',
    attributes: {
      color: 'Blue',
      size: 'Medium'
    },
    history: [
      { action: 'Stock In', timestamp: '2025-04-30T10:30:00Z', user: 'John Doe' },
      { action: 'Inventory Check', timestamp: '2025-05-05T14:15:00Z', user: 'Jane Smith' }
    ]
  },
  'BC987654321': {
    id: 'box-002',
    product: {
      id: 'prod-002',
      name: 'Another Product',
      sku: 'TEST-002',
      description: 'Another test product',
    },
    quantity: 10,
    total_quantity: 50,
    location: {
      warehouse: 'Main Warehouse',
      zone: 'Zone B',
      position: 'Shelf 1'
    },
    status: 'reserved',
    attributes: {
      color: 'Red',
      size: 'Large'
    },
    history: [
      { action: 'Stock In', timestamp: '2025-05-01T09:45:00Z', user: 'John Doe' },
      { action: 'Reserved', timestamp: '2025-05-07T11:30:00Z', user: 'Mike Johnson' }
    ]
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 204 })
  }

  try {
    const { barcode, user_id, role } = await req.json()
    
    // Validate request
    if (!barcode) {
      return new Response(
        JSON.stringify({ 
          status: 'error', 
          error: 'Barcode is required' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    if (!user_id) {
      return new Response(
        JSON.stringify({ 
          status: 'error', 
          error: 'User ID is required' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }
    
    // Get data from mock inventory
    const boxData = mockInventory[barcode]
    
    if (!boxData) {
      return new Response(
        JSON.stringify({ 
          status: 'error', 
          error: 'Barcode not found in system' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      )
    }
    
    // Prepare the response based on user role
    let responseData = {
      box_id: boxData.id,
      product: boxData.product,
      box_quantity: boxData.quantity,
      status: boxData.status,
      attributes: boxData.attributes,
      location: boxData.location
    }
    
    // Add role-specific data
    if (role === 'admin' || role === 'warehouse_manager') {
      responseData['total_product_quantity'] = boxData.total_quantity
      responseData['history'] = boxData.history
    }
    
    // Return successful response
    return new Response(
      JSON.stringify({ 
        status: 'success', 
        data: responseData 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
    
  } catch (error) {
    console.error('Request error:', error.message)
    return new Response(
      JSON.stringify({ 
        status: 'error', 
        error: 'Server error processing barcode scan' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
