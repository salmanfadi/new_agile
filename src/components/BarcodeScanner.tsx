
// This is now just a re-export that supports both default and named export
import BarcodeScanner, { BarcodeScanner as NamedBarcodeScanner } from './warehouse/BarcodeScanner';
export { NamedBarcodeScanner as BarcodeScanner };
export default BarcodeScanner;
