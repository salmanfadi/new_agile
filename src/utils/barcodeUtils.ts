
/**
 * Generates a globally unique barcode string in the format CAT-PROD-BOX-UID
 * 
 * @param category - Product category abbreviation (e.g., ELEC for Electronics)
 * @param sku - Product SKU or identifier
 * @param boxNumber - Sequential number for the box
 * @returns Formatted barcode string
 */
export const generateBarcodeString = (
  category: string,
  sku: string,
  boxNumber: number
): string => {
  // Create category abbreviation (up to 4 chars)
  const categoryAbbrev = category
    .split(/\s+/)
    .map(word => word.substring(0, 2).toUpperCase())
    .join('')
    .substring(0, 4);
    
  // Format box number with leading zeros (001, 002, etc.)
  const boxStr = boxNumber.toString().padStart(3, '0');
  
  // Generate a more unique identifier:
  // 1. Use timestamp for time-based uniqueness
  const timestamp = Date.now().toString(36);
  
  // 2. Add random component for collision prevention
  const randomPart = Math.random().toString(36).substring(2, 6);
  
  // 3. Combine them for a truly unique ID
  const uniqueId = `${timestamp.substring(timestamp.length - 4)}${randomPart}`;
  
  // Combine all parts
  return `${categoryAbbrev}-${sku}-${boxStr}-${uniqueId}`;
};

/**
 * Extracts information from a barcode string
 * 
 * @param barcode - Barcode string in format CAT-PROD-BOX-UID
 * @returns Object with category abbreviation, product code, and box number
 */
export const parseBarcodeString = (barcode: string): { 
  categoryAbbrev: string;
  productCode: string; 
  boxNumber: number;
  uniqueId?: string;
} | null => {
  const parts = barcode.split('-');
  
  if (parts.length < 3) {
    return null;
  }
  
  return {
    categoryAbbrev: parts[0],
    productCode: parts[1],
    boxNumber: parseInt(parts[2], 10),
    uniqueId: parts[3]
  };
};

/**
 * Validates a barcode format
 * 
 * @param barcode - Barcode string to validate
 * @returns Boolean indicating if the barcode is valid
 */
export const isValidBarcode = (barcode: string): boolean => {
  const parts = barcode.split('-');
  
  // Must have 4 parts: category, product, box number, and unique ID
  if (parts.length !== 4) {
    return false;
  }
  
  // Category should be 1-4 uppercase letters
  if (!/^[A-Z]{1,4}$/.test(parts[0])) {
    return false;
  }
  
  // Box number must be numeric
  if (!/^\d+$/.test(parts[2])) {
    return false;
  }
  
  // Unique ID should be at least 4 characters
  if (parts[3].length < 4) {
    return false;
  }
  
  return true;
};
