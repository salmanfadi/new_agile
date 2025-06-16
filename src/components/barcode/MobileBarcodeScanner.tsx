import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Camera, X, ScanLine } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface MobileBarcodeScannerProps {
  onBarcodeScanned: (barcode: string) => void;
  allowManualEntry?: boolean;
  inputValue?: string;
  onInputChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  scanButtonLabel?: string;
}

const MobileBarcodeScanner: React.FC<MobileBarcodeScannerProps> = ({
  onBarcodeScanned,
  allowManualEntry = true,
  inputValue = '',
  onInputChange,
  scanButtonLabel = 'Scan',
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [manualInput, setManualInput] = useState(inputValue);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [supportsCamera, setSupportsCamera] = useState(false);
  const [cameraError, setCameraError] = useState<string>('');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();

  // Check for camera support on component mount
  useEffect(() => {
    const checkCameraSupport = async () => {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          setSupportsCamera(false);
          setCameraError('Camera not supported in this browser');
          return;
        }

        // Check for camera permission
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        
        if (videoDevices.length === 0) {
          setSupportsCamera(false);
          setCameraError('No camera found on device');
          return;
        }

        setSupportsCamera(true);
      } catch (error) {
        console.error('Error checking camera support:', error);
        setSupportsCamera(false);
        setCameraError('Camera access not available');
      }
    };

    checkCameraSupport();
  }, []);

  // Enhanced barcode detection for mobile
  const detectBarcode = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !isScanning) {
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context || video.readyState !== video.HAVE_ENOUGH_DATA) {
      animationFrameRef.current = requestAnimationFrame(detectBarcode);
      return;
    }

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Try to detect barcode using native BarcodeDetector if available
    if ('BarcodeDetector' in window) {
      const barcodeDetector = new (window as any).BarcodeDetector({
        formats: ['qr_code', 'code_128', 'ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_39', 'code_93']
      });

      barcodeDetector.detect(canvas)
        .then((barcodes: any[]) => {
          if (barcodes.length > 0 && isScanning) {
            const barcode = barcodes[0].rawValue;
            console.log('Barcode detected:', barcode);
            onBarcodeScanned(barcode);
            stopCamera();
            return;
          }
          
          // Continue scanning
          if (isScanning) {
            animationFrameRef.current = requestAnimationFrame(detectBarcode);
          }
        })
        .catch((error: any) => {
          console.error('Barcode detection error:', error);
          if (isScanning) {
            animationFrameRef.current = requestAnimationFrame(detectBarcode);
          }
        });
    } else {
      // Fallback: continue scanning without detection
      if (isScanning) {
        animationFrameRef.current = requestAnimationFrame(detectBarcode);
      }
    }
  }, [isScanning, onBarcodeScanned]);

  const startScanning = useCallback(() => {
    if (!videoRef.current) return;
    
    console.log('Starting barcode scanning...');
    setIsScanning(true);
    animationFrameRef.current = requestAnimationFrame(detectBarcode);
  }, [detectBarcode]);

  // Enhanced camera initialization with relaxed constraints
  const initializeCamera = useCallback(async () => {
    try {
      setCameraError('');
      console.log('Starting camera initialization...');
      
      // Stop any existing stream
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      // Relaxed constraints - remove width and height constraints
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: 'environment' // Use rear camera only
        },
        audio: false
      };

      console.log('Requesting camera with relaxed constraints:', constraints);
      
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('Camera stream obtained successfully:', mediaStream);
      
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        
        // Enhanced video setup for mobile devices
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.setAttribute('webkit-playsinline', 'true');
        videoRef.current.muted = true;
        videoRef.current.autoplay = true;
        
        // Wait for video to be ready with better error handling
        await new Promise((resolve, reject) => {
          if (!videoRef.current) {
            reject(new Error('Video ref not available'));
            return;
          }
          
          const video = videoRef.current;
          
          const handleLoadedMetadata = () => {
            console.log('Video metadata loaded, dimensions:', video.videoWidth, 'x', video.videoHeight);
            video.removeEventListener('loadedmetadata', handleLoadedMetadata);
            video.removeEventListener('error', handleError);
            resolve(true);
          };
          
          const handleError = (error: Event) => {
            console.error('Video error:', error);
            video.removeEventListener('loadedmetadata', handleLoadedMetadata);
            video.removeEventListener('error', handleError);
            reject(error);
          };
          
          video.addEventListener('loadedmetadata', handleLoadedMetadata);
          video.addEventListener('error', handleError);
          
          // Start playing
          const playPromise = video.play();
          if (playPromise !== undefined) {
            playPromise.catch(reject);
          }
        });

        // Start scanning after video is ready
        startScanning();
        console.log('Camera initialization completed successfully');
      }
    } catch (error: any) {
      console.error('Camera initialization failed:', error);
      let errorMessage = 'Failed to access camera';
      
      if (error.name === 'NotAllowedError') {
        errorMessage = 'Camera permission denied. Please allow camera access and try again.';
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'No camera found on this device.';
      } else if (error.name === 'NotReadableError') {
        errorMessage = 'Camera is being used by another application.';
      } else if (error.name === 'OverconstrainedError') {
        errorMessage = 'Camera settings not supported by this device.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setCameraError(errorMessage);
      setIsScanning(false);
      
      toast({
        variant: 'destructive',
        title: 'Camera Error',
        description: errorMessage,
      });
    }
  }, [stream, startScanning]);

  const stopCamera = useCallback(() => {
    console.log('Stopping camera...');
    setIsScanning(false);
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    if (stream) {
      stream.getTracks().forEach(track => {
        console.log('Stopping track:', track.kind);
        track.stop();
      });
      setStream(null);
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, [stream]);

  const handleStartCamera = () => {
    if (!supportsCamera) {
      toast({
        variant: 'destructive',
        title: 'Camera Not Available',
        description: 'Camera is not supported on this device or browser.',
      });
      return;
    }
    
    console.log('User clicked start camera button');
    initializeCamera();
  };

  const handleManualSubmit = () => {
    if (manualInput.trim()) {
      onBarcodeScanned(manualInput.trim());
      setManualInput('');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setManualInput(value);
    if (onInputChange) {
      onInputChange(e);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return (
    <div className="space-y-4">
      {/* Camera Scanner */}
      {supportsCamera && (
        <div className="space-y-2">
          <Label>Camera Scanner</Label>
          {!isScanning ? (
            <div className="text-center">
              <Button 
                onClick={handleStartCamera}
                disabled={!!cameraError}
                className="w-full"
              >
                <Camera className="h-4 w-4 mr-2" />
                Start Camera
              </Button>
              {cameraError && (
                <p className="text-sm text-red-500 mt-2">{cameraError}</p>
              )}
            </div>
          ) : (
            <div className="relative">
              <div className="relative bg-black rounded-lg overflow-hidden" style={{ aspectRatio: '4/3' }}>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                  style={{ transform: 'scaleX(-1)' }}
                />
                <canvas ref={canvasRef} className="hidden" />
                
                {/* Scanning overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="border-2 border-white w-64 h-32 rounded-lg relative">
                    <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-blue-500 rounded-tl-lg"></div>
                    <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-blue-500 rounded-tr-lg"></div>
                    <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-blue-500 rounded-bl-lg"></div>
                    <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-blue-500 rounded-br-lg"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <ScanLine className="h-8 w-8 text-blue-500 animate-pulse" />
                    </div>
                  </div>
                </div>
                
                {/* Instructions */}
                <div className="absolute bottom-4 left-0 right-0 text-center">
                  <p className="text-white text-sm bg-black/50 px-3 py-1 rounded-full inline-block">
                    Position barcode within the frame
                  </p>
                </div>
              </div>
              
              <Button 
                onClick={stopCamera}
                variant="destructive"
                className="w-full mt-2"
              >
                <X className="h-4 w-4 mr-2" />
                Stop Camera
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Manual Entry */}
      {allowManualEntry && (
        <div className="space-y-2">
          <Label htmlFor="manual-barcode">Manual Entry</Label>
          <div className="flex space-x-2">
            <Input
              id="manual-barcode"
              type="text"
              value={manualInput}
              onChange={handleInputChange}
              placeholder="Enter barcode manually"
              className="flex-1"
            />
            <Button 
              onClick={handleManualSubmit}
              disabled={!manualInput.trim()}
            >
              {scanButtonLabel}
            </Button>
          </div>
        </div>
      )}

      {/* Device Info for Debugging */}
      {process.env.NODE_ENV === 'development' && (
        <div className="text-xs text-gray-500 p-2 bg-gray-50 rounded">
          <p>Camera Support: {supportsCamera ? 'Yes' : 'No'}</p>
          <p>User Agent: {navigator.userAgent.substring(0, 50)}...</p>
          <p>BarcodeDetector: {'BarcodeDetector' in window ? 'Available' : 'Not Available'}</p>
          <p>Video State: {isScanning ? 'Scanning' : 'Stopped'}</p>
          <p>Stream Active: {stream ? 'Yes' : 'No'}</p>
        </div>
      )}
    </div>
  );
};

export default MobileBarcodeScanner;