
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription,
  CardFooter
} from '@/components/ui/card';
import { Input } from '@/components/ui/input'; 
import { Button } from '@/components/ui/button';
import { Barcode, Search, Camera, X } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

// Types for the barcode scanner response
export interface ScanResponse {
  status: 'success' | 'error';
  data?: {
    box_id: string;
    product: {
      id: string;
      name: string;
      sku: string;
      description?: string;
    };
    box_quantity: number;
    total_product_quantity?: number;
    location?: {
      warehouse: string;
      zone: string;
      position: string;
    };
    status: 'available' | 'reserved' | 'in-transit';
    attributes?: Record<string, string>;
    history?: Array<{
      action: string;
      timestamp: string;
      user: string;
    }>;
  };
  error?: string;
}

export interface BarcodeScannerProps {
  onScanComplete?: (data: ScanResponse['data']) => void;
  embedded?: boolean;
  allowManualEntry?: boolean;
  allowCameraScanning?: boolean;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({
  onScanComplete,
  embedded = false,
  allowManualEntry = true,
  allowCameraScanning = true,
}) => {
  const [barcode, setBarcode] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanData, setScanData] = useState<ScanResponse['data'] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const barcodeBuffer = useRef('');
  const lastScanTime = useRef<number>(0);
  
  const { user } = useAuth();
  const { toast } = useToast();

