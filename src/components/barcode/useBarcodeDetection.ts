
import { useCallback, useRef, useState } from 'react';
import Quagga from 'quagga';

interface UseBarcodeDetectionProps {
  processScan: (barcode: string) => Promise<void>;
  isCameraActive: boolean;
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
}

export function useBarcodeDetection({
  processScan,
  isCameraActive,
  videoRef,
  canvasRef
}: UseBarcodeDetectionProps) {
  const streamRef = useRef<MediaStream | null>(null);
  const quaggaInitializedRef = useRef<boolean>(false);

  // Initialize HTML5 Barcode Detection API if supported
  const initBarcodeDetection = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    try {
      // Check if the BarcodeDetector API is available
      if ('BarcodeDetector' in window) {
        const barcodeDetector = new (window as any).BarcodeDetector({
          formats: ['qr_code', 'code_128', 'ean_13', 'ean_8', 'upc_a', 'upc_e']
        });
        
        // Access the camera stream
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });
        
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        
        // Set up the scanning loop
        const scanLoop = async () => {
          if (!isCameraActive || !videoRef.current || !canvasRef.current) return;
          
          try {
            // Detect barcodes in the video stream
            const barcodes = await barcodeDetector.detect(videoRef.current);
            
            if (barcodes.length > 0) {
              // We found a barcode
              const barcode = barcodes[0].rawValue;
              await processScan(barcode);
            }
          } catch (err) {
            console.error("Barcode detection error:", err);
          }
          
          // Continue scanning
          if (isCameraActive) {
            requestAnimationFrame(scanLoop);
          }
        };
        
        // Start the scanning loop
        scanLoop();
      } else {
        // Fallback to QuaggaJS if BarcodeDetector is not supported
        initQuagga();
      }
    } catch (error) {
      console.error("Camera initialization error:", error);
      
      // Fallback to QuaggaJS if camera access fails
      initQuagga();
    }
  }, [isCameraActive, processScan, videoRef, canvasRef]);

  // Initialize QuaggaJS as fallback
  const initQuagga = useCallback(() => {
    if (!canvasRef.current) return;
    
    Quagga.init({
      inputStream: {
        name: "Live",
        type: "LiveStream",
        target: canvasRef.current,
        constraints: {
          facingMode: "environment"
        }
      },
      decoder: {
        readers: ["code_128_reader", "ean_reader", "ean_8_reader", "code_39_reader", "upc_reader"]
      }
    }, (err) => {
      if (err) {
        console.error("QuaggaJS initialization error:", err);
        return;
      }
      
      // Start QuaggaJS
      Quagga.start();
      quaggaInitializedRef.current = true;
      
      // Listen for detected barcodes
      Quagga.onDetected((result) => {
        if (!isCameraActive) return;
        
        const code = result.codeResult.code;
        if (code) {
          quaggaInitializedRef.current = false;
          Quagga.stop();
          processScan(code);
        }
      });
    });
  }, [isCameraActive, processScan, canvasRef]);

  // Clean up resources
  const cleanupResources = useCallback(() => {
    // Clean up camera resources
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    // Only stop QuaggaJS if it was initialized
    if (quaggaInitializedRef.current) {
      Quagga.stop();
      quaggaInitializedRef.current = false;
    }
  }, []);

  return {
    initBarcodeDetection,
    cleanupResources,
    streamRef,
    quaggaInitializedRef
  };
}
