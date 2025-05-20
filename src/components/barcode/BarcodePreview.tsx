
import React from 'react';
import Barcode from 'react-barcode';

export interface BarcodePreviewProps {
  barcode: string;
  width?: number;
  height?: number;
  scale?: number;
  format?: string;
  displayValue?: boolean;
}

const BarcodePreview: React.FC<BarcodePreviewProps> = ({
  barcode,
  width,
  height = 80,
  scale = 2,
  format = 'CODE128',
  displayValue = true
}) => {
  return (
    <div className="flex justify-center align-middle">
      <Barcode
        value={barcode}
        width={width || scale}
        height={height}
        format={format}
        displayValue={displayValue}
        margin={0}
      />
    </div>
  );
};

export default BarcodePreview;