  // Process barcode scan
  const processScan = useCallback(async (scannedBarcode: string) => {
    if (!scannedBarcode || scannedBarcode.length < 8) {
      setError('Invalid barcode format');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Call the API to get barcode information
      const { data, error } = await supabase.functions.invoke('scan-barcode', {
        body: {
          barcode: scannedBarcode,
          user_id: user?.id,
          role: user?.role
        }
      });
      
      if (error) {
        throw new Error(error.message);
      }
      
      const response = data as ScanResponse;
      
      if (response.status === 'error' || !response.data) {
        setError(response.error || 'Failed to retrieve product information');
        toast({
          variant: 'destructive',
          title: 'Scan Failed',
          description: response.error || 'Failed to retrieve product information',
        });
      } else {
        setScanData(response.data);
        if (onScanComplete) {
          onScanComplete(response.data);
        }
        toast({
          title: 'Barcode Scanned',
          description: `Found ${response.data.product.name}`,
        });
      }
    } catch (err) {
      console.error('Scan error:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      toast({
        variant: 'destructive',
        title: 'Scan Error',
        description: err instanceof Error ? err.message : 'Failed to process barcode scan',
      });
    } finally {
      setLoading(false);
      setBarcode('');
    }
  }, [user, toast, onScanComplete]);

  // Handle hardware scanner input
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only process if we're in scanning mode or the input is focused
      if (!isScanning && document.activeElement !== inputRef.current) {
        return;
      }
      
      const currentTime = new Date().getTime();
      
      // Reset buffer if there's been a pause (hardware scanners are typically fast)
      if (currentTime - lastScanTime.current > 500) {
        barcodeBuffer.current = '';
      }
      
      lastScanTime.current = currentTime;
      
      // Check if it's the Enter key (typically sent by scanner after complete scan)
      if (event.key === 'Enter') {
        event.preventDefault();
        const scannedCode = barcodeBuffer.current.trim();
        if (scannedCode) {
          processScan(scannedCode);
          barcodeBuffer.current = '';
        }
      } else if (/^[0-9a-zA-Z-_]$/.test(event.key)) {
        // Only accept alphanumeric characters, hyphens, and underscores
        barcodeBuffer.current += event.key;
      }
    };
    
    // Listen for key events during scanning
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isScanning, processScan]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (barcode) {
      processScan(barcode);
    }
  };

  const toggleScanner = () => {
    setIsScanning(!isScanning);
    if (!isScanning) {
      // Focus on the input when scanner is activated
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 100);
    }
  };

  const toggleCamera = () => {
    // This would integrate with a camera scanning library
    // For now just toggle the state to show we would activate camera
    setIsCameraActive(!isCameraActive);
    // In a real implementation, would initialize camera scanning here
  };

  const resetScan = () => {
    setScanData(null);
    setError(null);
    setBarcode('');
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <Card className={embedded ? 'border-dashed border-2' : ''}>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Barcode className="mr-2 h-5 w-5" />
          Barcode Scanner
        </CardTitle>
        <CardDescription>
          {isScanning 
            ? 'Ready to scan. Use a barcode scanner or enter manually.' 
            : 'Click Start Scanning to begin.'}
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {isScanning && (
          <form onSubmit={handleManualSubmit} className="space-y-4">
            <div className="flex space-x-2">
              <Input
                ref={inputRef}
                type="text"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                placeholder="Scan or enter barcode"
                className="flex-1"
                autoFocus
                disabled={loading}
              />
              
              {allowManualEntry && (
                <Button type="submit" disabled={!barcode || loading}>
                  <Search className="h-4 w-4 mr-2" />
                  {loading ? 'Searching...' : 'Search'}
                </Button>
              )}
              
              {allowCameraScanning && (
                <Button 
                  type="button" 
                  variant={isCameraActive ? "destructive" : "secondary"}
                  onClick={toggleCamera}
                >
                  <Camera className="h-4 w-4" />
                </Button>
              )}
            </div>
            
            {isCameraActive && (
              <div className="border rounded-md p-4 bg-muted h-[200px] flex items-center justify-center">
                <p className="text-center text-muted-foreground">
                  Camera scanning would be implemented here with a library like
                  QuaggaJS or HTML5 Barcode Detection API
                </p>
              </div>
            )}
            
            {error && (
              <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm">
                {error}
              </div>
            )}
          </form>
        )}
        
        {scanData && (
          <div className="mt-4 space-y-4">
            <div className="bg-primary/10 p-4 rounded-md">
              <h3 className="font-medium text-lg">{scanData.product.name}</h3>
              <p className="text-sm text-muted-foreground">SKU: {scanData.product.sku}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium">Box ID</p>
                <p className="text-sm text-muted-foreground">{scanData.box_id}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium">Box Quantity</p>
                <p className="text-sm text-muted-foreground">{scanData.box_quantity}</p>
              </div>
              
              {scanData.total_product_quantity !== undefined && (
                <div>
                  <p className="text-sm font-medium">Total Product Stock</p>
                  <p className="text-sm text-muted-foreground">{scanData.total_product_quantity}</p>
                </div>
              )}
              
              {scanData.location && (
                <div>
                  <p className="text-sm font-medium">Location</p>
                  <p className="text-sm text-muted-foreground">
                    {`${scanData.location.warehouse} / ${scanData.location.zone}`}
                  </p>
                </div>
              )}
              
              <div>
                <p className="text-sm font-medium">Status</p>
                <p className={`text-sm ${
                  scanData.status === 'available' 
                    ? 'text-green-600' 
                    : scanData.status === 'reserved' 
                      ? 'text-amber-600' 
                      : 'text-blue-600'
                }`}>
                  {scanData.status.charAt(0).toUpperCase() + scanData.status.slice(1)}
                </p>
              </div>
            </div>
            
            {scanData.attributes && Object.keys(scanData.attributes).length > 0 && (
              <div>
                <p className="text-sm font-medium mb-1">Attributes</p>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(scanData.attributes).map(([key, value]) => (
                    <div key={key} className="text-xs">
                      <span className="font-medium">{key}: </span>
                      <span className="text-muted-foreground">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {scanData.history && scanData.history.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-1">Recent Activity</p>
                <div className="text-xs space-y-1 max-h-[100px] overflow-y-auto">
                  {scanData.history.map((item, index) => (
                    <div key={index} className="flex justify-between">
                      <span>{item.action}</span>
                      <span className="text-muted-foreground">{item.timestamp}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        
        {loading && (
          <div className="space-y-3 mt-4">
            <Skeleton className="h-[28px] w-full" />
            <Skeleton className="h-[20px] w-3/4" />
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-[40px]" />
              <Skeleton className="h-[40px]" /> 
            </div>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <Button 
          variant={isScanning ? "outline" : "default"}
          onClick={toggleScanner}
        >
          {isScanning ? 'Stop Scanning' : 'Start Scanning'}
        </Button>
        
        {scanData && (
          <Button variant="secondary" onClick={resetScan}>
            <X className="h-4 w-4 mr-2" />
            Clear
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default BarcodeScanner;
