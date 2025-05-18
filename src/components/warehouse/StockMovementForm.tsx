
import React, { useState } from 'react';
import { useInventoryTracker } from '@/hooks/useInventoryTracker';
import { useProducts } from '@/hooks/useProducts';
import { useWarehouses } from '@/hooks/useWarehouses';
import { useWarehouseLocations } from '@/hooks/useWarehouseLocations';
import { useUser } from '@/hooks/useUser';
import { MovementType } from '@/types/inventory';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { ArrowUpCircle, ArrowDownCircle, Loader2 } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { BarcodeScanner } from '@/components/warehouse/BarcodeScanner';

interface StockMovementFormProps {
  onComplete?: () => void;
}

export function StockMovementForm({ onComplete }: StockMovementFormProps) {
  // State for form
  const [direction, setDirection] = useState<'in' | 'out'>('in');
  const [productId, setProductId] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [locationId, setLocationId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [barcode, setBarcode] = useState('');
  const [color, setColor] = useState('');
  const [size, setSize] = useState('');
  const [notes, setNotes] = useState('');
  const [reference, setReference] = useState('');
  
  // Get data
  const { data: userData } = useUser();
  const { data: products, isLoading: isLoadingProducts } = useProducts();
  const { data: warehouses, isLoading: isLoadingWarehouses } = useWarehouses();
  const { data: locations, isLoading: isLoadingLocations } = useWarehouseLocations(warehouseId);
  
  // Inventory tracker hook
  const { recordStockIn, recordStockOut } = useInventoryTracker();
  
  // Handle barcode scan
  const handleBarcodeScanned = (scannedBarcode: string) => {
    setBarcode(scannedBarcode);
    // Auto-lookup the product by barcode would be implemented here
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!productId || !warehouseId || !locationId || !quantity || !userData?.id) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const movementData = {
        productId,
        warehouseId,
        locationId,
        quantity,
        direction,
        barcode: barcode || `${new Date().getTime()}-${Math.floor(Math.random() * 1000)}`, // Generate barcode if none
        movementType: direction === 'in' ? 'in' as MovementType : 'out' as MovementType,
        userId: userData.id,
        color: color || undefined,
        size: size || undefined,
        notes,
        referenceTable: 'manual_adjustment',
        referenceId: reference || undefined
      };
      
      if (direction === 'in') {
        await recordStockIn.mutateAsync(movementData);
      } else {
        await recordStockOut.mutateAsync(movementData);
      }
      
      // Reset form
      setProductId('');
      setBarcode('');
      setQuantity(1);
      setColor('');
      setSize('');
      setNotes('');
      setReference('');
      
      if (onComplete) {
        onComplete();
      }
    } catch (error) {
      console.error("Error processing inventory movement:", error);
    }
  };
  
  const isLoading = recordStockIn.isPending || recordStockOut.isPending;
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Inventory Movement</CardTitle>
        <CardDescription>
          Record stock movements (in/out) for inventory management
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="in" onValueChange={(value) => setDirection(value as 'in' | 'out')}>
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="in">
              <ArrowUpCircle className="mr-2 h-4 w-4 text-green-600" />
              Stock In
            </TabsTrigger>
            <TabsTrigger value="out">
              <ArrowDownCircle className="mr-2 h-4 w-4 text-red-600" />
              Stock Out
            </TabsTrigger>
          </TabsList>
          
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="barcode">Barcode (Scan or Enter)</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="barcode"
                      value={barcode}
                      onChange={(e) => setBarcode(e.target.value)}
                      className="flex-1"
                      placeholder="Scan or enter barcode"
                    />
                    <BarcodeScanner onBarcodeScanned={handleBarcodeScanned} />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="product">Product</Label>
                  <Select value={productId} onValueChange={setProductId} required>
                    <SelectTrigger id="product">
                      <SelectValue placeholder="Select product" />
                    </SelectTrigger>
                    <SelectContent>
                      {isLoadingProducts ? (
                        <div className="flex items-center justify-center py-2">Loading...</div>
                      ) : (
                        products?.map(product => (
                          <SelectItem key={product.id} value={product.id}>{product.name}</SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="warehouse">Warehouse</Label>
                  <Select value={warehouseId} onValueChange={setWarehouseId} required>
                    <SelectTrigger id="warehouse">
                      <SelectValue placeholder="Select warehouse" />
                    </SelectTrigger>
                    <SelectContent>
                      {isLoadingWarehouses ? (
                        <div className="flex items-center justify-center py-2">Loading...</div>
                      ) : (
                        warehouses?.map(warehouse => (
                          <SelectItem key={warehouse.id} value={warehouse.id}>{warehouse.name}</SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Select value={locationId} onValueChange={setLocationId} required disabled={!warehouseId}>
                    <SelectTrigger id="location">
                      <SelectValue placeholder={warehouseId ? "Select location" : "Select warehouse first"} />
                    </SelectTrigger>
                    <SelectContent>
                      {isLoadingLocations ? (
                        <div className="flex items-center justify-center py-2">Loading...</div>
                      ) : (
                        locations?.map(location => (
                          <SelectItem key={location.id} value={location.id}>
                            Floor {location.floor}, Zone {location.zone}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                    min={1}
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="color">Color (Optional)</Label>
                    <Input
                      id="color"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      placeholder="e.g. Red"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="size">Size (Optional)</Label>
                    <Input
                      id="size"
                      value={size}
                      onChange={(e) => setSize(e.target.value)}
                      placeholder="e.g. XL"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Input
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any additional information"
                  />
                </div>
                
                <div>
                  <Label htmlFor="reference">Reference ID (Optional)</Label>
                  <Input
                    id="reference"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    placeholder="Order or transaction reference"
                  />
                </div>
              </div>
            </div>
            
            <div className="mt-6">
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : direction === 'in' ? (
                  <>
                    <ArrowUpCircle className="mr-2 h-4 w-4" />
                    Record Stock In
                  </>
                ) : (
                  <>
                    <ArrowDownCircle className="mr-2 h-4 w-4" />
                    Record Stock Out
                  </>
                )}
              </Button>
            </div>
          </form>
        </Tabs>
      </CardContent>
    </Card>
  );
}
