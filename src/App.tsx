import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './components/theme-provider';
import { Toaster } from '@/components/ui/toaster';

// Auth Layouts
import PublicLayout from '@/layouts/PublicLayout';
import MainLayout from '@/layouts/MainLayout';
import CustomerLayout from '@/layouts/CustomerLayout';

// Auth Pages
import Login from '@/pages/auth/Login';
import Register from '@/pages/auth/Register';

// Index Page
import Index from '@/pages/Index';

// Admin Pages
import AdminDashboard from '@/pages/admin/AdminDashboard';
import UserManagement from '@/pages/admin/UserManagement';
import AdminEnhancedInventoryView from '@/pages/admin/EnhancedInventoryView';
import AdminBatchInventoryPage from '@/pages/admin/BatchInventoryPage';
import ReportsPage from '@/pages/admin/ReportsPage';
import Settings from '@/pages/admin/Settings';

// Warehouse Manager Pages
import WarehouseDashboard from '@/pages/warehouseManager/WarehouseDashboard';
import InventoryOverview from '@/pages/warehouseManager/InventoryOverview';
import BatchManagementPage from '@/pages/warehouse/BatchManagementPage';
import StockInPage from '@/pages/warehouseManager/StockInPage';
import StockOutPage from '@/pages/warehouseManager/StockOutPage';
import BatchStockInPage from '@/pages/warehouseManager/BatchStockInPage';
import StockInDetailsPage from '@/pages/warehouseManager/StockInDetailsPage';
import BatchOverviewPage from '@/pages/warehouseManager/BatchOverviewPage';

// Field Operator Pages
import OperatorDashboard from '@/pages/fieldOperator/OperatorDashboard';
import FieldStockInPage from '@/pages/fieldOperator/FieldStockInPage';
import FieldStockOutPage from '@/pages/fieldOperator/FieldStockOutPage';
import FieldTransfersPage from '@/pages/fieldOperator/FieldTransfersPage';
import BarcodeScanPage from '@/pages/fieldOperator/BarcodeScanPage';
import SubmissionsPage from '@/pages/fieldOperator/SubmissionsPage';

// Sales Operator Pages
import SalesDashboard from '@/pages/salesOperator/SalesDashboard';
import SalesInventoryPage from '@/pages/salesOperator/SalesInventoryPage';
import InquiriesPage from '@/pages/salesOperator/InquiriesPage';

// Customer Pages
import CustomerPortal from '@/pages/customer/CustomerPortal';
import OrderDetails from '@/pages/customer/OrderDetails';
import CustomerProfile from '@/pages/customer/CustomerProfile';

// Shared Pages
import BarcodePrintPage from '@/pages/warehouse/BarcodePrintPage';
import BatchDetailsPage from '@/pages/warehouse/BatchDetailsPage';
import BoxDetailsPage from '@/pages/warehouse/BoxDetailsPage';
import NotFound from '@/pages/NotFound';

// Auth Components
import RequireAuth from '@/components/auth/RequireAuth';

const queryClient = new QueryClient();

function App() {

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
        <div className="min-h-screen flex flex-col">
          <Toaster position="top-right" closeButton />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route
              path="/login"
              element={
                <PublicLayout>
                  <Login />
                </PublicLayout>
              }
            />
            <Route path="/register" element={<Register />} />
            
            {/* Admin Routes */}
            <Route element={<RequireAuth allowedRoles={['admin']} />}>
              <Route
                path="/admin/*"
                element={
                  <MainLayout>
                    <Routes>
                      <Route index element={<AdminDashboard />} />
                      <Route path="users" element={<UserManagement />} />
                      <Route path="inventory" element={<AdminEnhancedInventoryView />} />
                      <Route path="inventory/batch" element={<AdminBatchInventoryPage />} />
                      <Route path="inventory/batch/:batchId" element={<BatchDetailsPage />} />
                      <Route path="inventory/box/:barcode" element={<BoxDetailsPage />} />
                      <Route path="inventory/barcodes/:batchId" element={<BarcodePrintPage />} />
                      <Route path="reports" element={<ReportsPage />} />
                      <Route path="settings" element={<Settings />} />
                      {/* More admin routes here */}
                    </Routes>
                  </MainLayout>
                }
              />
            </Route>

            {/* Warehouse Manager Routes */}
            <Route element={<RequireAuth allowedRoles={['warehouse_manager']} />}>
              <Route
                path="/manager/*"
                element={
                  <MainLayout>
                    <Routes>
                      <Route index element={<WarehouseDashboard />} />
                      <Route path="inventory" element={<InventoryOverview />} />
                      <Route path="batch" element={<BatchManagementPage />} />
                      <Route path="batch/:batchId" element={<BatchDetailsPage />} />
                      <Route path="box/:barcode" element={<BoxDetailsPage />} />
                      <Route path="stock-in" element={<StockInPage />} />
                      <Route path="stock-out" element={<StockOutPage />} />
                      <Route path="stock-in/batch/:stockInId" element={<BatchStockInPage />} />
                      <Route path="stock-in/details/:stockInId" element={<StockInDetailsPage />} />
                      <Route path="stock-in/batch-overview/:stockInId" element={<BatchOverviewPage />} />
                      <Route path="inventory/barcodes/:batchId" element={<BarcodePrintPage />} />
                      {/* More warehouse manager routes here */}
                    </Routes>
                  </MainLayout>
                }
              />
            </Route>

            {/* Field Operator Routes */}
            <Route element={<RequireAuth allowedRoles={['field_operator']} />}>
              <Route
                path="/field/*"
                element={
                  <MainLayout>
                    <Routes>
                      <Route index element={<OperatorDashboard />} />
                      <Route path="stock-in" element={<FieldStockInPage />} />
                      <Route path="stock-out" element={<FieldStockOutPage />} />
                      <Route path="transfers" element={<FieldTransfersPage />} />
                      <Route path="barcode" element={<BarcodeScanPage />} />
                      <Route path="submissions" element={<SubmissionsPage />} />
                      <Route path="box/:barcode" element={<BoxDetailsPage />} />
                      {/* More field operator routes here */}
                    </Routes>
                  </MainLayout>
                }
              />
            </Route>

            {/* Sales Operator Routes */}
            <Route element={<RequireAuth allowedRoles={['sales_operator']} />}>
              <Route
                path="/sales/*"
                element={
                  <MainLayout>
                    <Routes>
                      <Route index element={<SalesDashboard />} />
                      <Route path="inventory" element={<SalesInventoryPage />} />
                      <Route path="inquiries" element={<InquiriesPage />} />
                      {/* More sales operator routes here */}
                    </Routes>
                  </MainLayout>
                }
              />
            </Route>

            {/* Customer Routes */}
            <Route element={<RequireAuth allowedRoles={['customer']} />}>
              <Route
                path="/customer/*"
                element={
                  <CustomerLayout>
                    <Routes>
                      <Route path="portal" element={<CustomerPortal />} />
                      <Route path="order/:id" element={<OrderDetails />} />
                      <Route path="profile" element={<CustomerProfile />} />
                      {/* More customer routes here */}
                    </Routes>
                  </CustomerLayout>
                }
              />
            </Route>

            {/* Fallback route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
