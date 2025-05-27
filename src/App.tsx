import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from 'next-themes';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from './context/AuthContext';
import { RequireAuth } from '@/components/auth/RequireAuth';
import { MainLayout } from '@/layouts/MainLayout';
import { PublicLayout } from '@/layouts/PublicLayout';
import { CustomerLayout } from '@/components/layout/CustomerLayout';

// Public pages
import Login from './pages/Login';
import NotFound from './pages/NotFound';
import Index from './pages/Index';
import Unauthorized from './pages/Unauthorized';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import ProductManagement from './pages/admin/ProductManagement';
import WarehouseManagement from './pages/admin/WarehouseManagement';
import UsersManagement from './pages/admin/UsersManagement';
import InventoryView from './pages/admin/InventoryView';
import SalesInquiries from './pages/admin/SalesInquiries';
import BatchInventoryPage from './pages/admin/BatchInventoryPage';
import BarcodeManagement from './pages/admin/BarcodeManagement';
import StockInManagement from './pages/admin/StockInManagement';
import StockOutManagement from './pages/admin/StockOutManagement';
import InventoryTransfers from './pages/admin/InventoryTransfers';
import BarcodeInventoryPage from './pages/admin/BarcodeInventoryPage';
import BatchStockInPage from './pages/admin/BatchStockInPage';
import AdminEnhancedInventoryView from './pages/admin/EnhancedInventoryView';
import BatchDetailsPage from './pages/admin/BatchDetailsPage';

// Manager pages
import ManagerDashboard from './pages/warehouseManager/ManagerDashboard';
import StockInProcessing from './pages/warehouseManager/StockInProcessing';
import StockInDetailsPage from './pages/warehouseManager/StockInDetailsPage';
import ProcessStockInPage from './pages/warehouseManager/ProcessStockInPage';
import StockOutApproval from './pages/warehouseManager/StockOutApproval';
import BarcodeLookup from './pages/warehouseManager/BarcodeLookup';
import { InventoryView as ManagerInventoryView } from './pages/warehouseManager/InventoryView';
import { InventoryTransfers as ManagerInventoryTransfers } from './pages/warehouseManager/InventoryTransfers';
import ManagerBatchStockInPage from './pages/warehouseManager/BatchStockInPage';
import BatchOverviewPage from './pages/warehouseManager/BatchOverviewPage';
import BarcodeAssignmentPage from './pages/warehouseManager/BarcodeAssignmentPage';

// Field operator pages
import OperatorDashboard from './pages/fieldOperator/OperatorDashboard';
import StockInForm from './pages/fieldOperator/StockInForm';
import StockOutForm from './pages/fieldOperator/StockOutForm';
import Submissions from './pages/fieldOperator/Submissions';
import FieldOperatorBarcodeLookup from './pages/fieldOperator/BarcodeLookup';
import Transfers from './pages/fieldOperator/Transfers';
import Settings from './pages/fieldOperator/Settings';

// Sales operator pages
import SalesOperatorDashboard from './pages/salesOperator/SalesOperatorDashboard';
import SalesInquiriesManagement from './pages/salesOperator/SalesInquiriesManagement';
import SalesInventoryView from './pages/salesOperator/InventoryView';
import ProductView from './pages/salesOperator/ProductView';
import OrdersManagement from './pages/salesOperator/OrdersManagement';

// Report pages
import ReportsDashboard from './pages/reports/ReportsDashboard';
import BatchTrackingReport from './pages/reports/inventory/BatchTrackingReport';
import InventoryMovementReport from './pages/reports/inventory/InventoryMovementReport';
import InventoryStatusReport from './pages/reports/inventory/InventoryStatusReport';
import StockProcessingReport from './pages/reports/operational/StockProcessingReport';
import TransferMovementReport from './pages/reports/operational/TransferMovementReport';
import WarehouseUtilizationReport from './pages/reports/operational/WarehouseUtilizationReport';
import AuditComplianceReport from './pages/reports/management/AuditComplianceReport';
import ExecutiveDashboard from './pages/reports/management/ExecutiveDashboard';

// Customer pages
import CustomerPortal from './pages/customer/CustomerPortal';
import CustomerLogin from './pages/customer/CustomerLogin';
import CustomerRegister from './pages/customer/CustomerRegister';
import CustomerLanding from './pages/customer/CustomerLanding';
import CustomerProducts from './pages/customer/CustomerProducts';
import CustomerInquiry from './pages/customer/CustomerInquiry';
import CustomerInquirySuccess from './pages/customer/CustomerInquirySuccess';
import ResetPassword from './pages/customer/ResetPassword';

// Public pages
import ProductCatalogue from './pages/public/ProductCatalogue';
import ProductDetail from './pages/public/ProductDetail';
import Cart from './pages/public/Cart';

// Import the new UnifiedBatchProcessingPage components
import UnifiedBatchProcessingPage from '@/pages/warehouseManager/UnifiedBatchProcessingPage';
import AdminUnifiedBatchProcessingPage from '@/pages/admin/UnifiedBatchProcessingPage';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light">
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Router>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              
              {/* Customer Routes - No authentication required */}
              <Route element={<CustomerLayout />}>
                <Route path="/customer" element={<CustomerLanding />} />
                <Route path="/customer/products" element={<CustomerProducts />} />
                <Route path="/customer/catalog" element={<ProductCatalogue />} />
                <Route path="/customer/inquiry" element={<CustomerInquiry />} />
              </Route>

              {/* Protected Admin Routes */}
              <Route element={
                <RequireAuth allowedRoles={['admin']}>
                  <MainLayout />
                </RequireAuth>
              }>
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/products" element={<ProductManagement />} />
                <Route path="/admin/warehouse" element={<WarehouseManagement />} />
                <Route path="/admin/users" element={<UsersManagement />} />
                <Route path="/admin/inventory" element={<InventoryView />} />
                <Route path="/admin/sales-inquiries" element={<SalesInquiries />} />
                <Route path="/admin/batch-inventory" element={<BatchInventoryPage />} />
                <Route path="/admin/barcodes" element={<BarcodeManagement />} />
                <Route path="/admin/stock-in" element={<StockInManagement />} />
                <Route path="/admin/stock-out" element={<StockOutManagement />} />
                <Route path="/admin/transfers" element={<InventoryTransfers />} />
                <Route path="/admin/barcode-inventory" element={<BarcodeInventoryPage />} />
                <Route path="/admin/batch-stock-in" element={<BatchStockInPage />} />
                <Route path="/admin/enhanced-inventory" element={<AdminEnhancedInventoryView />} />
                <Route path="/admin/batch/:id" element={<BatchDetailsPage />} />
              </Route>

              {/* Protected Sales Operator Routes */}
              <Route element={
                <RequireAuth allowedRoles={['sales_operator']}>
                  <MainLayout />
                </RequireAuth>
              }>
                <Route path="/sales" element={<SalesOperatorDashboard />} />
                <Route path="/sales/products" element={<ProductView />} />
                <Route path="/sales/inventory" element={<SalesInventoryView />} />
                <Route path="/sales/inquiries" element={<SalesInquiriesManagement />} />
                <Route path="/sales/orders" element={<OrdersManagement />} />
              </Route>

              {/* Catch-all route for 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Router>
          <Toaster />
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
