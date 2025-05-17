
import React, { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Barcode, Camera, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import CameraScanner from './CameraScanner';

// Import Quagga dynamically to avoid SSR issues
let Quagga: any = null;
if (typeof window !== 'undefined') {
  import('@ericblade/quagga2').then(module => {
    Quagga = module.default;
  }).catch(err => {
    console.error('Error loading Quagga2:', err);
  });
}

interface BarcodeScannerProps {
  onDetected?: (barcode: string) => void;
  onClose?: () => void;
  onScanComplete?: (data: any) => void;
  allowManualEntry?: boolean;
  allowCameraScanning?: boolean;
  scanButtonLabel?: string;
  inputValue?: string;
  onInputChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBarcodeScanned?: (barcode: string) => void;
  embedded?: boolean;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ 
  onDetected, 
  onClose,
  onScanComplete,
  allowManualEntry = false,
  allowCameraScanning = false,
  scanButtonLabel = "Scan",
  inputValue,
  onInputChange,
  onBarcodeScanned,
  embedded = false
}) => {
  const isInitialized = useRef(false);
  const [isOpen, setIsOpen] = useState(false);
  const [manualBarcode, setManualBarcode] = useState(inputValue || '');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Handle manual barcode input
  const handleManualBarcodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onInputChange) {
      onInputChange(e);
    } else {
      setManualBarcode(e.target.value);
    }
  };

  const handleSubmitManualBarcode = () => {
    const barcode = inputValue || manualBarcode;
    if (!barcode) return;
    
    if (onBarcodeScanned) {
      onBarcodeScanned(barcode);
    } else if (onDetected) {
      onDetected(barcode);
    } else if (onScanComplete) {
      // Simulate a scan response for demo purposes
      const demoResponse = {
        box_id: barcode,
        product: {
          name: barcode.startsWith('BC') ? 'Demo Product' : 'Unknown Product',
          sku: `SKU-${barcode.substring(0, 5)}`,
        },
        status: barcode === 'BC123456789' ? 'available' : (barcode === 'BC987654321' ? 'reserved' : 'unknown'),
        box_quantity: 10,
        location: {
          warehouse: 'Main Warehouse',
          zone: 'Zone A',
          floor: '1',
        },
        attributes: {
          color: 'Blue',
          size: 'Medium',
        },
      };
      onScanComplete(demoResponse);
    }

    if (!onInputChange) {
      setManualBarcode('');
    }
    
    if (onClose) {
      onClose();
    }
  };

  // Camera scanner setup
  const handleCameraButtonClick = () => {
    if (isCameraActive) {
      setIsCameraActive(false);
    } else {
      setIsOpen(true);
      setIsCameraActive(true);
    }
  };

  useEffect(() => {
    if (!isOpen || !isCameraActive || !allowCameraScanning || !Quagga) return;
    
    const initializeScanner = async () => {
      try {
        if (isInitialized.current) {
          Quagga.stop();
        }
        
        await Quagga.init({
          inputStream: {
            type: 'LiveStream',
            constraints: {
              facingMode: 'environment',
              width: { min: 450 },
              height: { min: 300 },
              aspectRatio: { min: 1, max: 2 }
            },
            target: videoRef.current as HTMLElement,
          },
          locator: {
            patchSize: 'medium',
            halfSample: true
          },
          numOfWorkers: navigator.hardwareConcurrency || 2,
          decoder: {
            readers: ['code_128_reader', 'ean_reader', 'ean_8_reader', 'code_39_reader', 'code_93_reader']
          },
          locate: true
        });

        isInitialized.current = true;
        Quagga.start();

        Quagga.onDetected((result: any) => {
          if (result && result.codeResult && result.codeResult.code) {
            const code = result.codeResult.code;
            console.log('Barcode detected:', code);
            
            if (onBarcodeScanned) {
              onBarcodeScanned(code);
            } else if (onDetected) {
              onDetected(code);
            } else if (onScanComplete) {
              // Simulate a scan response for demo
              const demoResponse = {
                box_id: code,
                product: {
                  name: code.startsWith('BC') ? 'Demo Product' : 'Unknown Product',
                  sku: `SKU-${code.substring(0, 5)}`,
                },
                status: code === 'BC123456789' ? 'available' : (code === 'BC987654321' ? 'reserved' : 'unknown'),
                box_quantity: 10,
                location: {
                  warehouse: 'Main Warehouse',
                  zone: 'Zone A',
                  floor: '1',
                },
                attributes: {
                  color: 'Blue',
                  size: 'Medium',
                },
              };
              onScanComplete(demoResponse);
            }
            
            setIsCameraActive(false);
            setIsOpen(false);
            setManualBarcode('');
            Quagga.stop();
          }
        });
      } catch (error) {
        console.error('Error initializing barcode scanner:', error);
      }
    };

    initializeScanner();

    return () => {
      if (Quagga) {
        try {
          Quagga.stop();
        } catch (e) {
          console.log('Error stopping Quagga:', e);
        }
      }
    };
  }, [isOpen, isCameraActive, allowCameraScanning, onDetected, onScanComplete, onBarcodeScanned]);

  // Dialog for camera scanning
  if (isOpen && isCameraActive && allowCameraScanning) {
    return (
      <Dialog open={isOpen} onOpenChange={() => {
        setIsOpen(false);
        setIsCameraActive(false);
        if (onClose) onClose();
      }}>
        <DialogContent className="w-full max-w-md p-0">
          <DialogHeader className="p-4 border-b">
            <DialogTitle className="flex items-center">
              <Barcode className="mr-2 h-5 w-5" />
              Scan Barcode
            </DialogTitle>
          </DialogHeader>
          
          <div className="p-4">
            <CameraScanner videoRef={videoRef} canvasRef={canvasRef} />
            
            <p className="text-center text-sm text-muted-foreground mt-4">
              Point your camera at a barcode to scan
            </p>
            
            <div className="mt-4 flex justify-center">
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsOpen(false);
                  setIsCameraActive(false);
                  if (onClose) onClose();
                }}
                className="flex items-center"
              >
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Main barcode scanner interface
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {allowManualEntry && (
          <div className="flex-1">
            <Input
              placeholder="Enter barcode"
              value={inputValue !== undefined ? inputValue : manualBarcode}
              onChange={handleManualBarcodeChange}
              className="flex-1"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSubmitManualBarcode();
                }
              }}
            />
          </div>
        )}
        
        <Button onClick={handleSubmitManualBarcode} type="button">
          {scanButtonLabel}
        </Button>
        
        {allowCameraScanning && (
          <Button
            variant="outline" 
            type="button" 
            onClick={handleCameraButtonClick}
            title="Use camera to scan"
          >
            <Camera className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};

export { BarcodeScanner };
export default BarcodeScanner;
