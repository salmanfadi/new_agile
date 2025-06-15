import React, { useState, useRef, useEffect } from 'react';
import Quagga from '@ericblade/quagga2';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { ArrowLeft, Camera, Minus, Plus, Check } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';

interface BatchItem {
  id: string;
  barcode?: string;
  product_name: string;
  batch_number?: string;
  quantity: number;
  location_id?: string;
  warehouse_id?: string;
  warehouse_name?: string;
  floor?: string | number;
  zone?: string;
  hsn_code?: string;
  gst_rate?: number;
  category?: string;
  foundSource?: string;
}

const BarcodeScanner: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [barcode, setBarcode] = useState<string>('');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [batchItem, setBatchItem] = useState<BatchItem | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [permissionState, setPermissionState] = useState<'prompt'|'granted'|'denied'|'unknown'>('unknown');
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const quaggaInitialized = useRef<boolean>(false);

  // Check camera permissions when component mounts
  useEffect(() => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      toast({
        variant: 'destructive',
        title: 'Browser Not Supported',
        description: 'Your browser does not support camera access. Please use a different browser or enter the barcode manually.',
      });
      return;
    }

    // Check permission status if supported
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'camera' as PermissionName })
        .then((permissionStatus) => {
          console.log('Camera permission status:', permissionStatus.state);
          setPermissionState(permissionStatus.state as 'prompt'|'granted'|'denied');
          
          permissionStatus.onchange = () => {
            console.log('Permission changed to:', permissionStatus.state);
            setPermissionState(permissionStatus.state as 'prompt'|'granted'|'denied');
            
            // If permission was just granted, start scanning automatically
            if (permissionStatus.state === 'granted' && !isScanning) {
              console.log('Permission granted, starting camera...');
              startScanningWithQuagga();
            }
          };
        })
        .catch(error => {
          console.error('Error checking camera permission:', error);
          setPermissionState('prompt');
        });
    } else {
      setPermissionState('prompt');
    }
  }, []);

  // Request camera permission and start scanning
  const requestCameraPermission = async () => {
    try {
      console.log('Requesting camera permission...');
      
      const constraints = {
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('Camera permission granted');
      
      // Store the stream for the scanning process
      streamRef.current = stream;
      setPermissionState('granted');
      
      // Start scanning immediately
      startScanningWithQuagga();
      
    } catch (error) {
      console.error('Error requesting camera permission:', error);
      setPermissionState('denied');
      toast({
        variant: 'destructive',
        title: 'Camera Access Denied',
        description: 'Please allow camera access in your browser settings and try again.',
      });
    }
  };

  // Initialize and start Quagga barcode scanner
  const startScanning = async () => {
    console.log('Start scanning called, permission state:', permissionState);
    
    if (permissionState === 'granted') {
      startScanningWithQuagga();
    } else {
      requestCameraPermission();
    }
  };

  // The actual scanning implementation with Quagga
  const startScanningWithQuagga = async () => {
    if (isScanning || quaggaInitialized.current) {
      console.log('Already scanning or Quagga already initialized');
      return;
    }

    setIsScanning(true);
    console.log('Starting Quagga scanner...');
    
    try {
      if (videoRef.current) {
        // If we already have a stream, use it
        if (streamRef.current) {
          videoRef.current.srcObject = streamRef.current;
          await videoRef.current.play();
        }

        // Initialize Quagga with the video element
        await Quagga.init({
          inputStream: {
            name: "Live",
            type: "LiveStream",
            target: videoRef.current,
            constraints: {
              facingMode: "environment",
              width: { min: 640 },
              height: { min: 480 },
            },
          },
          locator: {
            patchSize: "medium",
            halfSample: true,
          },
          numOfWorkers: navigator.hardwareConcurrency || 2,
          frequency: 10,
          decoder: {
            readers: [
              "code_128_reader",
              "ean_reader",
              "ean_8_reader",
              "code_39_reader",
              "code_93_reader",
              "upc_reader",
              "upc_e_reader",
              "i2of5_reader",
              "2of5_reader",
              "codabar_reader",
            ],
          },
          locate: true,
        });

        quaggaInitialized.current = true;
        Quagga.start();
        console.log('Quagga started successfully');

        // Listen for barcode detection
        Quagga.onDetected((result) => {
          if (result && result.codeResult) {
            const detectedBarcode = result.codeResult.code;
            console.log("Detected barcode:", detectedBarcode);
            setBarcode(detectedBarcode);
            stopScanning();
            fetchBatchByBarcode(detectedBarcode);
          }
        });

        // Add debug information if needed
        Quagga.onProcessed((result) => {
          if (!Quagga || !(Quagga as any).canvas) return;
          
          const canvas = (Quagga as any).canvas;
          if (!canvas || !canvas.ctx || !canvas.dom) return;
          
          const drawingCtx = canvas.ctx.overlay;
          const drawingCanvas = canvas.dom.overlay;

          if (result) {
            if (result.boxes) {
              drawingCtx.clearRect(
                0,
                0,
                parseInt(drawingCanvas.getAttribute("width") || "0"),
                parseInt(drawingCanvas.getAttribute("height") || "0")
              );
              result.boxes
                .filter((box) => {
                  if (!result.box) return true;
                  return true;
                })
                .forEach((box) => {
                  if (box && box.length >= 4) {
                    drawingCtx.strokeStyle = "green";
                    drawingCtx.lineWidth = 2;
                    drawingCtx.strokeRect(Number(box[0]), Number(box[1]), Number(box[2]) - Number(box[0]), Number(box[3]) - Number(box[1]));
                  }
                });
            }

            if (result.box) {
              const boxData = result.box;
              if (boxData && Array.isArray(boxData) && boxData.length >= 2 && 
                  Array.isArray(boxData[0]) && boxData[0].length >= 2 &&
                  Array.isArray(boxData[1]) && boxData[1].length >= 2) {
                const x = Number(boxData[0][0]);
                const y = Number(boxData[0][1]);
                const width = Number(boxData[1][0]) - x;
                const height = Number(boxData[1][1]) - y;
                
                const rect = { x, y, width, height };
                
                drawingCtx.strokeStyle = "blue";
                drawingCtx.lineWidth = 2;
                drawingCtx.strokeRect(
                  rect.x,
                  rect.y,
                  rect.width,
                  rect.height
                );
              }
            }

            if (result.codeResult && result.codeResult.code) {
              drawingCtx.font = "24px Arial";
              drawingCtx.fillStyle = "green";
              drawingCtx.fillText(result.codeResult.code, 10, 50);
            }
          }
        });
      }
    } catch (error) {
      console.error("Error starting Quagga:", error);
      toast({
        variant: "destructive",
        title: "Camera Access Error",
        description: "Could not access the camera. Please check your browser permissions or enter the barcode manually.",
      });
      setIsScanning(false);
      quaggaInitialized.current = false;
    }
  };

  const stopScanning = () => {
    console.log('Stopping camera...');
    setIsScanning(false);
    
    try {
      if (quaggaInitialized.current) {
        Quagga.stop();
        quaggaInitialized.current = false;
      }
      
      // Clean up video stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
    } catch (error) {
      console.error('Error stopping camera:', error);
    }
  };
  
  // Clean up camera resources when component unmounts
  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, []);

  const fetchBatchByBarcode = async (barcodeValue: string) => {
    setIsLoading(true);
    try {
      console.log('Fetching data for barcode:', barcodeValue);
      
      let foundData = null;
      let foundSource = '';
      
      console.log('Step 1: Checking barcodes table...');
      const { data: barcodeData, error: barcodeError } = await supabase
        .from('barcodes')
        .select(`
          id,
          barcode,
          quantity,
          status,
          product_id,
          batch_id,
          warehouse_id,
          location_id
        `)
        .eq('barcode', barcodeValue)
        .eq('status', 'active')
        .maybeSingle();

      if (barcodeError) {
        console.error('Barcodes table query error:', barcodeError);
      } else if (barcodeData) {
        console.log('Found in barcodes table:', barcodeData);
        foundData = barcodeData;
        foundSource = 'barcodes';
      }

      if (!foundData) {
        console.log('Step 2: Checking batch_items table...');
        const { data: batchItemData, error: batchItemError } = await supabase
          .from('batch_items')
          .select(`
            id,
            barcode,
            quantity,
            status,
            batch_id,
            warehouse_id,
            location_id,
            color,
            size
          `)
          .eq('barcode', barcodeValue)
          .eq('status', 'available')
          .maybeSingle();

        if (batchItemError) {
          console.error('Batch items table query error:', batchItemError);
        } else if (batchItemData) {
          console.log('Found in batch_items table:', batchItemData);
          foundData = batchItemData;
          foundSource = 'batch_items';
        }
      }

      if (!foundData) {
        console.log('Step 3: Checking inventory table...');
        const { data: inventoryData, error: inventoryError } = await supabase
          .from('inventory')
          .select(`
            id,
            barcode,
            quantity,
            status,
            product_id,
            batch_id,
            warehouse_id,
            location_id,
            color,
            size
          `)
          .eq('barcode', barcodeValue)
          .eq('status', 'available')
          .maybeSingle();

        if (inventoryError) {
          console.error('Inventory table query error:', inventoryError);
        } else if (inventoryData) {
          console.log('Found in inventory table:', inventoryData);
          foundData = inventoryData;
          foundSource = 'inventory';
        }
      }

      if (!foundData) {
        console.log('No data found in any table for barcode:', barcodeValue);
        toast({
          variant: 'destructive',
          title: 'Barcode not found',
          description: `No barcode ${barcodeValue} exists in the system or it's not available for stock out.`,
        });
        setBatchItem(null);
        return;
      }

      console.log('Found data from', foundSource, ':', foundData);

      let productId = foundData.product_id;
      
      if (foundSource === 'batch_items' && !productId) {
        console.log('Getting product info from processed_batches for batch_id:', foundData.batch_id);
        const { data: batchData, error: batchError } = await supabase
          .from('processed_batches')
          .select('product_id')
          .eq('id', foundData.batch_id)
          .maybeSingle();
          
        if (batchError) {
          console.error('Error getting batch product info:', batchError);
        } else if (batchData) {
          productId = batchData.product_id;
          console.log('Got product_id from batch:', productId);
        }
      }

      if (!productId) {
        console.error('No product_id found for barcode');
        toast({
          variant: 'destructive',
          title: 'Product information missing',
          description: 'Unable to retrieve product details for this barcode.',
        });
        setBatchItem(null);
        return;
      }

      console.log('Getting product details for product_id:', productId);
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select('id, name, sku, category, hsn_code, gst_rate')
        .eq('id', productId)
        .maybeSingle();

      if (productError || !productData) {
        console.error('Error getting product details:', productError);
        toast({
          variant: 'destructive',
          title: 'Product information missing',
          description: 'Unable to retrieve product details for this barcode.',
        });
        setBatchItem(null);
        return;
      }

      console.log('Product details:', productData);

      let warehouseName = 'Unknown Warehouse';
      if (foundData.warehouse_id) {
        const { data: warehouseData } = await supabase
          .from('warehouses')
          .select('name')
          .eq('id', foundData.warehouse_id)
          .maybeSingle();
        
        if (warehouseData) {
          warehouseName = warehouseData.name;
        }
      }

      let floor = 'N/A';
      let zone = 'N/A';
      if (foundData.location_id) {
        const { data: locationData } = await supabase
          .from('warehouse_locations')
          .select('floor, zone')
          .eq('id', foundData.location_id)
          .maybeSingle();
        
        if (locationData) {
          floor = locationData.floor || 'N/A';
          zone = locationData.zone || 'N/A';
        }
      }

      const formattedBatch: BatchItem = {
        id: foundData.id,
        barcode: barcodeValue,
        product_name: productData.name,
        batch_number: foundData.batch_id ? `BATCH-${foundData.batch_id.substring(0, 8)}` : 'N/A',
        quantity: foundData.quantity || 1,
        warehouse_id: foundData.warehouse_id,
        warehouse_name: warehouseName,
        floor: floor,
        zone: zone,
        hsn_code: productData.hsn_code,
        gst_rate: productData.gst_rate,
        category: productData.category,
        foundSource: foundSource,
      };

      setBatchItem(formattedBatch);
      setQuantity(1);
      
      toast({
        title: 'Batch Found',
        description: `Found ${productData.name} (${foundData.quantity} units) from ${foundSource}`,
      });
    } catch (error) {
      console.error('Error fetching batch data:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to fetch batch data. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBarcodeInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBarcode(e.target.value);
    setBatchItem(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (barcode) {
      fetchBatchByBarcode(barcode);
    }
  };

  const handleQuantityChange = (value: number) => {
    if (batchItem) {
      const newQuantity = Math.max(1, Math.min(value, batchItem.quantity));
      setQuantity(newQuantity);
    }
  };

  const handleProcessStockOut = async () => {
    if (!batchItem || quantity <= 0 || !user?.id) return;
    
    setIsProcessing(true);
    try {
      // Update the quantity in the source table where the barcode was found
      const sourceTable = batchItem.foundSource;
      
      if (sourceTable === 'barcodes') {
        // Update barcodes table
        const { error: updateError } = await supabase
          .from('barcodes')
          .update({
            quantity: batchItem.quantity - quantity,
            updated_at: new Date().toISOString()
          })
          .eq('id', batchItem.id);

        if (updateError) throw updateError;
      } else if (sourceTable === 'batch_items') {
        // Update batch_items table
        const { error: updateError } = await supabase
          .from('batch_items')
          .update({
            quantity: batchItem.quantity - quantity,
            updated_at: new Date().toISOString()
          })
          .eq('id', batchItem.id);

        if (updateError) throw updateError;
      } else if (sourceTable === 'inventory') {
        // Update inventory table
        const { error: updateError } = await supabase
          .from('inventory')
          .update({
            quantity: batchItem.quantity - quantity,
            updated_at: new Date().toISOString()
          })
          .eq('id', batchItem.id);

        if (updateError) throw updateError;
      }

      // Create an inventory movement record for tracking (using correct movement_type enum value)
      const { error: movementError } = await supabase
        .from('inventory_movements')
        .insert({
          movement_type: 'out', // Use correct enum value
          quantity: quantity,
          performed_by: user.id,
          notes: `Stock out via barcode scanner for ${batchItem.barcode} from ${sourceTable} table`,
        });

      if (movementError) {
        console.error('Failed to create movement record:', movementError);
        // Don't throw here as the main operation succeeded
      }

      setBatchItem({
        ...batchItem,
        quantity: batchItem.quantity - quantity
      });
      
      toast({
        title: 'Stock Out Processed',
        description: `Successfully processed stock out of ${quantity} units`,
      });
      
      setQuantity(1);
      
    } catch (error) {
      console.error('Error processing stock out:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to process stock out. Please try again.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-3xl">
      <PageHeader
        title="Barcode Scanner"
        description="Scan a barcode to view batch details and process stock out"
      />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Scan Barcode</CardTitle>
          <CardDescription>
            Scan a barcode to view batch details and process stock out
          </CardDescription>
        </CardHeader>
        <CardContent>
          {permissionState === 'denied' ? (
            <div className="text-center p-6 border border-destructive rounded-md bg-destructive/10">
              <div className="mb-4 text-destructive">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto">
                  <path d="M10.8 5.1L12 3m1.2 2.1 1.2-2.1M21 16.6c0 2.5-2.2 4.4-5 4.4H8c-2.8 0-5-2-5-4.4 0-1.9 1.2-3.6 3-4.4v-1.7c0-3.9 3.1-7.5 7-7.5s7 3.6 7 7.5v1.7c1.8.8 3 2.5 3 4.4z"/>
                  <path d="m14 14-4 4m0-4 4 4"/>
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Camera Access Denied</h3>
              <p className="mb-4 text-sm">Please allow camera access in your browser settings to use the barcode scanner.</p>
              <div className="space-y-2">
                <Button onClick={() => requestCameraPermission()} className="w-full">
                  Try Again
                </Button>
                <p className="text-xs text-muted-foreground">
                  You may need to refresh the page after changing your browser settings.
                </p>
              </div>
            </div>
          ) : isScanning ? (
            <div className="relative">
              <div id="interactive" className="viewport w-full h-64 relative overflow-hidden rounded-md">
                <video 
                  ref={videoRef} 
                  className="w-full h-full object-cover bg-black" 
                  playsInline 
                  autoPlay
                  muted
                />
              </div>
              <Button 
                variant="destructive" 
                className="mt-4" 
                onClick={stopScanning}
              >
                Cancel Scanning
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                Position the barcode within the viewfinder to scan
              </p>
            </div>
          ) : (
            <div>
              <form onSubmit={(e) => { e.preventDefault(); if (barcode) fetchBatchByBarcode(barcode); }} className="flex flex-col space-y-4">
                <div className="flex space-x-2">
                  <Input 
                    type="text" 
                    value={barcode} 
                    onChange={(e) => setBarcode(e.target.value)} 
                    placeholder="Enter barcode manually" 
                    className="flex-1"
                  />
                  <Button type="submit" disabled={!barcode || isLoading}>
                    {isLoading ? 'Loading...' : 'Search'}
                  </Button>
                </div>
                <Button 
                  type="button" 
                  onClick={startScanning} 
                  className="flex items-center justify-center gap-2"
                >
                  <Camera className="h-5 w-5" />
                  Scan Barcode
                </Button>
                <p className="text-sm text-muted-foreground mt-2">
                  If camera access fails, please check your browser permissions or enter the barcode manually.
                </p>
              </form>
            </div>
          )}
        </CardContent>
      </Card>

      {isLoading && (
        <div className="flex justify-center items-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      )}

      {batchItem && (
        <Card>
          <CardHeader>
            <CardTitle>Batch Details</CardTitle>
            <CardDescription>Information about the scanned batch</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs text-muted-foreground">Barcode</Label>
                  <p className="font-mono text-sm">{batchItem.barcode}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Batch Number</Label>
                  <p className="font-mono text-sm">{batchItem.batch_number}</p>
                </div>
                <div className="col-span-2">
                  <Label className="text-xs text-muted-foreground">Product</Label>
                  <p className="font-medium">{batchItem.product_name}</p>
                  {batchItem.category && (
                    <p className="text-xs text-gray-500 mt-1">Category: {batchItem.category}</p>
                  )}
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Available Quantity</Label>
                  <p className="font-medium text-lg">{batchItem.quantity}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Location</Label>
                  <p className="font-medium">
                    {batchItem.warehouse_name} 
                    {batchItem.floor && batchItem.zone ? 
                      ` (Floor: ${batchItem.floor}, Zone: ${batchItem.zone})` : ''}
                  </p>
                </div>
              </div>
              
              {(batchItem.hsn_code || batchItem.gst_rate !== undefined) && (
                <div className="pt-2 border-t">
                  <Label className="text-xs text-muted-foreground block mb-2">Tax Information</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {batchItem.hsn_code && (
                      <div>
                        <Label className="text-xs text-muted-foreground">HSN Code</Label>
                        <div className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                          {batchItem.hsn_code}
                        </div>
                      </div>
                    )}
                    {batchItem.gst_rate !== undefined && (
                      <div>
                        <Label className="text-xs text-muted-foreground">GST Rate</Label>
                        <div className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                          {batchItem.gst_rate}%
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              <div className="pt-4 border-t">
                <Label htmlFor="quantity" className="block mb-2">Quantity to Subtract</Label>
                <div className="flex items-center space-x-2">
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1 || isProcessing}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <Input
                    id="quantity"
                    type="number"
                    min={1}
                    max={batchItem.quantity}
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, Math.min(batchItem.quantity, parseInt(e.target.value) || 1)))}
                    className="w-20 text-center"
                    disabled={isProcessing}
                  />
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={() => setQuantity(Math.min(batchItem.quantity, quantity + 1))}
                    disabled={quantity >= batchItem.quantity || isProcessing}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                
                <Button
                  className="w-full mt-4 flex items-center justify-center gap-2"
                  onClick={handleProcessStockOut}
                  disabled={isProcessing || batchItem.quantity <= 0}
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-background"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      Process Stock Out
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BarcodeScanner;
