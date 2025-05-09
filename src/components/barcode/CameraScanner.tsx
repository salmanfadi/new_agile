
import React from 'react';

interface CameraScannerProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
}

const CameraScanner: React.FC<CameraScannerProps> = ({ videoRef, canvasRef }) => {
  return (
    <div className="border rounded-md p-4 bg-muted relative h-[200px] flex items-center justify-center overflow-hidden">
      <video 
        ref={videoRef} 
        className="absolute inset-0 w-full h-full object-cover"
        playsInline
        muted
      />
      <canvas 
        ref={canvasRef} 
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="border-2 border-primary w-3/4 h-1/2 max-w-48 rounded-md"></div>
      </div>
      <p className="absolute bottom-2 text-center text-white text-xs bg-black/50 px-2 py-1 rounded">
        Position barcode in frame
      </p>
    </div>
  );
};

export default CameraScanner;
