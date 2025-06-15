
import React from 'react';
import { Product } from '@/types/database';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

interface ProductBarcodeFormProps {
  formData: Partial<Product>;
  isSubmitting: boolean;
  onChange: (field: keyof Product, value: any) => void;
}

export const ProductBarcodeForm: React.FC<ProductBarcodeFormProps> = ({
  formData,
  isSubmitting,
  onChange,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="barcode">Barcode</Label>
        <Input
          id="barcode"
          value={formData.barcode || ''}
          onChange={(e) => onChange('barcode', e.target.value)}
          placeholder="Enter barcode"
          disabled={isSubmitting}
        />
      </div>
      
      <div className="flex items-center space-x-2">
        <Switch
          id="is_active"
          checked={formData.is_active ?? true}
          onCheckedChange={(checked) => onChange('is_active', checked)}
          disabled={isSubmitting}
        />
        <Label htmlFor="is_active">Active</Label>
      </div>
    </div>
  );
};
