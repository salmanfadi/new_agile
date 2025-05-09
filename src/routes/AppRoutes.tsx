
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { RequireAuth } from '@/components/auth/RequireAuth';

// Pages
import Login from '@/pages/Login';
import NotFound from '@/pages/NotFound';
import Unauthorized from '@/pages/Unauthorized';
import Index from '@/pages/Index';

// Admin Pages
import AdminDashboard from '@/pages/admin/AdminDashboard';
import InventoryView from '@/pages/admin/InventoryView';
import ProductManagement from '@/pages/admin/ProductManagement';
import StockInManagement from '@/pages/admin/StockInManagement';
import StockOutManagement from '@/pages/admin/StockOutManagement';
import UsersManagement from '@/pages/admin/UsersManagement';
import WarehouseManagement from '@/pages/admin/WarehouseManagement';
import SalesInquiries from '@/pages/admin/SalesInquiries';
import BarcodeManagement from '@/pages/admin/BarcodeManagement';
import AdminBatchStockInPage from '@/pages/admin/BatchStockInPage';

// Warehouse Manager Pages
import ManagerDashboard from '@/pages/warehouseManager/ManagerDashboard';
import StockInProcessing from '@/pages/warehouseManager/StockInProcessing';
import StockOutApproval from '@/pages/warehouseManager/StockOutApproval';
import BarcodeLookup from '@/pages/warehouseManager/BarcodeLookup';
import ProcessStockInPage from '@/pages/warehouseManager/ProcessStockInPage';
import BatchStockInPage from '@/pages/warehouseManager/BatchStockInPage';

// Field Operator Pages
import OperatorDashboard from '@/pages/fieldOperator/OperatorDashboard';
import StockInForm from '@/pages/fieldOperator/StockInForm';
import StockOutForm from '@/pages/fieldOperator/StockOutForm';
import MySubmissions from '@/pages/fieldOperator/MySubmissions';
import BarcodeScanner from '@/pages/BarcodeScanner';
// Fix: Import BarcodeLookup directly without destructuring
import OperatorBarcodeLookup from '@/pages/fieldOperator/BarcodeLookup';

// Sales Operator Pages
import SalesOperatorDashboard from '@/pages/salesOperator/SalesOperatorDashboard';
import SalesInventoryView from '@/pages/salesOperator/InventoryView';
import SalesInquiriesManagement from '@/pages/salesOperator/SalesInquiriesManagement';

// Customer Pages
import CustomerLogin from '@/pages/customer/CustomerLogin';
import CustomerPortal from '@/pages/customer/CustomerPortal';
import CustomerLanding from '@/pages/customer/CustomerLanding';
import CustomerProducts from '@/pages/customer/CustomerProducts';
import CustomerInquiry from '@/pages/customer/CustomerInquiry';
import CustomerInquirySuccess from '@/pages/customer/CustomerInquirySuccess';
import CustomerRegister from '@/pages/customer/CustomerRegister';
import ResetPassword from '@/pages/customer/ResetPassword';

