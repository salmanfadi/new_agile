
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { BatchFormData } from '@/types/batchStockIn';
import { generateBarcodeString } from '@/utils/barcodeUtils';
import { Product, Warehouse, WarehouseLocation } from '@/types/database';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Plus, Package } from 'lucide-react';

interface BatchFormProps {
  onAddBatch: (batchData: BatchFormData) => void;
  isSubmitting?: boolean;
}

export const BatchForm: React.FC<BatchFormProps> = ({ onAddBatch, isSubmitting = false }) => {
  const [batchData, setBatchData] = useState<BatchFormData>({
    product: null,
    warehouse: null,
    location: null,
    boxes_count: 1,
    quantity_per_box: 10,
    color: '',
    size: ''
  });

  // Fetch products
  const { data: products, isLoading: isLoadingProducts } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      return data as Product[];
    }
  });

  // Fetch warehouses
  const { data: warehouses, isLoading: isLoadingWarehouses } = useQuery({
    queryKey: ['warehouses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('warehouses')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as Warehouse[];
    }
  });

  // Fetch locations based on selected warehouse
  const { data: locations, isLoading: isLoadingLocations } = useQuery({
    queryKey: ['locations', batchData.warehouse?.id],
    queryFn: async () => {
      if (!batchData.warehouse?.id) return [];
      
      const { data, error } = await supabase
        .from('warehouse_locations')
        .select('*')
        .eq('warehouse_id', batchData.warehouse.id)
        .order('floor')
        .order('zone');
      
      if (error) throw error;
      return data as WarehouseLocation[];
    },
    enabled: !!batchData.warehouse?.id
  });

  const handleChange = (field: keyof BatchFormData, value: any) => {
    setBatchData(prev => ({
      ...prev,
      [field]: value
    }));

    // If warehouse changes, reset location
    if (field === 'warehouse') {
      setBatchData(prev => ({
        ...prev,
        warehouse: value,
        location: null
      }));
    }
  };

  const handleProductChange = (productId: string) => {
    const selectedProduct = products?.find(p => p.id === productId) || null;
    handleChange('product', selectedProduct);
  };

  const handleWarehouseChange = (warehouseId: string) => {
    const selectedWarehouse = warehouses?.find(w => w.id === warehouseId) || null;
    handleChange('warehouse', selectedWarehouse);
  };

  const handleLocationChange = (locationId: string) => {
    const selectedLocation = locations?.find(l => l.id === locationId) || null;
    handleChange('location', selectedLocation);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddBatch(batchData);
  };

  const isFormValid = 
    batchData.product !== null && 
    batchData.warehouse !== null && 
    batchData.location !== null && 
    batchData.boxes_count > 0 && 
    batchData.quantity_per_box > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Package className="h-5 w-5" />
          Create New Batch
        </CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="product">Product</Label>
            <Select 
              onValueChange={handleProductChange} 
              disabled={isLoadingProducts || isSubmitting}
            >
              <SelectTrigger id="product">
                <SelectValue placeholder="Select product" />
              </SelectTrigger>
              <SelectContent>
                {isLoadingProducts ? (
                  <SelectItem value="loading" disabled>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Loading products...
                  </SelectItem>
                ) : (
                  products?.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name} {product.sku ? `(${product.sku})` : ''}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="boxes_count">Number of Boxes</Label>
              <Input
                id="boxes_count"
                type="number"
                min={1}
                value={batchData.boxes_count}
                onChange={(e) => handleChange('boxes_count', parseInt(e.target.value) || 1)}
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantity_per_box">Quantity per Box</Label>
              <Input
                id="quantity_per_box"
                type="number"
                min={1}
                value={batchData.quantity_per_box}
                onChange={(e) => handleChange('quantity_per_box', parseInt(e.target.value) || 1)}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="warehouse">Warehouse</Label>
            <Select 
              onValueChange={handleWarehouseChange} 
              disabled={isLoadingWarehouses || isSubmitting}
            >
              <SelectTrigger id="warehouse">
                <SelectValue placeholder="Select warehouse" />
              </SelectTrigger>
              <SelectContent>
                {isLoadingWarehouses ? (
                  <SelectItem value="loading" disabled>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Loading warehouses...
                  </SelectItem>
                ) : (
                  warehouses?.map((warehouse) => (
                    <SelectItem key={warehouse.id} value={warehouse.id}>
                      {warehouse.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Select 
              onValueChange={handleLocationChange} 
              disabled={!batchData.warehouse || isLoadingLocations || isSubmitting}
            >
              <SelectTrigger id="location">
                <SelectValue placeholder={batchData.warehouse ? "Select location" : "Select warehouse first"} />
              </SelectTrigger>
              <SelectContent>
                {isLoadingLocations ? (
                  <SelectItem value="loading" disabled>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Loading locations...
                  </SelectItem>
                ) : (
                  locations?.map((location) => (
                    <SelectItem key={location.id} value={location.id}>
                      Floor {location.floor}, Zone {location.zone}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="color">Color (Optional)</Label>
              <Input
                id="color"
                value={batchData.color}
                onChange={(e) => handleChange('color', e.target.value)}
                placeholder="e.g. Red"
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="size">Size (Optional)</Label>
              <Input
                id="size"
                value={batchData.size}
                onChange={(e) => handleChange('size', e.target.value)}
                placeholder="e.g. Large"
                disabled={isSubmitting}
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="justify-between">
          <Button 
            type="submit" 
            disabled={!isFormValid || isSubmitting}
            className="w-full"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Batch
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};
