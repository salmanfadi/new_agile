#!/bin/bash

# Remove unused components
rm -rf src/components/admin/
rm -rf src/components/notification/
rm -rf src/components/sales/

# Remove unused pages
rm -rf src/pages/customer/
rm -rf src/pages/salesOperator/
rm -rf src/pages/public/

# Remove unused hooks
rm src/hooks/useAdminDashboardData.tsx
rm src/hooks/useInventoryData.ts
rm src/hooks/useManagerDashboardData.ts

# Clean up barcode components (keep only what's used)
find src/components/barcode/ -type f ! -name 'BarcodeScanner.tsx' -delete

# Clean up field operator pages (keep only used ones)
find src/pages/fieldOperator/ -type f ! -name 'BarcodeLookup.tsx' ! -name 'StockInForm.tsx' ! -name 'StockOutForm.tsx' ! -name 'MySubmissions.tsx' -delete

# Clean up admin pages (keep only used ones)
find src/pages/admin/ -type f ! -name 'AdminDashboard.tsx' ! -name 'ProductManagement.tsx' ! -name 'WarehouseManagement.tsx' ! -name 'UsersManagement.tsx' ! -name 'BarcodeManagement.tsx' ! -name 'StockInManagement.tsx' ! -name 'StockOutManagement.tsx' ! -name 'BatchStockInPage.tsx' ! -name 'InventoryView.tsx' -delete

echo "Cleanup complete. Please review the changes before committing."
