
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import BarcodeScanner from '@/components/warehouse/BarcodeScanner';
import { useProducts } from '@/hooks/useProducts';
import { useWarehouses } from '@/hooks/useWarehouses';
import { useWarehouseLocations } from '@/hooks/useWarehouseLocations';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const StockMovementForm = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [barcode, setBarcode] = useState('');
  const [movementType, setMovementType] = useState('in'); // 'in' or 'out'
  const [productId, setProductId] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [locationId, setLocationId] = useState('');
  const [quantity, setQuantity] = useState(1);
  
  const { products, isLoading: productsLoading } = useProducts();
  const { warehouses, isLoading: warehousesLoading } = useWarehouses();
  const { data: locations, isLoading: locationsLoading } = useWarehouseLocations(warehouseId);

  const handleBarcodeScanned = (scannedBarcode: string) => {
    setBarcode(scannedBarcode);
    // Here you would typically lookup the barcode to get product info
    toast({
      title: "Barcode Scanned",
      description: `Scanned barcode: ${scannedBarcode}`,
    });
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!productId || !warehouseId || !locationId || quantity <= 0) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // For stock in
      if (movementType === 'in') {
        const { data, error } = await supabase
          .from('inventory')
          .insert({
            product_id: productId,
            warehouse_id: warehouseId,
            location_id: locationId,
            quantity: quantity,
            barcode: barcode || undefined,
            status: 'available',
          });
          
        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Stock added successfully",
        });
      } 
      // For stock out
      else {
        // First check if enough inventory exists
        const { data: inventoryData, error: inventoryError } = await supabase
          .from('inventory')
          .select('quantity')
          .eq('product_id', productId)
          .eq('warehouse_id', warehouseId)
          .eq('location_id', locationId)
          .eq('status', 'available');
          
        if (inventoryError) throw inventoryError;
        
        const totalAvailable = inventoryData?.reduce((sum, item) => sum + item.quantity, 0) || 0;
        
        if (totalAvailable < quantity) {
          toast({
            title: "Insufficient Stock",
            description: `Only ${totalAvailable} units available at this location`,
            variant: "destructive",
          });
          return;
        }
        
        // Process stock out
        const { data, error } = await supabase
          .from('inventory')
          .update({ 
            status: 'out',
            quantity: 0,
          })
          .eq('product_id', productId)
          .eq('warehouse_id', warehouseId)
          .eq('location_id', locationId)
          .eq('status', 'available')
          .limit(1);
          
        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Stock out processed successfully",
        });
      }
      
      // Reset form
      setBarcode('');
      setProductId('');
      setWarehouseId('');
      setLocationId('');
      setQuantity(1);
      
    } catch (error) {
      console.error('Error processing stock movement:', error);
      toast({
        title: "Error",
        description: "Failed to process stock movement",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Record Stock Movement</CardTitle>
        <CardDescription>Add or remove stock from inventory</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Movement Type</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={movementType === 'in' ? "default" : "outline"}
                onClick={() => setMovementType('in')}
              >
                Stock In
              </Button>
              <Button
                type="button"
                variant={movementType === 'out' ? "default" : "outline"}
                onClick={() => setMovementType('out')}
              >
                Stock Out
              </Button>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="barcode">Barcode (Optional)</Label>
            <BarcodeScanner onScan={handleBarcodeScanned} />
            <div className="text-sm text-muted-foreground mt-1">
              Manually entered: {barcode || 'None'}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="product">Product</Label>
              <Select
                value={productId}
                onValueChange={setProductId}
                disabled={productsLoading}
              >
                <SelectTrigger id="product">
                  <SelectValue placeholder="Select product" />
                </SelectTrigger>
                <SelectContent>
                  {products?.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="warehouse">Warehouse</Label>
              <Select
                value={warehouseId}
                onValueChange={(value) => {
                  setWarehouseId(value);
                  setLocationId(''); // Reset location when warehouse changes
                }}
                disabled={warehousesLoading}
              >
                <SelectTrigger id="warehouse">
                  <SelectValue placeholder="Select warehouse" />
                </SelectTrigger>
                <SelectContent>
                  {warehouses?.map((warehouse) => (
                    <SelectItem key={warehouse.id} value={warehouse.id}>
                      {warehouse.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Select
                value={locationId}
                onValueChange={setLocationId}
                disabled={!warehouseId || locationsLoading}
              >
                <SelectTrigger id="location">
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  {locations?.map((location) => (
                    <SelectItem key={location.id} value={location.id}>
                      Floor {location.floor}, Zone {location.zone}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? "Processing..." : movementType === 'in' ? "Add Stock" : "Remove Stock"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default StockMovementForm;
