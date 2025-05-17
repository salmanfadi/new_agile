import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';
import { InventoryStatus } from '@/types/stockIn';
import { MovementStatus, MovementType } from '@/types/inventory';

// Type definitions for our test data
interface TestWarehouse {
  id: string;
  name: string;
  location: string;
}

interface TestLocation {
  id: string;
  warehouseId: string;
  floor: number;
  zone: string;
}

interface TestProduct {
  id: string;
  name: string;
  sku: string;
  description?: string;
  specifications?: string;
  category?: string;
}

interface TestStockIn {
  id: string;
  productId: string;
  submittedBy: string;
  boxes: number;
  source: string;
  notes?: string;
  status: 'pending' | 'approved' | 'processing' | 'completed' | 'rejected';
}

interface TestInventoryItem {
  id: string;
  productId: string;
  warehouseId: string;
  locationId: string;
  barcode: string;
  quantity: number;
  color?: string;
  size?: string;
  status: InventoryStatus;
  batchId?: string;
}

interface TestBatch {
  id: string;
  stockInId: string;
  productId: string;
  processedBy: string;
  totalQuantity: number;
  totalBoxes: number;
  source: string;
  notes?: string;
  status: 'completed' | 'processing' | 'failed';
  warehouseId?: string;
}

// Main function to generate all test data
export const generateTestData = async (userId: string) => {
  console.log('Starting test data generation...');
  
  try {
    // Step 1: Generate base data (warehouses, locations, products)
    const warehouses = await generateWarehouses();
    const locations = await generateLocations(warehouses);
    const products = await generateProducts();
    
    // Step 2: Create stock-in requests in various states
    const stockIns = await generateStockInRequests(products, userId);
    
    // Step 3: Process some stock-ins to generate inventory and batches
    const { inventoryItems, batches } = await processStockIns(stockIns, products, locations, userId);
    
    // Step 4: Create inventory transfers for some items
    await generateInventoryTransfers(inventoryItems, locations, userId);
    
    // Return all the generated data for reference
    return {
      warehouses,
      locations,
      products,
      stockIns,
      inventoryItems,
      batches
    };
  } catch (error) {
    console.error('Error generating test data:', error);
    throw error;
  }
};

// Generate warehouses
const generateWarehouses = async (): Promise<TestWarehouse[]> => {
  console.log('Generating warehouses...');
  
  const warehouses: TestWarehouse[] = [
    { id: uuidv4(), name: 'Main Warehouse', location: 'New York' },
    { id: uuidv4(), name: 'East Distribution Center', location: 'Boston' },
    { id: uuidv4(), name: 'West Coast Storage', location: 'Los Angeles' }
  ];
  
  // Insert warehouses into the database
  for (const warehouse of warehouses) {
    const { error } = await supabase.from('warehouses').insert(warehouse);
    if (error) throw new Error(`Failed to create warehouse: ${error.message}`);
  }
  
  return warehouses;
};

// Generate warehouse locations based on warehouses
const generateLocations = async (warehouses: TestWarehouse[]): Promise<TestLocation[]> => {
  console.log('Generating warehouse locations...');
  
  const locations: TestLocation[] = [];
  
  for (const warehouse of warehouses) {
    // Create multiple floors and zones for each warehouse
    for (let floor = 1; floor <= 3; floor++) {
      for (let zoneNum = 1; zoneNum <= 3; zoneNum++) {
        const zone = String.fromCharCode(64 + zoneNum); // A, B, C
        locations.push({
          id: uuidv4(),
          warehouseId: warehouse.id,
          floor,
          zone
        });
      }
    }
  }
  
  // Insert locations into the database
  for (const location of locations) {
    const { error } = await supabase.from('warehouse_locations').insert({
      id: location.id,
      warehouse_id: location.warehouseId,
      floor: location.floor,
      zone: location.zone
    });
    if (error) throw new Error(`Failed to create location: ${error.message}`);
  }
  
  return locations;
};

// Generate products
const generateProducts = async (): Promise<TestProduct[]> => {
  console.log('Generating products...');
  
  const products: TestProduct[] = [
    { 
      id: uuidv4(), 
      name: 'Premium Desk Chair', 
      sku: 'FRN-CHAIR-001', 
      description: 'Ergonomic office chair with adjustable height',
      category: 'Furniture'
    },
    { 
      id: uuidv4(), 
      name: 'Executive Desk', 
      sku: 'FRN-DESK-002', 
      description: 'Solid wood executive desk with drawers',
      category: 'Furniture'
    },
    { 
      id: uuidv4(), 
      name: 'Wireless Keyboard', 
      sku: 'ELEC-KBD-001', 
      description: 'Bluetooth wireless keyboard',
      category: 'Electronics'
    },
    { 
      id: uuidv4(), 
      name: 'LED Monitor 24"', 
      sku: 'ELEC-MON-002', 
      description: '24-inch LED monitor with HDMI',
      category: 'Electronics'
    },
    { 
      id: uuidv4(), 
      name: 'Filing Cabinet', 
      sku: 'FRN-CAB-003', 
      description: 'Metal filing cabinet with three drawers',
      category: 'Furniture'
    }
  ];
  
  // Insert products into the database
  for (const product of products) {
    const { error } = await supabase.from('products').insert(product);
    if (error) throw new Error(`Failed to create product: ${error.message}`);
  }
  
  return products;
};

