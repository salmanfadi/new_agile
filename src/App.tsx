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
import StockOutSubmissions from '@/pages/fieldOperator/StockOutSubmissions';
import InventoryView from '@/pages/warehouseManager/InventoryView';
import Unauthorized from '@/pages/Unauthorized';
import BarcodeLookup from "./pages/fieldOperator/BarcodeLookup";
import ManagerBarcodeLookup from "./pages/warehouseManager/BarcodeLookup";
import { Barcode } from "lucide-react";

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="/" element={<Index />} />

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
                  <StockOutSubmissions />
                </MainLayout>
              </RequireAuth>
            }
          />
          {
            path: "/operator/barcode",
            element: (
              <RequireAuth allowedRoles={["field_operator", "admin", "warehouse_manager"]}>
                <MainLayout>
                  <BarcodeLookup />
                </MainLayout>
              </RequireAuth>
            )
          },
          {
            path: "/manager/barcode",
            element: (
              <RequireAuth allowedRoles={["warehouse_manager", "admin"]}>
                <MainLayout>
                  <ManagerBarcodeLookup />
                </MainLayout>
              </RequireAuth>
            )
          },
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
