
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { RequireAuth } from '@/components/auth/RequireAuth';
import { MainLayout } from '@/components/layout/MainLayout';
import Index from '@/pages/Index';
import Login from '@/pages/Login';
import AdminDashboard from '@/pages/admin/AdminDashboard';
import ManagerDashboard from '@/pages/warehouseManager/ManagerDashboard';
import OperatorDashboard from '@/pages/fieldOperator/OperatorDashboard';
import StockInProcessing from '@/pages/warehouseManager/StockInProcessing';
import StockOutApproval from '@/pages/warehouseManager/StockOutApproval';
import StockOutForm from '@/pages/fieldOperator/StockOutForm';
import MySubmissions from '@/pages/fieldOperator/MySubmissions';
import InventoryView from '@/pages/warehouseManager/InventoryView';
import Unauthorized from '@/pages/Unauthorized';
import BarcodeLookup from "./pages/fieldOperator/BarcodeLookup";
import ManagerBarcodeLookup from "./pages/warehouseManager/BarcodeLookup";
import BarcodeScannerPage from "./pages/BarcodeScanner";
import ProductManagement from "./pages/admin/ProductManagement";
import WarehouseManagement from "./pages/admin/WarehouseManagement";
import ProductCatalogue from "./pages/public/ProductCatalogue";
import ProductDetail from "./pages/public/ProductDetail";
import Cart from "./pages/public/Cart";
import SalesInquiries from "./pages/admin/SalesInquiries";
import AdminInventoryView from "./pages/admin/InventoryView";
import UsersManagement from "./pages/admin/UsersManagement"; 
import SalesOperatorDashboard from "./pages/salesOperator/SalesOperatorDashboard";
import SalesInquiriesManagement from "./pages/salesOperator/SalesInquiriesManagement";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Create a client
const queryClient = new QueryClient();

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/unauthorized" element={<Unauthorized />} />
            <Route path="/" element={<Index />} />
            
            {/* Public Product Catalogue Routes */}
            <Route path="/products" element={<ProductCatalogue />} />
            <Route path="/products/:id" element={<ProductDetail />} />
            <Route path="/cart" element={<Cart />} />

            {/* Admin Routes */}
            <Route
              path="/admin"
              element={
                <RequireAuth allowedRoles={['admin']}>
                  <MainLayout>
                    <AdminDashboard />
                  </MainLayout>
                </RequireAuth>
              }
            />
            <Route
              path="/admin/warehouses"
              element={
                <RequireAuth allowedRoles={['admin']}>
                  <MainLayout>
                    <WarehouseManagement />
                  </MainLayout>
                </RequireAuth>
              }
            />
            <Route
              path="/admin/users"
              element={
                <RequireAuth allowedRoles={['admin']}>
                  <MainLayout>
                    <UsersManagement />
                  </MainLayout>
                </RequireAuth>
              }
            />
            <Route
              path="/admin/inventory"
              element={
                <RequireAuth allowedRoles={['admin']}>
                  <MainLayout>
                    <AdminInventoryView />
                  </MainLayout>
                </RequireAuth>
              }
            />
            <Route
              path="/admin/products"
              element={
                <RequireAuth allowedRoles={['admin']}>
                  <MainLayout>
                    <ProductManagement />
                  </MainLayout>
                </RequireAuth>
              }
            />
            <Route
              path="/admin/sales"
              element={
                <RequireAuth allowedRoles={['admin']}>
                  <MainLayout>
                    <SalesInquiries />
                  </MainLayout>
                </RequireAuth>
              }
            />
            <Route
              path="/admin/stock-in"
              element={
                <RequireAuth allowedRoles={['admin']}>
                  <MainLayout>
                    <StockInProcessing />
                  </MainLayout>
                </RequireAuth>
              }
            />
            <Route
              path="/admin/stock-out"
              element={
                <RequireAuth allowedRoles={['admin']}>
                  <MainLayout>
                    <StockOutApproval />
                  </MainLayout>
                </RequireAuth>
              }
            />

            {/* Sales Operator Routes */}
            <Route
              path="/sales"
              element={
                <RequireAuth allowedRoles={['admin', 'sales_operator']}>
                  <MainLayout>
                    <SalesOperatorDashboard />
                  </MainLayout>
                </RequireAuth>
              }
            />
            <Route
              path="/sales/inquiries"
              element={
                <RequireAuth allowedRoles={['admin', 'sales_operator']}>
                  <MainLayout>
                    <SalesInquiriesManagement />
                  </MainLayout>
                </RequireAuth>
              }
            />

            {/* Warehouse Manager Routes */}
            <Route
              path="/manager"
              element={
                <RequireAuth allowedRoles={['warehouse_manager', 'admin']}>
                  <MainLayout>
                    <ManagerDashboard />
                  </MainLayout>
                </RequireAuth>
              }
            />
            <Route
              path="/manager/stock-in"
              element={
                <RequireAuth allowedRoles={['warehouse_manager', 'admin']}>
                  <MainLayout>
                    <StockInProcessing />
                  </MainLayout>
                </RequireAuth>
              }
            />
            <Route
              path="/manager/stock-out-approval"
              element={
                <RequireAuth allowedRoles={['warehouse_manager', 'admin']}>
                  <MainLayout>
                    <StockOutApproval />
                  </MainLayout>
                </RequireAuth>
              }
            />
            <Route
              path="/manager/inventory"
              element={
                <RequireAuth allowedRoles={['warehouse_manager', 'admin']}>
                  <MainLayout>
                    <InventoryView />
                  </MainLayout>
                </RequireAuth>
              }
            />
            <Route
              path="/manager/barcode"
              element={
                <RequireAuth allowedRoles={['warehouse_manager', 'admin']}>
                  <MainLayout>
                    <ManagerBarcodeLookup />
                  </MainLayout>
                </RequireAuth>
              }
            />

            {/* Field Operator Routes */}
            <Route
              path="/operator"
              element={
                <RequireAuth allowedRoles={['field_operator', 'admin', 'warehouse_manager']}>
                  <MainLayout>
                    <OperatorDashboard />
                  </MainLayout>
                </RequireAuth>
              }
            />
            <Route
              path="/operator/stock-out"
              element={
                <RequireAuth allowedRoles={['field_operator', 'admin', 'warehouse_manager']}>
                  <MainLayout>
                    <StockOutForm />
                  </MainLayout>
                </RequireAuth>
              }
            />
            <Route
              path="/operator/submissions"
              element={
                <RequireAuth allowedRoles={['field_operator', 'admin', 'warehouse_manager']}>
                  <MainLayout>
                    <MySubmissions />
                  </MainLayout>
                </RequireAuth>
              }
            />
            <Route
              path="/operator/barcode"
              element={
                <RequireAuth allowedRoles={['field_operator', 'admin', 'warehouse_manager']}>
                  <MainLayout>
                    <BarcodeLookup />
                  </MainLayout>
                </RequireAuth>
              }
            />
            
            {/* Barcode Scanner Test Page - accessible to all authenticated users */}
            <Route
              path="/barcode-scanner"
              element={
                <RequireAuth>
                  <MainLayout>
                    <BarcodeScannerPage />
                  </MainLayout>
                </RequireAuth>
              }
            />
          </Routes>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
