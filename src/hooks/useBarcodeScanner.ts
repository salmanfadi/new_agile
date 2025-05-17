
import { useState, useCallback } from 'react';
import Quagga from 'quagga';

interface UseBarcodeScanner {
  onResult?: (result: any) => void;
  onError?: (error: any) => void;
}

export const useBarcodeScanner = ({ onResult, onError }: UseBarcodeScanner) => {
  const [isInitialized, setIsInitialized] = useState(false);
  
  const startScanning = useCallback(() => {
    try {
      if (isInitialized) {
        return;
      }

      Quagga.init(
        {
          inputStream: {
            name: "Live",
            type: "LiveStream",
            target: document.querySelector("#scanner-container"),
            constraints: {
              width: 480,
              height: 320,
              facingMode: "environment",
            },
          },
          locator: {
            patchSize: "medium",
            halfSample: true,
          },
          numOfWorkers: navigator.hardwareConcurrency || 4,
          decoder: {
            readers: ["code_128_reader", "ean_reader", "ean_8_reader", "code_39_reader", "code_93_reader", "upc_reader"],
          },
          locate: true,
        },
        (err: any) => {
          if (err) {
            console.error("Error initializing Quagga:", err);
            if (onError) onError(err);
            return;
          }
          
          console.log("Quagga initialized successfully");
          setIsInitialized(true);
          
          Quagga.start();
          
          Quagga.onDetected((result) => {
            if (onResult) {
              onResult(result);
            }
          });
        }
      );
    } catch (error) {
      console.error("Error in startScanning:", error);
      if (onError) onError(error);
    }
  }, [isInitialized, onResult, onError]);
  
  const stopScanning = useCallback(() => {
    if (isInitialized) {
      try {
        Quagga.stop();
        setIsInitialized(false);
        console.log("Barcode scanning stopped");
      } catch (error) {
        console.error("Error stopping Quagga:", error);
      }
    }
  }, [isInitialized]);
  
  return {
    startScanning,
    stopScanning,
    isInitialized,
  };
};
