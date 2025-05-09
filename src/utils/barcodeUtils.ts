
/**
 * Generates a barcode string in the format CAT-PROD-BOX
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
  
  // Combine all parts
  return `${categoryAbbrev}-${sku}-${boxStr}`;
};

/**
 * Extracts information from a barcode string
 * 
 * @param barcode - Barcode string in format CAT-PROD-BOX
 * @returns Object with category abbreviation, product code, and box number
 */
export const parseBarcodeString = (barcode: string): { 
  categoryAbbrev: string;
  productCode: string; 
  boxNumber: number;
} | null => {
  const parts = barcode.split('-');
  
  if (parts.length !== 3) {
    return null;
  }
  
  return {
    categoryAbbrev: parts[0],
    productCode: parts[1],
    boxNumber: parseInt(parts[2], 10)
  };
};
