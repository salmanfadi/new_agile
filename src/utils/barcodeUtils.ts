
/**
 * Generates a barcode string in the format CAT-PROD-BOX-UID
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
  
  // Add timestamp to ensure uniqueness across batches
  const uniqueId = Date.now().toString(36).substring(4);
  
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
 * Validates whether a barcode is in the correct format
 * 
 * @param barcode - Barcode string to validate
 * @returns Boolean indicating if barcode is valid
 */
export const isValidBarcode = (barcode: string): boolean => {
  // Accept UUID format barcodes (legacy)
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(barcode)) {
    return true;
  }
  
  // Accept structured barcode format
  const parts = barcode.split('-');
  
  if (parts.length !== 4) {
    return false;
  }
  
  // Category should be 2-4 chars
  if (parts[0].length < 2 || parts[0].length > 4) {
    return false;
  }
  
  // Product code should be at least 3 chars
  if (parts[1].length < 3) {
    return false;
  }
  
  // Box number should be 3 digits
  if (!/^\d{3}$/.test(parts[2])) {
    return false;
  }
  
  // Unique ID should be at least 4 chars
  if (parts[3].length < 4) {
    return false;
  }
  
  return true;
};

/**
 * Formats a barcode for display (shortens if necessary)
 * 
 * @param barcode - Full barcode string
 * @param maxLength - Maximum display length before truncation
 * @returns Formatted barcode string for display
 */
export const formatBarcodeForDisplay = (barcode: string, maxLength: number = 16): string => {
  if (!barcode) return '';
  
  if (barcode.length <= maxLength) {
    return barcode;
  }
  
  // For structured barcodes (CAT-PROD-BOX-UID format)
  const parts = barcode.split('-');
  if (parts.length === 4) {
    return `${parts[0]}-${parts[1]}-${parts[2]}...`;
  }
  
  // For UUID-style barcodes
  return barcode.substring(0, 8) + '...';
};
