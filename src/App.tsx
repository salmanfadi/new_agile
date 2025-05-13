
import React from 'react';
import { BrowserRouter as Router, Route, Routes, Outlet } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { RequireAuth } from '@/components/auth/RequireAuth';
import { MainLayout } from '@/components/layout/MainLayout';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Index from '@/pages/Index';
import Login from '@/pages/Login';
import AdminDashboard from '@/pages/admin/AdminDashboard';
import ManagerDashboard from '@/pages/warehouseManager/ManagerDashboard';
import OperatorDashboard from '@/pages/fieldOperator/OperatorDashboard';
import StockInProcessing from '@/pages/warehouseManager/StockInProcessing';
import ProcessStockInPage from '@/pages/warehouseManager/ProcessStockInPage';
import DedicatedBatchStockInPage from '@/pages/warehouseManager/DedicatedBatchStockInPage';
import AdminBatchStockInPage from '@/pages/admin/BatchStockInPage';
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
import SalesInventoryView from "./pages/salesOperator/InventoryView";
import StockInForm from "./pages/fieldOperator/StockInForm";
import BarcodeManagement from "./pages/admin/BarcodeManagement";
import AdminStockInManagement from "./pages/admin/StockInManagement";
import AdminStockOutManagement from "./pages/admin/StockOutManagement";
// Import customer pages
import CustomerLanding from "./pages/customer/CustomerLanding";
import CustomerProducts from "./pages/customer/CustomerProducts";
import CustomerInquiry from "./pages/customer/CustomerInquiry";
import CustomerInquirySuccess from "./pages/customer/CustomerInquirySuccess";
import CustomerLogin from "./pages/customer/CustomerLogin";
import CustomerPortal from "./pages/customer/CustomerPortal";
import CustomerRegister from "./pages/customer/CustomerRegister";

const App: React.FC = () => {
  const queryClient = new QueryClient();
  
  return (
    <Router>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Admin Routes */}
          <Route path="/admin" element={
            <RequireAuth allowedRoles={['admin']}>
              <MainLayout>
                <Outlet />
              </MainLayout>
            </RequireAuth>
          }>
            <Route index element={<AdminDashboard />} />
            <Route path="products" element={<ProductManagement />} />
            <Route path="warehouses" element={<WarehouseManagement />} />
            <Route path="inventory" element={<AdminInventoryView />} />
            <Route path="barcodes" element={<BarcodeManagement />} />
            <Route path="stock-in" element={<AdminStockInManagement />} />
            <Route path="stock-in/batch" element={<AdminBatchStockInPage />} />
            <Route path="stock-in/batch/:stockInId" element={<AdminBatchStockInPage />} /> {/* New route with ID */}
            <Route path="stock-out" element={<AdminStockOutManagement />} />
            <Route path="sales" element={<SalesInquiries />} />
            <Route path="users" element={<UsersManagement />} />
          </Route>

          {/* Warehouse Manager Routes */}
          <Route path="/manager" element={
            <RequireAuth allowedRoles={['warehouse_manager']}>
              <MainLayout>
                <Outlet />
              </MainLayout>
            </RequireAuth>
          }>
            <Route index element={<ManagerDashboard />} />
            <Route path="stock-in" element={<StockInProcessing />} />
            <Route path="stock-in/batch" element={<DedicatedBatchStockInPage />} />
            <Route path="stock-in/batch/:stockInId" element={<DedicatedBatchStockInPage />} /> {/* New route with ID */}
            <Route path="process-stock-in/:stockInId" element={<ProcessStockInPage />} />
            <Route path="stock-out-approval" element={<StockOutApproval />} />
            <Route path="inventory" element={<InventoryView />} />
            <Route path="barcode" element={<ManagerBarcodeLookup />} />
          </Route>

          {/* Field Operator Routes */}
          <Route path="/operator" element={
            <RequireAuth allowedRoles={['field_operator']}>
              <MainLayout>
                <Outlet />
              </MainLayout>
            </RequireAuth>
          }>
            <Route index element={<OperatorDashboard />} />
            <Route path="stock-in" element={<StockInForm />} />
            <Route path="stock-out" element={<StockOutForm />} />
            <Route path="submissions" element={<MySubmissions />} />
            <Route path="barcode-lookup" element={<BarcodeLookup />} />
          </Route>

          {/* Sales Operator Routes */}
          <Route path="/sales" element={
            <RequireAuth allowedRoles={['sales_operator']}>
              <MainLayout>
                <Outlet />
              </MainLayout>
            </RequireAuth>
          }>
            <Route index element={<SalesOperatorDashboard />} />
            <Route path="inquiries" element={<SalesInquiriesManagement />} />
            <Route path="inventory" element={<SalesInventoryView />} />
          </Route>

          {/* Shared Route for Barcode Scanner */}
          <Route path="/scan" element={
            <RequireAuth allowedRoles={['warehouse_manager', 'field_operator', 'admin']}>
              <MainLayout>
                <Outlet />
              </MainLayout>
            </RequireAuth>
          }>
            <Route index element={<BarcodeScannerPage />} />
          </Route>

          {/* Customer Facing Routes */}
          <Route path="/products" element={<ProductCatalogue />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/cart" element={<Cart />} />
          
          {/* Customer Portal */}
          <Route path="/customer">
            <Route index element={<CustomerLanding />} />
            <Route path="products" element={<CustomerProducts />} />
            <Route path="inquiry" element={<CustomerInquiry />} />
            <Route path="inquiry/success" element={<CustomerInquirySuccess />} />
            <Route path="login" element={<CustomerLogin />} />
            <Route path="register" element={<CustomerRegister />} />
            <Route path="portal" element={<CustomerPortal />} />
          </Route>
          </Routes>
        </AuthProvider>
      </QueryClientProvider>
    </Router>
  );
};

export default App;