// Generate stock-in requests
const generateStockInRequests = async (
  products: TestProduct[], 
  userId: string
): Promise<TestStockIn[]> => {
  console.log('Generating stock-in requests...');
  
  // Create a variety of stock-in requests with different statuses
  const stockInRequests: TestStockIn[] = [];
  
  // Create one stock-in request per product with different statuses
  const statuses = ['pending', 'approved', 'processing', 'completed', 'rejected'] as const;
  
  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    const status = statuses[i % statuses.length];
    
    stockInRequests.push({
      id: uuidv4(),
      productId: product.id,
      submittedBy: userId,
      boxes: Math.floor(Math.random() * 10) + 1, // 1-10 boxes
      source: ['Supplier A', 'Supplier B', 'Direct Import', 'Returns'][Math.floor(Math.random() * 4)],
      notes: `Test stock-in for ${product.name}`,
      status: status
    });
  }
  
  // Add a few more with pending status for processing later
  for (let i = 0; i < 3; i++) {
    const randomProduct = products[Math.floor(Math.random() * products.length)];
    
    stockInRequests.push({
      id: uuidv4(),
      productId: randomProduct.id,
      submittedBy: userId,
      boxes: Math.floor(Math.random() * 5) + 1, // 1-5 boxes
      source: 'Test Supplier',
      notes: `Additional test stock-in for ${randomProduct.name}`,
      status: 'pending'
    });
  }
  
  // Insert stock-in requests into the database
  for (const request of stockInRequests) {
    const { error } = await supabase.from('stock_in').insert({
      id: request.id,
      product_id: request.productId,
      submitted_by: request.submittedBy,
      boxes: request.boxes,
      source: request.source,
      notes: request.notes,
      status: request.status
    });
    if (error) throw new Error(`Failed to create stock-in request: ${error.message}`);
  }
  
  return stockInRequests;
};

// Process stock-ins to generate inventory and batches
const processStockIns = async (
  stockIns: TestStockIn[], 
  products: TestProduct[],
  locations: TestLocation[],
  userId: string
): Promise<{ inventoryItems: TestInventoryItem[], batches: TestBatch[] }> => {
  console.log('Processing stock-ins to generate inventory...');
  
  const inventoryItems: TestInventoryItem[] = [];
  const batches: TestBatch[] = [];
  
  // Process completed and processing stock-ins
  const toProcess = stockIns.filter(si => ['completed', 'processing'].includes(si.status));
  
  for (const stockIn of toProcess) {
    // Create a batch for this stock-in
    const batch: TestBatch = {
      id: uuidv4(),
      stockInId: stockIn.id,
      productId: stockIn.productId,
      processedBy: userId,
      totalQuantity: stockIn.boxes * 10, // Assume 10 items per box
      totalBoxes: stockIn.boxes,
      source: stockIn.source,
      notes: stockIn.notes,
      status: stockIn.status === 'completed' ? 'completed' : 'processing',
      warehouseId: locations[0].warehouseId // Use first warehouse for simplicity
    };
    
    batches.push(batch);
    
    // Create inventory items for this batch
    // Only create inventory items for completed batches
    if (batch.status === 'completed') {
      const batchLocations = locations.filter(l => l.warehouseId === batch.warehouseId);
      
      for (let i = 0; i < batch.totalBoxes; i++) {
        const randomLocation = batchLocations[Math.floor(Math.random() * batchLocations.length)];
        
        // Fix: Use proper InventoryStatus type values
        const inventoryStatuses: InventoryStatus[] = ['available', 'reserved', 'sold', 'damaged'];
        
        // Create inventory item
        const inventoryItem: TestInventoryItem = {
          id: uuidv4(),
          productId: stockIn.productId,
          warehouseId: randomLocation.warehouseId,
          locationId: randomLocation.id,
          barcode: `BARCODE-${Math.floor(Math.random() * 1000000)}`,
          quantity: Math.floor(Math.random() * 20) + 1, // 1-20 quantity
          color: ['Red', 'Blue', 'Green', 'Black', 'White'][Math.floor(Math.random() * 5)],
          size: ['Small', 'Medium', 'Large', null][Math.floor(Math.random() * 4)],
          status: inventoryStatuses[Math.floor(Math.random() * inventoryStatuses.length)],
          batchId: batch.id
        };
        
        inventoryItems.push(inventoryItem);
      }
    }
  }
  
  // Insert batches into the database
  for (const batch of batches) {
    const { error } = await supabase.from('processed_batches').insert({
      id: batch.id,
      stock_in_id: batch.stockInId,
      product_id: batch.productId,
      processed_by: batch.processedBy,
      total_quantity: batch.totalQuantity,
      total_boxes: batch.totalBoxes,
      warehouse_id: batch.warehouseId,
      source: batch.source,
      notes: batch.notes,
      status: batch.status
    });
    if (error) throw new Error(`Failed to create batch: ${error.message}`);
  }
  
  // Insert inventory items into the database
  for (const item of inventoryItems) {
    const { error } = await supabase.from('inventory').insert({
      id: item.id,
      product_id: item.productId,
      warehouse_id: item.warehouseId,
      location_id: item.locationId,
      barcode: item.barcode,
      quantity: item.quantity,
      color: item.color,
      size: item.size,
      status: item.status,
      batch_id: item.batchId
    });
    if (error) throw new Error(`Failed to create inventory item: ${error.message}`);
  }
  
  // Fix: Use correct MovementStatus types for inventory movements
  for (const item of inventoryItems) {
    const { error } = await supabase.from('inventory_movements').insert({
      product_id: item.productId,
      warehouse_id: item.warehouseId,
      location_id: item.locationId,
      movement_type: 'in' as MovementType,
      quantity: item.quantity,
      status: 'approved' as MovementStatus,
      performed_by: userId,
      details: {
        barcode: item.barcode,
        batch_id: item.batchId,
        source: 'Test Data Generator',
        color: item.color,
        size: item.size
      }
    });
    if (error) throw new Error(`Failed to create inventory movement: ${error.message}`);
  }
  
  return { inventoryItems, batches };
};

