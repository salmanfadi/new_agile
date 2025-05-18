
import React from 'react';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import { BoxData } from '@/hooks/useStockInBoxes';

interface BarcodePrinterProps {
  barcodes: string[];
  boxesData: BoxData[];
  productName?: string;
  stockInId?: string;
}

const BarcodePrinter: React.FC<BarcodePrinterProps> = ({
  barcodes,
  boxesData,
  productName = 'Item',
  stockInId = '',
}) => {
  // Generate print document with barcodes
  const printBarcodes = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    // Generate HTML for printing
    printWindow.document.write(`
      <html>
        <head>
          <title>Barcodes for ${productName}</title>
          <style>
            @page {
              size: A4;
              margin: 0.5cm;
            }
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 0;
            }
            .header {
              text-align: center;
              margin-bottom: 15px;
              padding: 5px;
              border-bottom: 1px solid #ccc;
            }
            .barcode-container {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 0.5cm;
              page-break-inside: avoid;
            }
            .barcode-item {
              border: 1px solid #ddd;
              padding: 10px;
              text-align: center;
              margin-bottom: 10px;
            }
            .barcode {
              height: 60px;
              margin: 10px 0;
              background-repeat: no-repeat;
              background-position: center;
              background-size: contain;
            }
            .product-name {
              font-weight: bold;
              margin-bottom: 5px;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            }
            .barcode-value {
              font-family: monospace;
              font-size: 10px;
              margin-bottom: 5px;
            }
            .box-details {
              font-size: 10px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>${productName}</h2>
            <div>Stock In: ${stockInId}</div>
            <div>Print Date: ${new Date().toLocaleDateString()}</div>
          </div>
          <div class="barcode-container">
            ${barcodes.map(barcode => {
              const box = boxesData.find(b => b.barcode === barcode);
              const boxIndex = boxesData.findIndex(b => b.barcode === barcode);
              
              if (!box) return '';
              
              return `
                <div class="barcode-item">
                  <div class="product-name">${productName} - Box #${boxIndex + 1}</div>
                  <div class="barcode" style="background-image: url('data:image/svg+xml;base64,${btoa(`
                    <svg xmlns="http://www.w3.org/2000/svg" width="200" height="50">
                      ${Array.from({length: 40}, (_, i) => 
                        `<rect x="${i * 5}" y="0" width="${Math.random() > 0.5 ? 3 : 2}" height="50" fill="black" />`
                      ).join('')}
                    </svg>
                  `)}')"></div>
                  <div class="barcode-value">${barcode}</div>
                  <div class="box-details">
                    Qty: ${box?.quantity || 0}
                    ${box?.color ? ` • Color: ${box.color}` : ''}
                    ${box?.size ? ` • Size: ${box.size}` : ''}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    
    printWindow.document.close();
  };

  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={printBarcodes}
      disabled={barcodes.length === 0}
      className="flex items-center gap-2"
    >
      <Printer className="h-4 w-4" />
      Print {barcodes.length} Barcodes
    </Button>
  );
};

export default BarcodePrinter;
