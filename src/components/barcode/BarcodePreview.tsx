
import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';

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
    if (canvasRef.current && barcode) {
      try {
        JsBarcode(canvasRef.current)
          .CODE128(barcode, {
            displayValue: includeText,
            fontSize: 14,
            margin: 10,
            width: scale,
            height: 10,
            textMargin: 5
          })
          .render();
      } catch (error) {
        console.error('Error generating barcode:', error);
      }
    }
  }, [barcode, includeText, scale]);

  return (
    <div className="barcode-preview">
      <canvas ref={canvasRef} width={width} height={height} />
    </div>
  );
};

export const getBarcodeCanvas = async (barcode: string, width: number, height: number, scale: number): Promise<HTMLCanvasElement> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    
    try {
      JsBarcode(canvas)
        .CODE128(barcode, {
          displayValue: true,
          fontSize: 14,
          margin: 10,
          width: scale,
          height: 10,
          textMargin: 5
        })
        .render();
      resolve(canvas);
    } catch (error) {
      reject(error);
    }
  });
};

export default BarcodePreview;