// Generate inventory transfers
const generateInventoryTransfers = async (
  inventoryItems: TestInventoryItem[],
  locations: TestLocation[],
  userId: string
): Promise<void> => {
  console.log('Generating inventory transfers...');
  
  // Only transfer a few items (about 20%)
  const itemsToTransfer = inventoryItems.filter(() => Math.random() < 0.2);
  
  for (const item of itemsToTransfer) {
    // Find a different location to transfer to
    const differentLocations = locations.filter(l => l.id !== item.locationId);
    if (differentLocations.length === 0) continue;
    
    const targetLocation = differentLocations[Math.floor(Math.random() * differentLocations.length)];
    
    // Create a transfer record
    const transferId = uuidv4();
    const { error: transferError } = await supabase.from('inventory_transfers').insert({
      id: transferId,
      source_warehouse_id: item.warehouseId,
      source_location_id: item.locationId,
      destination_warehouse_id: targetLocation.warehouseId,
      destination_location_id: targetLocation.id,
      product_id: item.productId,
      quantity: item.quantity,
      status: ['pending', 'approved', 'completed'][Math.floor(Math.random() * 3)],
      transfer_reason: 'Test transfer',
      initiated_by: userId
    });
    if (transferError) throw new Error(`Failed to create transfer: ${transferError.message}`);
    
    // Create inventory movements for the transfer
    const movementStatuses: MovementStatus[] = ['pending', 'approved'];
    const status = movementStatuses[Math.floor(Math.random() * movementStatuses.length)];
    
    // Outgoing movement
    const { error: outError } = await supabase.from('inventory_movements').insert({
      product_id: item.productId,
      warehouse_id: item.warehouseId,
      location_id: item.locationId,
      movement_type: 'transfer' as MovementType,
      quantity: item.quantity,
      status: status,
      performed_by: userId,
      transfer_reference_id: transferId,
      details: {
        direction: 'outgoing',
        barcode: item.barcode,
        from_warehouse_id: item.warehouseId,
        from_location_id: item.locationId,
        to_warehouse_id: targetLocation.warehouseId,
        to_location_id: targetLocation.id
      }
    });
    if (outError) throw new Error(`Failed to create outgoing movement: ${outError.message}`);
    
    // Incoming movement
    const { error: inError } = await supabase.from('inventory_movements').insert({
      product_id: item.productId,
      warehouse_id: targetLocation.warehouseId,
      location_id: targetLocation.id,
      movement_type: 'transfer' as MovementType,
      quantity: item.quantity,
      status: status,
      performed_by: userId,
      transfer_reference_id: transferId,
      details: {
        direction: 'incoming',
        barcode: item.barcode,
        from_warehouse_id: item.warehouseId,
        from_location_id: item.locationId,
        to_warehouse_id: targetLocation.warehouseId,
        to_location_id: targetLocation.id
      }
    });
    if (inError) throw new Error(`Failed to create incoming movement: ${inError.message}`);
    
    // Update inventory item location if transfer is completed
    if (Math.random() < 0.5) {
      const { error: updateError } = await supabase
        .from('inventory')
        .update({
          warehouse_id: targetLocation.warehouseId,
          location_id: targetLocation.id
        })
        .eq('id', item.id);
      
      if (updateError) throw new Error(`Failed to update inventory location: ${updateError.message}`);
    }
  }
};
