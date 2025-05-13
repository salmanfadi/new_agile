export const validateStockInBox = (box: any): boolean => {
  const requiredFields = ['barcode', 'quantity', 'color', 'size', 'warehouse_id', 'location_id', 'product_id'];
  
  const missingFields = requiredFields.filter(field => !box[field]);
  
  if (missingFields.length > 0) {
    console.error('Missing required fields:', missingFields);
    return false;
  }
  
  // Additional validation
  if (!box.barcode?.trim()) {
    console.error('Invalid barcode:', box.barcode);
    return false;
  }
  
  if (typeof box.quantity !== 'number' || box.quantity <= 0) {
    console.error('Invalid quantity:', box.quantity);
    return false;
  }
  
  return true;
};

export const validateStockInRequest = (boxes: any[]): boolean => {
  if (!Array.isArray(boxes)) {
    console.error('Boxes must be an array');
    return false;
  }
  
  const invalidBoxes = boxes.filter(box => !validateStockInBox(box));
  
  if (invalidBoxes.length > 0) {
    console.error('Invalid boxes found:', invalidBoxes);
    return false;
  }
  
  return true;
};
