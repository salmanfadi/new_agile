
import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ScanIcon, CheckCircle, XCircle, RotateCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { useBarcodeScanner } from '@/hooks/useBarcodeScanner';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { supabase } from '@/lib/supabase';

interface InventoryItem {
  inventory_id: string;
  product_id: string; // Added missing property
  product_name: string;
  product_sku: string;
  warehouse_name: string;
  warehouse_location: string;
  warehouse_id: string; // Added missing property
  location_id: string;  // Added missing property
  floor: number;
  zone: string;
  quantity: number;
  barcode: string;
  color: string;
  size: string;
  batch_id: string;
  status: string;
}

const FieldOperatorTransfers: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isScanning, setIsScanning] = useState(false);
  const [scannedBarcode, setScannedBarcode] = useState<string | null>(null);
  const [sourceItem, setSourceItem] = useState<InventoryItem | null>(null);
  const [transferQuantity, setTransferQuantity] = useState<number>(1);
  const [showTransferForm, setShowTransferForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [scanButtonText, setScanButtonText] = useState('Scan Barcode');
  const [destinationWarehouse, setDestinationWarehouse] = useState('');
  const [destinationLocation, setDestinationLocation] = useState('');
  const [isTransferring, setIsTransferring] = useState(false);
  const [warehouses, setWarehouses] = useState([]);
  const [locations, setLocations] = useState([]);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState('');
  const [selectedLocationId, setSelectedLocationId] = useState('');
  const [isAlertDialogOpen, setIsAlertDialogOpen] = useState(false);
  
  const { startScanning, stopScanning } = useBarcodeScanner({
    onResult: (result) => {
      handleScanResult(result.codeResult.code);
    },
    onError: (error) => {
      console.error("Scanning error:", error);
      toast({
        variant: 'destructive',
        title: 'Scanning Error',
        description: 'There was an error scanning the barcode. Please try again.',
      });
      setIsScanning(false);
      setScanButtonText('Scan Barcode');
    },
  });
  
  useEffect(() => {
    const fetchWarehouses = async () => {
      try {
        const { data, error } = await supabase
          .from('warehouses')
          .select('id, name');
        
        if (error) {
          throw error;
        }
        
        setWarehouses(data || []);
      } catch (error) {
        console.error('Error fetching warehouses:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to fetch warehouses. Please try again.',
        });
      }
    };
    
    fetchWarehouses();
  }, []);
  
  useEffect(() => {
    const fetchLocations = async () => {
      if (!selectedWarehouseId) return;
      
      try {
        const { data, error } = await supabase
          .from('warehouse_locations')
          .select('id, floor, zone')
          .eq('warehouse_id', selectedWarehouseId);
        
        if (error) {
          throw error;
        }
        
        setLocations(data || []);
      } catch (error) {
        console.error('Error fetching locations:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to fetch locations. Please try again.',
        });
      }
    };
    
    fetchLocations();
  }, [selectedWarehouseId]);
  
  const handleScanToggle = () => {
    if (isScanning) {
      stopScanning();
      setIsScanning(false);
      setScanButtonText('Scan Barcode');
    } else {
      startScanning();
      setIsScanning(true);
      setScanButtonText('Stop Scanning');
    }
  };
  
  const handleScanResult = async (barcode: string) => {
    setIsScanning(false);
    setScannedBarcode(barcode);
    setScanButtonText('Scan Another Barcode');
    
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .rpc('find_inventory_by_barcode', { search_barcode: barcode });
      
      if (error) {
        throw error;
      }
      
      if (data && data.length > 0) {
        const item = data[0];
        setSourceItem({
          inventory_id: item.inventory_id,
          product_id: item.product_id || '', // Using empty string as fallback
          product_name: item.product_name,
          product_sku: item.product_sku,
          warehouse_name: item.warehouse_name,
          warehouse_location: item.warehouse_location,
          warehouse_id: item.warehouse_id || '', // Using empty string as fallback
          location_id: item.location_id || '',  // Using empty string as fallback
          floor: item.floor,
          zone: item.zone,
          quantity: item.quantity,
          barcode: item.barcode,
          color: item.color,
          size: item.size,
          batch_id: item.batch_id,
          status: item.status
        });
        setTransferQuantity(1);
        setShowTransferForm(true);
      } else {
        toast({
          variant: 'destructive',
          title: 'Barcode Not Found',
          description: 'No inventory item found with this barcode.',
        });
        setSourceItem(null);
      }
    } catch (error) {
      console.error('Error fetching inventory item:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to look up barcode. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleTransfer = async () => {
    if (!sourceItem) {
      toast({
        variant: 'destructive',
        title: 'No Source Item',
        description: 'Please scan a barcode to select a source item.',
      });
      return;
    }
    
    if (!selectedWarehouseId || !selectedLocationId) {
      toast({
        variant: 'destructive',
        title: 'Missing Destination',
        description: 'Please select a destination warehouse and location.',
      });
      return;
    }
    
    if (transferQuantity <= 0 || transferQuantity > sourceItem.quantity) {
      toast({
        variant: 'destructive',
        title: 'Invalid Quantity',
        description: `Please enter a quantity between 1 and ${sourceItem.quantity}.`,
      });
      return;
    }
    
    setIsTransferring(true);
    try {
      // 1. Update the source inventory quantity
      const { error: sourceError } = await supabase
        .from('inventory')
        .update({ quantity: sourceItem.quantity - transferQuantity })
        .eq('id', sourceItem.inventory_id);
        
      if (sourceError) {
        throw sourceError;
      }
      
      // 2. Check if the destination inventory exists
      const { data: destinationData, error: destinationError } = await supabase
        .from('inventory')
        .select('*')
        .eq('product_id', sourceItem.product_id)
        .eq('warehouse_id', selectedWarehouseId)
        .eq('location_id', selectedLocationId)
        .eq('barcode', sourceItem.barcode);
        
      if (destinationError) {
        throw destinationError;
      }
      
      if (destinationData && destinationData.length > 0) {
        // If destination exists, update the quantity
        const { error: updateError } = await supabase
          .from('inventory')
          .update({ quantity: destinationData[0].quantity + transferQuantity })
          .eq('id', destinationData[0].id);
          
        if (updateError) {
          throw updateError;
        }
      } else {
        // If destination doesn't exist, create a new inventory item
        const { error: insertError } = await supabase
          .from('inventory')
          .insert({
            product_id: sourceItem.product_id,
            warehouse_id: selectedWarehouseId,
            location_id: selectedLocationId,
            barcode: sourceItem.barcode,
            quantity: transferQuantity,
            color: sourceItem.color,
            size: sourceItem.size,
            batch_id: sourceItem.batch_id,
            status: sourceItem.status
          });
          
        if (insertError) {
          throw insertError;
        }
      }
      
      toast({
        title: 'Transfer Successful',
        description: `${transferQuantity} ${sourceItem.product_name} transferred to ${selectedWarehouseId} - ${selectedLocationId}.`,
      });
      
      // Reset state
      setSourceItem(null);
      setTransferQuantity(1);
      setShowTransferForm(false);
      setScannedBarcode(null);
      setScanButtonText('Scan Barcode');
      setSelectedWarehouseId('');
      setSelectedLocationId('');
    } catch (error) {
      console.error('Error transferring inventory:', error);
      toast({
        variant: 'destructive',
        title: 'Transfer Failed',
        description: 'There was an error transferring the inventory. Please try again.',
      });
    } finally {
      setIsTransferring(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Inventory Transfers" 
        description="Move inventory items between locations"
      />
      
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate('/field')}
        className="flex items-center gap-2 mb-4"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Button>
      
      <Card>
        <CardHeader>
          <CardTitle>Source Item</CardTitle>
          <CardDescription>Scan a barcode to select the source item</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            variant="secondary"
            className="w-full flex items-center justify-center gap-2"
            onClick={handleScanToggle}
            disabled={isLoading}
          >
            {isScanning ? <RotateCcw className="animate-spin h-4 w-4" /> : <ScanIcon className="h-4 w-4" />}
            {scanButtonText}
          </Button>
          
          {scannedBarcode && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Scanned Barcode: {scannedBarcode}</p>
              {sourceItem ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <XCircle className="h-4 w-4 text-red-500" />
              )}
            </div>
          )}
          
          {sourceItem && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Product: {sourceItem.product_name}</p>
              <p className="text-sm text-muted-foreground">SKU: {sourceItem.product_sku}</p>
              <p className="text-sm text-muted-foreground">Warehouse: {sourceItem.warehouse_name}</p>
              <p className="text-sm text-muted-foreground">Location: {sourceItem.warehouse_location} (Floor {sourceItem.floor}, Zone {sourceItem.zone})</p>
              <p className="text-sm text-muted-foreground">Quantity: {sourceItem.quantity}</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      {showTransferForm && sourceItem && (
        <Card>
          <CardHeader>
            <CardTitle>Transfer Details</CardTitle>
            <CardDescription>Enter the destination and quantity to transfer</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="destination-warehouse">Destination Warehouse</Label>
                <select
                  id="destination-warehouse"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-background file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={selectedWarehouseId}
                  onChange={(e) => setSelectedWarehouseId(e.target.value)}
                >
                  <option value="">Select Warehouse</option>
                  {warehouses.map(warehouse => (
                    <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <Label htmlFor="destination-location">Destination Location</Label>
                <select
                  id="destination-location"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-background file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={selectedLocationId}
                  onChange={(e) => setSelectedLocationId(e.target.value)}
                  disabled={!selectedWarehouseId}
                >
                  <option value="">Select Location</option>
                  {locations.map(location => (
                    <option key={location.id} value={location.id}>
                      Floor {location.floor}, Zone {location.zone}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div>
              <Label htmlFor="transfer-quantity">Quantity to Transfer</Label>
              <Input
                id="transfer-quantity"
                type="number"
                placeholder="Quantity"
                value={transferQuantity.toString()}
                onChange={(e) => setTransferQuantity(parseInt(e.target.value))}
              />
            </div>
          </CardContent>
          <Separator />
          <div className="p-4 flex justify-between">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">Cancel</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will cancel the transfer and clear the selected item.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setIsAlertDialogOpen(false)}>
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      setSourceItem(null);
                      setTransferQuantity(1);
                      setShowTransferForm(false);
                      setScannedBarcode(null);
                      setScanButtonText('Scan Barcode');
                      setIsAlertDialogOpen(false);
                    }}
                  >
                    Continue
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button onClick={handleTransfer} disabled={isTransferring}>
              {isTransferring ? 'Transferring...' : 'Transfer Inventory'}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};

export default FieldOperatorTransfers;
