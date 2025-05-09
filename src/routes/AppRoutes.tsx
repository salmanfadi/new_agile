
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

// Layout
import { MainLayout } from '@/components/layout/MainLayout';
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';

// Protected route component
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { RoleBasedRoute } from '@/components/auth/RoleBasedRoute';

// Admin Pages
import AdminDashboard from '@/pages/admin/AdminDashboard';
import ProductManagement from '@/pages/admin/ProductManagement';
import UserManagement from '@/pages/admin/UserManagement';
import WarehouseManagement from '@/pages/admin/WarehouseManagement';
import NotificationCenter from '@/pages/admin/NotificationCenter';

// Warehouse Manager Pages
import WarehouseDashboard from '@/pages/warehouseManager/WarehouseDashboard';
import InventoryView from '@/pages/warehouseManager/InventoryView';
import StockInProcessing from '@/pages/warehouseManager/StockInProcessing';
import BatchStockInPage from '@/pages/warehouseManager/BatchStockInPage';
import ProcessStockInPage from '@/pages/warehouseManager/ProcessStockInPage';
import StockOutApproval from '@/pages/warehouseManager/StockOutApproval';
import BarcodeLookup from '@/pages/warehouseManager/BarcodeLookup';

// Field Operator Pages
import FieldOperatorDashboard from '@/pages/fieldOperator/FieldOperatorDashboard';
import SubmitStockIn from '@/pages/fieldOperator/SubmitStockIn';
import StockOutForm from '@/pages/fieldOperator/StockOutForm';
import MySubmissions from '@/pages/fieldOperator/MySubmissions';
import BarcodeScanner from '@/pages/BarcodeScanner';
// Import BarcodeLookup directly without destructuring
import OperatorBarcodeLookup from '@/pages/fieldOperator/BarcodeLookup';

// Sales Operator Pages
import SalesOperatorDashboard from '@/pages/salesOperator/SalesOperatorDashboard';
import ViewInventory from '@/pages/salesOperator/InventoryView';
import SalesInquiryForm from '@/pages/salesOperator/SalesInquiryForm';
import ManageInquiries from '@/pages/salesOperator/ManageInquiries';

// Shared Pages
import ProfilePage from '@/pages/ProfilePage';
import NotFound from '@/pages/NotFound';

export const AppRoutes = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Routes>
      {/* Auth Pages - Redirect to dashboard if logged in */}
      <Route path="/auth/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/auth/register" element={user ? <Navigate to="/" replace /> : <RegisterPage />} />

      {/* Admin Routes */}
      <Route element={<RoleBasedRoute allowedRoles={['admin']} />}>
        <Route path="/admin" element={<MainLayout><AdminDashboard /></MainLayout>} />
        <Route path="/admin/products" element={<MainLayout><ProductManagement /></MainLayout>} />
        <Route path="/admin/users" element={<MainLayout><UserManagement /></MainLayout>} />
        <Route path="/admin/warehouses" element={<MainLayout><WarehouseManagement /></MainLayout>} />
        <Route path="/admin/notifications" element={<MainLayout><NotificationCenter /></MainLayout>} />
      </Route>

      {/* Warehouse Manager Routes */}
      <Route element={<RoleBasedRoute allowedRoles={['admin', 'warehouse_manager']} />}>
        <Route path="/manager" element={<MainLayout><WarehouseDashboard /></MainLayout>} />
        <Route path="/manager/inventory" element={<MainLayout><InventoryView /></MainLayout>} />
        <Route path="/manager/stock-in" element={<MainLayout><StockInProcessing /></MainLayout>} />
        <Route path="/manager/stock-in/batch" element={<BatchStockInPage />} />
        <Route path="/manager/stock-in/batch/:stockInId" element={<BatchStockInPage />} />
        <Route path="/manager/stock-in/:stockInId" element={<MainLayout><ProcessStockInPage /></MainLayout>} />
        <Route path="/manager/stock-out" element={<MainLayout><StockOutApproval /></MainLayout>} />
        <Route path="/manager/barcode" element={<MainLayout><BarcodeLookup /></MainLayout>} />
      </Route>

      {/* Field Operator Routes */}
      <Route element={<RoleBasedRoute allowedRoles={['admin', 'field_operator']} />}>
        <Route path="/field" element={<MainLayout><FieldOperatorDashboard /></MainLayout>} />
        <Route path="/field/stock-in" element={<MainLayout><SubmitStockIn /></MainLayout>} />
        <Route path="/field/stock-out" element={<MainLayout><StockOutForm /></MainLayout>} />
        <Route path="/field/submissions" element={<MainLayout><MySubmissions /></MainLayout>} />
        <Route path="/field/barcode" element={<MainLayout><OperatorBarcodeLookup /></MainLayout>} />
        <Route path="/field/scanner" element={<MainLayout><BarcodeScanner /></MainLayout>} />
      </Route>

      {/* Sales Operator Routes */}
      <Route element={<RoleBasedRoute allowedRoles={['admin', 'sales_operator']} />}>
        <Route path="/sales" element={<MainLayout><SalesOperatorDashboard /></MainLayout>} />
        <Route path="/sales/inventory" element={<MainLayout><ViewInventory /></MainLayout>} />
        <Route path="/sales/inquiries/new" element={<MainLayout><SalesInquiryForm /></MainLayout>} />
        <Route path="/sales/inquiries" element={<MainLayout><ManageInquiries /></MainLayout>} />
      </Route>

      {/* Shared Protected Routes */}
      <Route element={<ProtectedRoute />}>
        <Route path="/profile" element={<MainLayout><ProfilePage /></MainLayout>} />
      </Route>

      {/* Default Routes */}
      <Route path="/" element={
        <Navigate to={
          user ? (
            user.role === 'admin' ? '/admin' :
            user.role === 'warehouse_manager' ? '/manager' :
            user.role === 'field_operator' ? '/field' :
            user.role === 'sales_operator' ? '/sales' :
            '/auth/login'
          ) : '/auth/login'
        } replace />
      } />

      {/* 404 Not Found */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;
