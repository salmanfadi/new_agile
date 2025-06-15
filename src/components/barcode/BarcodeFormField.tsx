import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Printer, Download } from 'lucide-react';
import Barcode from 'react-barcode';
import html2canvas from 'html2canvas';
import { saveAs } from 'file-saver';

interface BarcodeFormFieldProps {
  label: string;
  value: string;
  className?: string;
  onPrint?: () => void;
  onDownload?: () => void;
}

export const BarcodeFormField: React.FC<BarcodeFormFieldProps> = ({
  label,
  value,
  className = '',
  onPrint,
  onDownload,
}) => {
  const barcodeRef = useRef<HTMLDivElement>(null);

  const handleDownload = async () => {
    if (onDownload) {
      onDownload();
      return;
    }

    if (!barcodeRef.current) return;
    
    try {
      const canvas = await html2canvas(barcodeRef.current);
      canvas.toBlob((blob) => {
        if (blob) {
          saveAs(blob, `barcode-${value}.png`);
        }
      });
    } catch (error) {
      console.error('Error generating barcode image:', error);
    }
  };

  const handlePrint = () => {
    if (onPrint) {
      onPrint();
      return;
    }
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Print Barcode</title>
            <style>
              @page { size: auto; margin: 0; }
              body { padding: 20px; }
              .barcode-container { 
                text-align: center;
                padding: 20px;
                border: 1px solid #e2e8f0;
                border-radius: 8px;
                max-width: 300px;
                margin: 0 auto;
              }
              .barcode-value {
                margin-top: 10px;
                font-family: monospace;
                font-size: 14px;
                letter-spacing: 2px;
              }
            </style>
          </head>
          <body>
            <div class="barcode-container">
              <svg width="200" height="80" viewBox="0 0 200 80" xmlns="http://www.w3.org/2000/svg">
                ${document.querySelector('.barcode-svg')?.innerHTML}
              </svg>
              <div class="barcode-value">${formatBarcode(value)}</div>
            </div>
            <script>window.onload = () => window.print();</script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  // Format barcode with spaces for better readability (12-8 format)
  const formatBarcode = (code: string) => {
    if (!code) return '';
    // Format as 12-8 if it's a 20-digit number, otherwise return as is
    return code.length === 20 && /^\d+$/.test(code)
      ? `${code.substring(0, 12)} ${code.substring(12)}`
      : code;
  };

  return (
    <div className={`grid grid-cols-1 gap-2 ${className}`}>
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        <div className="flex space-x-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 px-2"
            onClick={handleDownload}
            title="Download Barcode"
          >
            <Download className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 px-2"
            onClick={handlePrint}
            title="Print Barcode"
          >
            <Printer className="w-4 h-4" />
          </Button>
        </div>
      </div>
      
      <div 
        ref={barcodeRef}
        className="p-3 border rounded-md bg-white flex flex-col items-center justify-center"
        style={{ minHeight: '100px' }}
      >
        <div className="barcode-svg">
          <Barcode
            value={value}
            format="CODE128"
            width={2}
            height={60}
            displayValue={false}
          />
        </div>
        <div className="mt-2 text-sm font-mono">
          {formatBarcode(value)}
        </div>
      </div>
    </div>
  );
};

export default BarcodeFormField;
