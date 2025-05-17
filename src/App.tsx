import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import ManagerDashboard from './pages/warehouseManager/ManagerDashboard';
import FieldOperatorDashboard from './pages/fieldOperator/FieldOperatorDashboard';
import SalesOperatorDashboard from './pages/salesOperator/SalesOperatorDashboard';
import CustomerPortal from './pages/customer/CustomerPortal';
import InventoryPage from './pages/InventoryPage';
import ProductManagementPage from './pages/admin/ProductManagementPage';
import WarehouseManagementPage from './pages/admin/WarehouseManagementPage';
import UserManagementPage from './pages/admin/UserManagementPage';
import StockInManagement from './pages/admin/StockInManagement';
import StockOutManagement from './pages/admin/StockOutManagement';
import TransferManagement from './pages/admin/TransferManagement';
import SalesInquiriesPage from './pages/admin/SalesInquiriesPage';
import MainLayout from './layouts/MainLayout';
import BatchOverviewPage from './pages/warehouseManager/BatchOverviewPage';
import BatchStockInPage from './pages/admin/BatchStockInPage';
import StockOutRequestsPage from './pages/warehouseManager/StockOutRequestsPage';
import StockInRequestsPage from './pages/warehouseManager/StockInRequestsPage';
import TransferRequestsPage from './pages/warehouseManager/TransferRequestsPage';
import FieldStockInPage from './pages/fieldOperator/FieldStockInPage';
import FieldStockOutPage from './pages/fieldOperator/FieldStockOutPage';
import FieldTransferPage from './pages/fieldOperator/FieldTransferPage';
import FieldSubmissionsPage from './pages/fieldOperator/FieldSubmissionsPage';
import BarcodeLookupPage from './pages/fieldOperator/BarcodeLookupPage';
import AllBatchesPage from './pages/warehouseManager/AllBatchesPage';
import ReportsDashboard from './pages/reports/ReportsDashboard';
import InventoryStatusReport from './pages/reports/InventoryStatusReport';
import InventoryMovementAnalysis from './pages/reports/InventoryMovementAnalysis';
import ExecutiveDashboard from './pages/reports/ExecutiveDashboard';
import StockInDetailsPage from './pages/warehouseManager/StockInDetailsPage';
import StockOutDetailsPage from './pages/warehouseManager/StockOutDetailsPage';
import TransferDetailsPage from './pages/warehouseManager/TransferDetailsPage';
import BarcodesPage from './pages/warehouseManager/BarcodesPage';
import AdminStockOutDetailsPage from './pages/admin/AdminStockOutDetailsPage';
import AdminStockInDetailsPage from './pages/admin/AdminStockInDetailsPage';
import AdminTransferDetailsPage from './pages/admin/AdminTransferDetailsPage';
import FieldStockInDetailsPage from './pages/fieldOperator/FieldStockInDetailsPage';
import FieldStockOutDetailsPage from './pages/fieldOperator/FieldStockOutDetailsPage';
import FieldTransferDetailsPage from './pages/fieldOperator/FieldTransferDetailsPage';

const queryClient = new QueryClient();

// Protected route component
const RequireAuth: React.FC<{ children: React.ReactNode; allowedRoles: string[] }> = ({
  children,
  allowedRoles,
}) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>; // Show a loading indicator while checking authentication
  }

  if (!user) {
    // Redirect to login if not authenticated
    return <Navigate to="/login" />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    // Redirect to unauthorized page or another appropriate route
    return <div>Unauthorized</div>;
  }

  return <>{children}</>;
};

