
import React, { useEffect, useRef } from 'react';
import bwipjs from 'bwip-js';

interface BarcodePreviewProps {
  barcode: string;
  width?: number;
  height?: number;
  includeText?: boolean;
  scale?: number;
}

const BarcodePreview: React.FC<BarcodePreviewProps> = ({ 
  barcode, 
  width = 150, 
  height = 50,
  includeText = true,
  scale = 2
}) => {
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
      <div className="barcode-preview flex items-center justify-center h-[50px] bg-gray-100 text-gray-500 rounded border border-dashed border-gray-300">
        No barcode
      </div>
    );
  }

  return (
    <div className="barcode-preview">
      <canvas ref={canvasRef} width={width} height={height} />
    </div>
  );
};

export default BarcodePreview;
