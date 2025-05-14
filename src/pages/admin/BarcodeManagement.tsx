
import React, { useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import BarcodeScanner from '@/components/barcode/BarcodeScanner';
import { toast } from '@/hooks/use-toast';
import { ScanResponse } from '@/types/auth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import BarcodeGenerator from '@/components/barcode/BarcodeGenerator';
import { formatBarcodeForDisplay } from '@/utils/barcodeUtils';
import BarcodePreview from '@/components/barcode/BarcodePreview';
import BarcodePrinter from '@/components/barcode/BarcodePrinter';

const BarcodeManagementPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>("scan");
  const [lastScannedData, setLastScannedData] = useState<ScanResponse['data'] | null>(null);
  const [generatedBarcode, setGeneratedBarcode] = useState<string>("");
  const [selectedBarcodes, setSelectedBarcodes] = useState<string[]>([]);
  const [showPrinter, setShowPrinter] = useState(false);
  
  // For demo purposes only
  const mockBatchItems = generatedBarcode ? [
    {
      id: '1',
      barcode: generatedBarcode,
      quantity: 10,
      status: 'available',
      warehouses: { name: 'Main Warehouse' },
      locations: { floor: 1, zone: 'A' },
      color: 'Blue',
      size: 'Medium'
    }
  ] : [];
  
  const handleScanComplete = (data: ScanResponse['data']) => {
    setLastScannedData(data);
    toast({
      title: "Barcode Scanned",
      description: `Found: ${data.product.name}`
    });
  };
  
  const handleGenerateBarcode = (barcode: string) => {
    setGeneratedBarcode(barcode);
    setSelectedBarcodes([barcode]);
    toast({
      title: "Barcode Generated",
      description: `New barcode: ${barcode}`,
    });
  };
  
  const handlePrint = () => {
    if (selectedBarcodes.length === 0 && generatedBarcode) {
      setSelectedBarcodes([generatedBarcode]);
    }
    setShowPrinter(true);
  };
  
  return (
    <div className="container mx-auto p-6 space-y-6">
      <PageHeader 
        title="Barcode Management" 
        description="Generate, scan, and print barcodes"
      />

      <Tabs defaultValue="scan" onValueChange={(value) => setActiveTab(value)}>
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="scan">Scan Barcode</TabsTrigger>
          <TabsTrigger value="generate">Generate Barcode</TabsTrigger>
        </TabsList>
        
        <TabsContent value="scan" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Barcode Scanner</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <BarcodeScanner
                onScanComplete={handleScanComplete}
                allowCameraScanning={true}
                allowManualEntry={true}
                scanButtonLabel="Lookup"
              />
              
              {lastScannedData && (
                <div className="mt-8">
                  <h3 className="text-lg font-medium mb-2">Last Scanned Item</h3>
                  <div className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-xl font-semibold">{lastScannedData.product.name}</p>
                        <p className="text-sm text-gray-500">{lastScannedData.product.sku}</p>
                      </div>
                      <Badge>{lastScannedData.status}</Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div>
                        <p className="text-sm font-medium">Location</p>
                        <p>{lastScannedData.location.warehouse}, {lastScannedData.location.zone}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Quantity</p>
                        <p>{lastScannedData.box_quantity}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Barcode</p>
                        <p className="font-mono">{formatBarcodeForDisplay(lastScannedData.box_id)}</p>
                      </div>
                      {lastScannedData.attributes && (
                        <div>
                          <p className="text-sm font-medium">Attributes</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {lastScannedData.attributes.color && (
                              <Badge variant="outline">{lastScannedData.attributes.color}</Badge>
                            )}
                            {lastScannedData.attributes.size && (
                              <Badge variant="outline">{lastScannedData.attributes.size}</Badge>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="generate" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            <BarcodeGenerator 
              productName=""
              productSku=""
              category=""
              onGenerateBarcode={handleGenerateBarcode}
            />
            
            <Card>
              <CardHeader>
                <CardTitle>Preview</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center min-h-[300px]">
                {generatedBarcode ? (
                  <div className="text-center space-y-6">
                    <div className="border p-6 rounded-lg">
                      <BarcodePreview 
                        barcode={generatedBarcode} 
                        width={250}
                        height={100}
                        scale={3}
                      />
                      <p className="mt-2 font-mono text-sm">{formatBarcodeForDisplay(generatedBarcode)}</p>
                    </div>
                    <Button onClick={handlePrint} className="mt-4">
                      Print Barcode
                    </Button>
                  </div>
                ) : (
                  <div className="text-center text-gray-500">
                    <p>Generate a barcode to see the preview</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
      
      {showPrinter && (
        <BarcodePrinter
          open={showPrinter}
          onOpenChange={setShowPrinter}
          barcodes={selectedBarcodes}
          batchItems={mockBatchItems}
        />
      )}
    </div>
  );
};

export default BarcodeManagementPage;