function App() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleStatusChange = () => {
      setIsOnline(navigator.onLine);
    };

    window.addEventListener('online', handleStatusChange);
    window.addEventListener('offline', handleStatusChange);

    return () => {
      window.removeEventListener('online', handleStatusChange);
      window.removeEventListener('offline', handleStatusChange);
    };
  }, []);
  
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
          {!isOnline && (
            <div className="fixed top-0 left-0 w-full bg-red-500 text-white text-center py-2 z-50">
              You are currently offline. Some features may not be available.
            </div>
          )}
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />

            {/* Admin Routes */}
            <Route path="/admin" element={
              <RequireAuth allowedRoles={['admin']}>
                <MainLayout>
                  <AdminDashboard />
                </MainLayout>
              </RequireAuth>
            } />
            <Route path="/admin/inventory" element={
              <RequireAuth allowedRoles={['admin']}>
                <MainLayout>
                  <InventoryPage />
                </MainLayout>
              </RequireAuth>
            } />
            <Route path="/admin/products" element={
              <RequireAuth allowedRoles={['admin']}>
                <MainLayout>
                  <ProductManagementPage />
                </MainLayout>
              </RequireAuth>
            } />
            <Route path="/admin/warehouses" element={
              <RequireAuth allowedRoles={['admin']}>
                <MainLayout>
                  <WarehouseManagementPage />
                </MainLayout>
              </RequireAuth>
            } />
            <Route path="/admin/users" element={
              <RequireAuth allowedRoles={['admin']}>
                <MainLayout>
                  <UserManagementPage />
                </MainLayout>
              </RequireAuth>
            } />
            <Route path="/admin/stock-in" element={
              <RequireAuth allowedRoles={['admin']}>
                <MainLayout>
                  <StockInManagement />
                </MainLayout>
              </RequireAuth>
            } />
            <Route path="/admin/stock-in/batch/:stockInId" element={
              <RequireAuth allowedRoles={['admin']}>
                <MainLayout>
                  <BatchStockInPage />
                </MainLayout>
              </RequireAuth>
            } />
            <Route path="/admin/stock-out" element={
              <RequireAuth allowedRoles={['admin']}>
                <MainLayout>
                  <StockOutManagement />
                </MainLayout>
              </RequireAuth>
            } />
            <Route path="/admin/transfers" element={
              <RequireAuth allowedRoles={['admin']}>
                <MainLayout>
                  <TransferManagement />
                </MainLayout>
              </RequireAuth>
            } />
            <Route path="/admin/sales-inquiries" element={
              <RequireAuth allowedRoles={['admin']}>
                <MainLayout>
                  <SalesInquiriesPage />
                </MainLayout>
              </RequireAuth>
            } />
            <Route path="/admin/stock-in/details/:stockInId" element={
              <RequireAuth allowedRoles={['admin']}>
                <MainLayout>
                  <AdminStockInDetailsPage />
                </MainLayout>
              </RequireAuth>
            } />
            <Route path="/admin/stock-out/details/:stockOutId" element={
              <RequireAuth allowedRoles={['admin']}>
                <MainLayout>
                  <AdminStockOutDetailsPage />
                </MainLayout>
              </RequireAuth>
            } />
            <Route path="/admin/transfer/details/:transferId" element={
              <RequireAuth allowedRoles={['admin']}>
                <MainLayout>
                  <AdminTransferDetailsPage />
                </MainLayout>
              </RequireAuth>
            } />

            {/* Manager Routes */}
            <Route path="/manager" element={
              <RequireAuth allowedRoles={['warehouse_manager']}>
                <MainLayout>
                  <ManagerDashboard />
                </MainLayout>
              </RequireAuth>
            } />
            <Route path="/manager/inventory" element={
              <RequireAuth allowedRoles={['warehouse_manager']}>
                <MainLayout>
                  <InventoryPage />
                </MainLayout>
              </RequireAuth>
            } />
            <Route path="/manager/stock-in" element={
              <RequireAuth allowedRoles={['warehouse_manager']}>
                <MainLayout>
                  <StockInRequestsPage />
                </MainLayout>
              </RequireAuth>
            } />
            <Route path="/manager/stock-in/batch/:stockInId" element={
              <RequireAuth allowedRoles={['warehouse_manager']}>
                <MainLayout>
                  <BatchStockInPage />
                </MainLayout>
              </RequireAuth>
            } />
            <Route path="/manager/stock-in/batches/:stockInId" element={
              <RequireAuth allowedRoles={['admin', 'warehouse_manager']}>
                <MainLayout>
                  <BatchOverviewPage />
                </MainLayout>
              </RequireAuth>
            } />
            <Route path="/manager/stock-out" element={
              <RequireAuth allowedRoles={['warehouse_manager']}>
                <MainLayout>
                  <StockOutRequestsPage />
                </MainLayout>
              </RequireAuth>
            } />
            <Route path="/manager/transfers" element={
              <RequireAuth allowedRoles={['warehouse_manager']}>
                <MainLayout>
                  <TransferRequestsPage />
                </MainLayout>
              </RequireAuth>
            } />
            <Route path="/manager/inventory/barcodes/:batchId" element={
              <RequireAuth allowedRoles={['warehouse_manager']}>
                <MainLayout>
                  <BarcodesPage />
                </MainLayout>
              </RequireAuth>
            } />
            <Route path="/manager/stock-in/details/:stockInId" element={
              <RequireAuth allowedRoles={['warehouse_manager']}>
                <MainLayout>
                  <StockInDetailsPage />
                </MainLayout>
              </RequireAuth>
            } />
            <Route path="/manager/stock-out/details/:stockOutId" element={
              <RequireAuth allowedRoles={['warehouse_manager']}>
                <MainLayout>
                  <StockOutDetailsPage />
                </MainLayout>
              </RequireAuth>
            } />
            <Route path="/manager/transfer/details/:transferId" element={
              <RequireAuth allowedRoles={['warehouse_manager']}>
                <MainLayout>
                  <TransferDetailsPage />
                </MainLayout>
              </RequireAuth>
            } />

            {/* Field Operator Routes */}
            <Route path="/field" element={
              <RequireAuth allowedRoles={['field_operator']}>
                <MainLayout>
                  <FieldOperatorDashboard />
                </MainLayout>
              </RequireAuth>
            } />
            <Route path="/field/stock-in" element={
              <RequireAuth allowedRoles={['field_operator']}>
                <MainLayout>
                  <FieldStockInPage />
                </MainLayout>
              </RequireAuth>
            } />
            <Route path="/field/stock-out" element={
              <RequireAuth allowedRoles={['field_operator']}>
                <MainLayout>
                  <FieldStockOutPage />
                </MainLayout>
              </RequireAuth>
            } />
            <Route path="/field/transfers" element={
              <RequireAuth allowedRoles={['field_operator']}>
                <MainLayout>
                  <FieldTransferPage />
                </MainLayout>
              </RequireAuth>
            } />
             <Route path="/field/submissions" element={
              <RequireAuth allowedRoles={['field_operator']}>
                <MainLayout>
                  <FieldSubmissionsPage />
                </MainLayout>
              </RequireAuth>
            } />
            <Route path="/field/barcode-lookup" element={
              <RequireAuth allowedRoles={['field_operator']}>
                <MainLayout>
                  <BarcodeLookupPage />
                </MainLayout>
              </RequireAuth>
            } />
            <Route path="/field/stock-in/details/:stockInId" element={
              <RequireAuth allowedRoles={['field_operator']}>
                <MainLayout>
                  <FieldStockInDetailsPage />
                </MainLayout>
              </RequireAuth>
            } />
            <Route path="/field/stock-out/details/:stockOutId" element={
              <RequireAuth allowedRoles={['field_operator']}>
                <MainLayout>
                  <FieldStockOutDetailsPage />
                </MainLayout>
              </RequireAuth>
            } />
            <Route path="/field/transfer/details/:transferId" element={
              <RequireAuth allowedRoles={['field_operator']}>
                <MainLayout>
                  <FieldTransferDetailsPage />
                </MainLayout>
              </RequireAuth>
            } />

            {/* Sales Operator Routes */}
            <Route path="/sales" element={
              <RequireAuth allowedRoles={['sales_operator']}>
                <MainLayout>
                  <SalesOperatorDashboard />
                </MainLayout>
              </RequireAuth>
            } />
            <Route path="/sales/inventory" element={
              <RequireAuth allowedRoles={['sales_operator']}>
                <MainLayout>
                  <InventoryPage />
                </MainLayout>
              </RequireAuth>
            } />

            {/* Customer Routes */}
            <Route path="/customer/portal" element={
              <RequireAuth allowedRoles={['customer']}>
                <MainLayout>
                  <CustomerPortal />
                </MainLayout>
              </RequireAuth>
            } />
            
            {/* Reports Routes */}
            <Route path="/reports" element={
              <RequireAuth allowedRoles={['admin', 'warehouse_manager']}>
                <MainLayout>
                  <ReportsDashboard />
                </MainLayout>
              </RequireAuth>
            } />
            
            <Route path="/reports/inventory/status" element={
              <RequireAuth allowedRoles={['admin', 'warehouse_manager']}>
                <MainLayout>
                  <InventoryStatusReport />
                </MainLayout>
              </RequireAuth>
            } />
            
            <Route path="/reports/inventory/movement" element={
              <RequireAuth allowedRoles={['admin', 'warehouse_manager']}>
                <MainLayout>
                  <InventoryMovementAnalysis />
                </MainLayout>
              </RequireAuth>
            } />
            
            <Route path="/reports/management/executive" element={
              <RequireAuth allowedRoles={['admin', 'warehouse_manager']}>
                <MainLayout>
                  <ExecutiveDashboard />
                </MainLayout>
              </RequireAuth>
            } />
        
            {/* Add new routes for batch overview pages */}
            <Route path="/manager/stock-in/batches" element={
              <RequireAuth allowedRoles={['admin', 'warehouse_manager']}>
                <MainLayout>
                  <AllBatchesPage />
                </MainLayout>
              </RequireAuth>
            } />
        
            <Route path="/admin/stock-in/batches" element={
              <RequireAuth allowedRoles={['admin']}>
                <MainLayout>
                  <AllBatchesPage />
                </MainLayout>
              </RequireAuth>
            } />
        
            {/* Add BatchOverviewPage routes if they don't exist */}
            <Route path="/manager/stock-in/batches/:stockInId" element={
              <RequireAuth allowedRoles={['admin', 'warehouse_manager']}>
                <MainLayout>
                  <BatchOverviewPage />
                </MainLayout>
              </RequireAuth>
            } />
        
            <Route path="/admin/stock-in/batches/:stockInId" element={
              <RequireAuth allowedRoles={['admin']}>
                <MainLayout>
                  <BatchOverviewPage />
                </MainLayout>
              </RequireAuth>
            } />

            {/* Default Route */}
            <Route path="/" element={<Navigate to="/login" />} />
          </Routes>
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