// Public Pages
import ProductCatalogue from '@/pages/public/ProductCatalogue';
import ProductDetail from '@/pages/public/ProductDetail';
import Cart from '@/pages/public/Cart';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Index />} />
      <Route path="/login" element={<Login />} />
      <Route path="/unauthorized" element={<Unauthorized />} />
      
      {/* Customer Routes */}
      <Route path="/customer">
        <Route index element={<CustomerLanding />} />
        <Route path="login" element={<CustomerLogin />} />
        <Route path="register" element={<CustomerRegister />} />
        <Route path="reset-password" element={<ResetPassword />} />
        <Route path="products" element={<CustomerProducts />} />
        <Route path="inquiry" element={<CustomerInquiry />} />
        <Route path="inquiry/success" element={<CustomerInquirySuccess />} />
        <Route path="portal" element={
          <RequireAuth allowedRoles={['customer']}>
            <CustomerPortal />
          </RequireAuth>
        } />
      </Route>
      
      {/* Product Catalog */}
      <Route path="/products">
        <Route index element={<ProductCatalogue />} />
        <Route path=":productId" element={<ProductDetail />} />
      </Route>
      <Route path="/cart" element={<Cart />} />
      
      {/* Admin Routes */}
      <Route path="/admin">
        <Route index element={
          <RequireAuth allowedRoles={['admin']}>
            <AdminDashboard />
          </RequireAuth>
        } />
        <Route path="inventory" element={
          <RequireAuth allowedRoles={['admin']}>
            <InventoryView />
          </RequireAuth>
        } />
        <Route path="products" element={
          <RequireAuth allowedRoles={['admin']}>
            <ProductManagement />
          </RequireAuth>
        } />
        <Route path="stock-in" element={
          <RequireAuth allowedRoles={['admin']}>
            <StockInManagement />
          </RequireAuth>
        } />
        <Route path="batch-stock-in" element={
          <RequireAuth allowedRoles={['admin']}>
            <AdminBatchStockInPage />
          </RequireAuth>
        } />
        <Route path="stock-out" element={
          <RequireAuth allowedRoles={['admin']}>
            <StockOutManagement />
          </RequireAuth>
        } />
        <Route path="users" element={
          <RequireAuth allowedRoles={['admin']}>
            <UsersManagement />
          </RequireAuth>
        } />
        <Route path="warehouses" element={
          <RequireAuth allowedRoles={['admin']}>
            <WarehouseManagement />
          </RequireAuth>
        } />
        <Route path="sales-inquiries" element={
          <RequireAuth allowedRoles={['admin']}>
            <SalesInquiries />
          </RequireAuth>
        } />
        <Route path="barcode" element={
          <RequireAuth allowedRoles={['admin']}>
            <BarcodeManagement />
          </RequireAuth>
        } />
      </Route>
      
      {/* Warehouse Manager Routes */}
      <Route path="/manager">
        <Route index element={
          <RequireAuth allowedRoles={['warehouse_manager', 'admin']}>
            <ManagerDashboard />
          </RequireAuth>
        } />
        <Route path="stock-in" element={
          <RequireAuth allowedRoles={['warehouse_manager', 'admin']}>
            <StockInProcessing />
          </RequireAuth>
        } />
        <Route path="stock-in/:stockInId" element={
          <RequireAuth allowedRoles={['warehouse_manager', 'admin']}>
            <ProcessStockInPage />
          </RequireAuth>
        } />
        <Route path="batch-stock-in" element={
          <RequireAuth allowedRoles={['warehouse_manager', 'admin']}>
            <BatchStockInPage />
          </RequireAuth>
        } />
        <Route path="stock-out" element={
          <RequireAuth allowedRoles={['warehouse_manager', 'admin']}>
            <StockOutApproval />
          </RequireAuth>
        } />
        <Route path="inventory" element={
          <RequireAuth allowedRoles={['warehouse_manager', 'admin']}>
            <InventoryView />
          </RequireAuth>
        } />
        <Route path="barcode-lookup" element={
          <RequireAuth allowedRoles={['warehouse_manager', 'admin']}>
            <BarcodeLookup />
          </RequireAuth>
        } />
      </Route>
      
      {/* Field Operator Routes */}
      <Route path="/operator">
        <Route index element={
          <RequireAuth allowedRoles={['field_operator', 'admin']}>
            <OperatorDashboard />
          </RequireAuth>
        } />
        <Route path="stock-in" element={
          <RequireAuth allowedRoles={['field_operator', 'admin']}>
            <StockInForm />
          </RequireAuth>
        } />
        <Route path="stock-out" element={
          <RequireAuth allowedRoles={['field_operator', 'admin']}>
            <StockOutForm />
          </RequireAuth>
        } />
        <Route path="submissions" element={
          <RequireAuth allowedRoles={['field_operator', 'admin']}>
            <MySubmissions />
          </RequireAuth>
        } />
        <Route path="barcode-scan" element={
          <RequireAuth allowedRoles={['field_operator', 'warehouse_manager', 'admin']}>
            <BarcodeScanner />
          </RequireAuth>
        } />
        <Route path="barcode-lookup" element={
          <RequireAuth allowedRoles={['field_operator', 'warehouse_manager', 'admin']}>
            <OperatorBarcodeLookup />
          </RequireAuth>
        } />
      </Route>
      
      {/* Sales Operator Routes */}
      <Route path="/sales">
        <Route index element={
          <RequireAuth allowedRoles={['sales_operator', 'admin']}>
            <SalesOperatorDashboard />
          </RequireAuth>
        } />
        <Route path="inventory" element={
          <RequireAuth allowedRoles={['sales_operator', 'admin']}>
            <SalesInventoryView />
          </RequireAuth>
        } />
        <Route path="inquiries" element={
          <RequireAuth allowedRoles={['sales_operator', 'admin']}>
            <SalesInquiriesManagement />
          </RequireAuth>
        } />
      </Route>
      
      {/* Catch All - 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};
