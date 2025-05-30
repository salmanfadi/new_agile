
import React, { useEffect, useRef } from 'react';
import bwipjs from 'bwip-js';

interface BarcodePreviewProps {
  barcode: string;
  width?: number;
  height?: number;
  includeText?: boolean;
  scale?: number;
  className?: string;
}

const BarcodePreview: React.FC<BarcodePreviewProps> = (props) => {
  const { 
    barcode, 
    width = 200, 
    height = 80,
    includeText = true,
    scale = 2,
    className = ''
  } = props;
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current && barcode && barcode.trim() !== '') {
      try {
        // Generate CODE128 barcode
        bwipjs.toCanvas(canvasRef.current, {
          bcid: 'code128',  // Barcode type
          text: barcode,    // Barcode data
          scale,            // Scaling factor for clarity
          height: 10,       // Height of barcode in mm
          includetext: includeText, // Include human-readable text
          textxalign: 'center', // Center-align the text
        });
      } catch (error) {
        console.error('Error generating barcode:', error);
      }
    }
  }, [barcode, includeText, scale]);

  // If no barcode is provided, display a placeholder
  if (!barcode || barcode.trim() === '') {
    return (
      <div className={`barcode-preview flex items-center justify-center h-[${height}px] bg-muted/20 text-muted-foreground rounded-md border border-dashed ${className}`}>
        <span className="text-sm">No barcode available</span>
      </div>
    );
  }

  return (
    <div className={`barcode-preview ${className}`}>
      <canvas 
        ref={canvasRef} 
        width={width} 
        height={height}
        aria-label={`Barcode: ${barcode}`}
        className="max-w-full h-auto"
      />
    </div>
  );
};

export default BarcodePreview;
