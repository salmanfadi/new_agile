
import React, { useEffect, useRef } from 'react';
import Quagga from '@ericblade/quagga2';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Barcode, X } from 'lucide-react';

interface BarcodeScannerProps {
  onDetected: (barcode: string) => void;
  onClose: () => void;
}

export const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onDetected, onClose }) => {
  const isInitialized = useRef(false);

  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;

    const initializeScanner = async () => {
      try {
        await Quagga.init({
          inputStream: {
            type: 'LiveStream',
            constraints: {
              facingMode: 'environment',
              width: { min: 450 },
              height: { min: 300 },
              aspectRatio: { min: 1, max: 2 }
            },
            target: '#scanner-container',
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

        Quagga.start();

        Quagga.onDetected((result) => {
          if (result && result.codeResult && result.codeResult.code) {
            const code = result.codeResult.code;
            console.log('Barcode detected:', code);
            onDetected(code);
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
  }, [onDetected]);

  return (
    <Dialog open={true} onOpenChange={() => onClose()}>
      <DialogContent className="w-full max-w-md p-0">
        <DialogHeader className="p-4 border-b">
          <DialogTitle className="flex items-center">
            <Barcode className="mr-2 h-5 w-5" />
            Scan Barcode
          </DialogTitle>
        </DialogHeader>
        
        <div className="p-4">
          <div id="scanner-container" className="relative overflow-hidden bg-black rounded-md aspect-video">
            <div className="absolute inset-0 border-2 border-dashed border-primary opacity-70 pointer-events-none"></div>
          </div>
          
          <p className="text-center text-sm text-muted-foreground mt-4">
            Point your camera at a barcode to scan
          </p>
          
          <div className="mt-4 flex justify-center">
            <Button 
              variant="outline" 
              onClick={onClose}
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
};
