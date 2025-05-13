import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import BarcodePreview, { getBarcodeCanvas } from '@/components/barcode/BarcodePreview';
import { jsPDF } from 'jspdf';
import { PageHeader } from '@/components/ui/PageHeader';
import { useAuth } from '@/context/AuthContext';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { generateBarcode } from '@/utils/barcodeUtils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

interface BatchData {
  id: string;
  warehouse_id: string;
  location_id: string;
  quantity: number;
  color: string;
  size: string;
  product_id: string;
  boxes: number;
}

interface StockInRequest {
  id: string;
  product: { id: string; name: string; sku: string };
  boxes: number;
  source: string;
  notes: string;
  status: string;
}

const DedicatedBatchStockInPage: React.FC = () => {
  const { stockInId } = useParams<{ stockInId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [stockInRequest, setStockInRequest] = useState<StockInRequest | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('');
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [errorState, setErrorState] = useState<string | null>(null);
  const [batches, setBatches] = useState<BatchData[]>([]);
  const [color, setColor] = useState('');
  const [size, setSize] = useState('');
  const [boxes, setBoxes] = useState<number>(1);
  const [remainingBoxes, setRemainingBoxes] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(10);

  // Utility to generate barcodes for all batches
  const generateAllBarcodes = () =>
    batches.flatMap((batch, batchIndex) =>
      Array.from({ length: batch.boxes }, (_, boxIndex) =>
        generateBarcode(
          { sku: stockInRequest?.product?.sku, id: stockInRequest?.product?.id },
          batchIndex * 100 + boxIndex
        )
      )
    );

  // Utility to generate barcodes for a single batch
  const generateBatchBarcodes = (batch: BatchData, batchIndex: number) =>
    Array.from({ length: batch.boxes }, (_, boxIndex) =>
      generateBarcode(
        { sku: stockInRequest?.product?.sku, id: stockInRequest?.product?.id },
        batchIndex * 100 + boxIndex
      )
    );

  // Fetch stock-in request
  const { data: stockInData, isLoading: isStockInLoading, error: stockInError } = useQuery({
    queryKey: ['stockIn', stockInId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stock_in_requests')
        .select('*, product(*)')
        .eq('id', stockInId)
        .single();
      if (error) throw error;
      return data;
    },
  });

  // Fetch warehouses
  const { data: warehouses } = useQuery({
    queryKey: ['warehouses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('warehouses')
        .select('*')
        .order('name');
      if (error) throw error;
      return data;
    },
  });

  // Fetch locations based on selected warehouse
  const { data: locations } = useQuery({
    queryKey: ['locations', selectedWarehouse],
    queryFn: async () => {
      if (!selectedWarehouse) return [];
      const { data, error } = await supabase
        .from('warehouse_locations')
        .select('*')
        .eq('warehouse_id', selectedWarehouse)
        .order('floor')
        .order('zone');
      if (error) throw error;
      return data;
    },
    enabled: !!selectedWarehouse,
  });

  // Fetch stock-in request details
  useEffect(() => {
    if (stockInData) {
      setStockInRequest(stockInData);
      setRemainingBoxes(stockInData.boxes || 0);
    }
    if (stockInError) {
      setErrorState('Failed to load stock-in request.');
    }
  }, [stockInData, stockInError]);

  // Add a new batch
  const addBatch = () => {
    if (!stockInRequest?.product?.id || !selectedWarehouse || !selectedLocation || boxes <= 0) {
      toast({
        variant: 'destructive',
        title: 'Missing Required Fields',
        description: 'Please select a warehouse, location, and specify the number of boxes before adding a batch',
      });
      return;
    }

    if (boxes > remainingBoxes) {
      toast({
        variant: 'destructive',
        title: 'Invalid Box Count',
        description: `You can only add up to ${remainingBoxes} boxes. ${remainingBoxes} boxes remaining`,
      });
      return;
    }

    const newBatch: BatchData = {
      id: crypto.randomUUID(),
      warehouse_id: selectedWarehouse,
      location_id: selectedLocation,
      quantity,
      color,
      size,
      product_id: stockInRequest.product.id,
      boxes,
    };

    setBatches((prev) => {
      const updatedBatches = [...prev, newBatch];
      const totalBoxes = updatedBatches.reduce((sum, batch) => sum + batch.boxes, 0);
      setRemainingBoxes(stockInRequest.boxes - totalBoxes);
      return updatedBatches;
    });

    setSelectedLocation('');
    setQuantity(10);
    setColor('');
    setSize('');
    setBoxes(1);

    toast({
      title: 'Success',
      description: `Added ${boxes} boxes to batch`,
    });
  };

  // Process stock-in
  const processStockInMutation = useMutation({
    mutationFn: async () => {
      if (!stockInRequest?.id || !user?.id || !stockInRequest?.product?.id) {
        throw new Error('Missing required data');
      }

      const boxes = batches.flatMap((batch, batchIndex) =>
        Array.from({ length: batch.boxes }, (_, boxIndex) => ({
          barcode: generateBarcode(
            { sku: stockInRequest.product.sku, id: stockInRequest.product.id },
            batchIndex * 100 + boxIndex
          ),
          quantity: batch.quantity,
          color: batch.color,
          size: batch.size,
          warehouse_id: batch.warehouse_id,
          location_id: batch.location_id,
          product_id: batch.product_id,
        }))
      );

      const { data, error } = await supabase.rpc('process_stock_in', {
        stock_in_id: stockInRequest.id,
        processed_by: user.id,
        boxes_data: boxes,
      });

      if (error) throw error;

      const { error: barcodeError } = await supabase.from('barcode_inventory').insert(
        boxes.map((box) => ({
          barcode: box.barcode,
          product_id: box.product_id,
          warehouse_id: box.warehouse_id,
          location_id: box.location_id,
          quantity: box.quantity,
          color: box.color,
          size: box.size,
          status: 'available',
          created_by: user.id,
          created_at: new Date().toISOString(),
          stock_in_id: stockInRequest.id,
        }))
      );

      if (barcodeError) throw barcodeError;

      return data;
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Stock-in processed successfully',
      });
      navigate('/manager/inventory');
    },
    onError: (error: unknown) => {
      let message = 'Failed to process stock-in.';
      if (error instanceof Error) {
        message += ' ' + error.message;
      }
      toast({
        variant: 'destructive',
        title: 'Error',
        description: message,
      });
    },
  });

  // Handle form submission
  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    processStockInMutation.mutate();
  };


  if (errorState) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px]">
        <div className="text-red-600 font-bold text-lg mb-2">An error occurred</div>
        <div className="text-sm text-gray-800 mb-4">{errorState}</div>
        <Button onClick={() => setErrorState(null)} variant="outline">Try Again</Button>
      </div>
    );
  }
  if (isStockInLoading || !stockInRequest) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader title="Stock In Batch Processing" />

      <Card>
        <CardHeader>
          <CardTitle>Stock-In Request Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label>Product</Label>
              <div className="text-sm">
                {stockInRequest.product.name} ({stockInRequest.product.sku})
              </div>
            </div>
            <div>
              <Label>Source</Label>
              <div className="text-sm">{stockInRequest.source}</div>
            </div>
            <div>
              <Label>Notes</Label>
              <div className="text-sm">{stockInRequest.notes}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Add New Batch</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Warehouse</Label>
                <Select value={selectedWarehouse} onValueChange={setSelectedWarehouse}>
                  <SelectTrigger>
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
              <div>
                <Label>Location</Label>
                <Select
                  value={selectedLocation}
                  onValueChange={setSelectedLocation}
                  disabled={!selectedWarehouse}
                >
                  <SelectTrigger>
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Quantity</Label>
                <Input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value) || 0)}
                  min={1}
                />
              </div>
              <div>
                <Label>Boxes</Label>
                <Input
                  type="number"
                  value={boxes}
                  onChange={(e) => setBoxes(Number(e.target.value) || 0)}
                  min={1}
                  max={remainingBoxes}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Color</Label>
                <Input value={color} onChange={(e) => setColor(e.target.value)} />
              </div>
              <div>
                <Label>Size</Label>
                <Input value={size} onChange={(e) => setSize(e.target.value)} />
              </div>
            </div>

            {remainingBoxes > 0 && (
              <div className="mt-2 text-sm text-muted-foreground">
                {remainingBoxes} boxes remaining
              </div>
            )}

            <Button
              type="button"
              onClick={addBatch}
              disabled={!selectedWarehouse || !selectedLocation}
            >
              Add Batch
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Batches</CardTitle>
          <CardDescription>
            {batches.length > 0 && (
              <Button
                variant="outline"
                onClick={async () => {
                  const batchBarcodes = generateAllBarcodes();

                  const pdf = new jsPDF();
                  const barcodeWidth = 80;
                  const barcodeHeight = 30;
                  const margin = 10;
                  let y = margin;

                  await Promise.all(
                    batchBarcodes.map(async (barcode, i) => {
                      if (i > 0 && i % 4 === 0) {
                        y += barcodeHeight + margin;
                      }

                      const canvas = await getBarcodeCanvas(barcode, barcodeWidth, barcodeHeight, 3);
                      pdf.addImage(
                        canvas.toDataURL('image/png'),
                        'PNG',
                        (i % 4) * (barcodeWidth + margin) + margin,
                        y,
                        barcodeWidth,
                        barcodeHeight
                      );
                    })
                  );

                  pdf.save(`barcodes_${stockInRequest?.id}.pdf`);
                }}
              >
                Download Barcodes PDF
              </Button>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {batches.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">No batches added yet</div>
          ) : (
            <div className="space-y-4">
              {batches.map((batch, index) => {
                const batchBarcodes = generateBatchBarcodes(batch, index);

                return (
                  <div key={batch.id} className="p-4 border rounded-md">
                    <div className="flex justify-between items-center mb-2">
                      <div>
                        <p className="font-medium">Batch #{index + 1}</p>
                        <p className="text-sm text-muted-foreground">
                          {batch.boxes} boxes ({batch.quantity} items per box) in{' '}
                          {warehouses?.find((w) => w.id === batch.warehouse_id)?.name}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Color: {batch.color}, Size: {batch.size}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={async () => {
                            const previewBarcodes = batchBarcodes.slice(0, 4);
                            const previewWindow = window.open('', '_blank');
                            if (previewWindow) {
                              // Generate barcode images
                              const barcodeImages = await Promise.all(
                                previewBarcodes.map(async (barcode) => {
                                  const canvas = await getBarcodeCanvas(barcode, 300, 100, 3);
                                  return `<div class="barcode-item"><img src="${canvas.toDataURL('image/png')}" alt="Barcode" /><p>${barcode}</p></div>`;
                                })
                              );
                              previewWindow.document.write(`
                                <html>
                                  <head>
                                    <title>Barcode Preview</title>
                                    <style>
                                      .barcode-container {
                                        display: grid;
                                        grid-template-columns: repeat(2, 1fr);
                                        gap: 20px;
                                        padding: 20px;
                                      }
                                      .barcode-item {
                                        text-align: center;
                                        border: 1px solid #ccc;
                                        padding: 10px;
                                        border-radius: 4px;
                                      }
                                      .barcode-item img {
                                        max-width: 100%;
                                      }
                                    </style>
                                  </head>
                                  <body>
                                    <div class="barcode-container">
                                      ${barcodeImages.join('')}
                                    </div>
                                  </body>
                                </html>
                              `);
                              previewWindow.document.close();
                            }
                          }}
                        >
                          Preview Barcodes
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setBatches((prev) => {
                              const updatedBatches = [...prev];
                              updatedBatches.splice(index, 1);
                              const totalBoxes = updatedBatches.reduce((sum, batch) => sum + batch.boxes, 0);
                              setRemainingBoxes(stockInRequest.boxes - totalBoxes);
                              return updatedBatches;
                            });
                          }}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                    <div className="mt-2">
                      <div className="flex flex-wrap gap-2">
                        {batchBarcodes.map((barcode, i) => (
                          <div key={i} className="bg-muted px-2 py-1 rounded text-sm">
                            {barcode}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Button
        onClick={handleSubmit}
        disabled={processStockInMutation.isLoading || batches.length === 0}
        className="w-full"
      >
        {processStockInMutation.isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          'Process Stock In'
        )}
      </Button>
    </div>
  );
};

export default DedicatedBatchStockInPage;