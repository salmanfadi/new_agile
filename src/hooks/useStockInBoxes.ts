import { useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid';

export interface BoxData {
  id: string;
  barcode: string;
  quantity: number;
  color: string;
  size: string;
  warehouse_id: string;
  location_id: string;
  product_id: string;
}

export interface StockInData {
  id: string;
  product?: { name: string; id?: string; sku?: string; };
  submitter: { 
    name: string; 
    username: string;
    id: string;
  } | null;
  boxes: number;
  status: "pending" | "approved" | "rejected" | "completed" | "processing";
  created_at: string;
  source: string;
  notes?: string;
  rejection_reason?: string;
}

export interface DefaultValues {
  warehouse: string;
  location: string;
  quantity: number;
  color: string;
  size: string;
}

const generateBarcode = (product?: { sku?: string; id?: string }, index?: number): string => {
  if (!product?.sku && !product?.id) {
    throw new Error('Product information is required for barcode generation');
  }

  // Use SKU if available, otherwise use product ID
  const productId = product.sku || product.id;
  
  // Generate a unique suffix using timestamp and random number
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  const uniqueSuffix = `${timestamp}${random}`;
  
  // Format: PRODID-INDEX-SUFFIX
  return `${productId}-${index?.toString().padStart(3, '0') || '001'}-${uniqueSuffix}`;
};

export const useStockInBoxes = (selectedStockIn: StockInData | null, open: boolean) => {
  const [boxesData, setBoxesData] = useState<BoxData[]>([]);
  const [defaultValues, setDefaultValues] = useState<DefaultValues>({
    warehouse: '',
    location: '',
    quantity: 0,
    color: '',
    size: '',
  });

  // Reset form when selectedStockIn changes
  useEffect(() => {
    if (selectedStockIn && open) {
      // Initialize with empty box entries for the number of boxes
      const initialBoxes = Array(selectedStockIn.boxes).fill(null).map((_, index) => ({
        id: `temp-${index}`,
        barcode: generateBarcode(selectedStockIn.product, index),
        quantity: 0,
        color: '',
        size: '',
        warehouse_id: '',
        location_id: '',
        product_id: selectedStockIn.product?.id || ''
      }));
      
      setBoxesData(initialBoxes);
      setDefaultValues({
        warehouse: '',
        location: '',
        quantity: 0,
        color: '',
        size: '',
      });
    }
  }, [selectedStockIn, open]);

  // Update a single box data
  const handleBoxUpdate = (index: number, field: keyof BoxData, value: string | number) => {
    const updatedBoxes = [...boxesData];
    updatedBoxes[index] = {
      ...updatedBoxes[index],
      [field]: value
    };
    setBoxesData(updatedBoxes);
  };

  // Apply default values to all boxes
  const applyDefaultsToAll = () => {
    if (!defaultValues.warehouse || !defaultValues.location) {
      toast({
        variant: 'destructive',
        title: 'Missing defaults',
        description: 'Please select a warehouse and location before applying to all boxes.',
      });
      return;
    }

    const updatedBoxes = boxesData.map(box => ({
      ...box,
      warehouse_id: defaultValues.warehouse,
      location_id: defaultValues.location,
      color: defaultValues.color || box.color,
      size: defaultValues.size || box.size,
      quantity: defaultValues.quantity > 0 ? defaultValues.quantity : box.quantity
    }));
    
    setBoxesData(updatedBoxes);
    
    toast({
      title: 'Defaults Applied',
      description: 'Default values have been applied to all boxes.',
    });
  };

  const isMissingRequiredData = () => {
    return boxesData.some(box => 
      !box.warehouse_id || 
      !box.location_id || 
      !box.barcode || 
      !box.product_id ||
      box.quantity <= 0
    );
  };

  return {
    boxesData,
    setBoxesData,
    defaultValues,
    setDefaultValues,
    handleBoxUpdate,
    applyDefaultsToAll,
    isMissingRequiredData
  };
};
