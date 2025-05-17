import React from 'react';
import {
  createBrowserRouter,
  RouterProvider,
  Route,
  Outlet,
  Navigate
} from "react-router-dom";
import { useAuth } from '@/context/AuthContext';
import { MainLayout } from '@/layouts/MainLayout';
import { PublicLayout } from '@/layouts/PublicLayout';
import LoginPage from './pages/Login';
import SignUpPage from './pages/Index';
import AdminDashboard from '@/pages/admin/AdminDashboard';
import WarehouseManagerDashboard from './pages/warehouseManager/ManagerDashboard';
import FieldOperatorDashboard from './pages/fieldOperator/OperatorDashboard';
import SalesOperatorDashboard from '@/pages/salesOperator/SalesOperatorDashboard';
import CustomerDashboard from './pages/customer/CustomerPortal';
import AdminStockInManagement from '@/pages/admin/StockInManagement';
import StockInProcessing from '@/pages/warehouseManager/StockInProcessing';
import AdminBatchStockInPage from '@/pages/admin/BatchStockInPage';
import AdminInventoryView from '@/pages/admin/InventoryView';
import InventoryView from '@/pages/warehouseManager/InventoryView';
import AdminStockOutManagement from '@/pages/admin/StockOutManagement';
import StockOutRequests from './pages/warehouseManager/StockOutApproval';
import UsersManagement from './pages/admin/UsersManagement';
import SalesInquiriesManagement from './pages/admin/SalesInquiries';
import BatchStockInPage from '@/pages/warehouseManager/BatchStockInPage';
import BatchInventoryPage from '@/pages/warehouse/BatchInventoryPage';
import BarcodeInventoryPage from '@/pages/warehouse/BarcodeInventoryPage';
import AdminBatchInventoryPage from '@/pages/admin/BatchInventoryPage';
import AdminBarcodeInventoryPage from '@/pages/admin/BarcodeInventoryPage';
import { RequireAuth } from '@/components/auth/RequireAuth';
import UnauthorizedPage from '@/pages/Unauthorized';
import { UserRole } from '@/types/auth';
import StockInForm from '@/pages/fieldOperator/StockInForm';
import StockOutForm from '@/pages/fieldOperator/StockOutForm';
import BarcodeLookup from '@/pages/fieldOperator/BarcodeLookup';
import ProcessStockInPage from './pages/warehouseManager/ProcessStockInPage';
import CustomerLogin from './pages/customer/CustomerLogin';
import InventoryTransfers from './pages/warehouseManager/InventoryTransfers';
import AdminInventoryTransfers from './pages/admin/InventoryTransfers';
import FieldOperatorTransfers from './pages/fieldOperator/Transfers';
import FieldOperatorSubmissions from './pages/fieldOperator/Submissions';
import FieldOperatorSettings from './pages/fieldOperator/Settings';

// Define routes
const router = createBrowserRouter([
  {
    path: "/",
    element: <PublicLayout><Outlet /></PublicLayout>,
    children: [
      {
        path: "login",
        element: <LoginPage />,
      },
      {
        path: "signup",
        element: <SignUpPage />,
      },
      {
        path: "customer/login",
        element: <CustomerLogin />,
      },
      {
        path: "",
        element: <Navigate to="/login" replace />,
      }
    ]
  },
  {
    path: "/unauthorized",
    element: <UnauthorizedPage />
  },
  {
    path: "/",
    element: (
      <RequireAuth>
        <MainLayout />
      </RequireAuth>
    ),
    children: [
      {
        path: "admin",
        element: <RequireAuth allowedRoles={['admin']}><AdminDashboard /></RequireAuth>,
      },
      {
        path: "manager",
        element: <RequireAuth allowedRoles={['warehouse_manager']}><WarehouseManagerDashboard /></RequireAuth>,
      },
      {
        path: "field",
        element: <RequireAuth allowedRoles={['field_operator']}><FieldOperatorDashboard /></RequireAuth>,
      },
      {
        path: "field/stock-in",
        element: <RequireAuth allowedRoles={['field_operator']}><StockInForm /></RequireAuth>,
      },
      {
        path: "field/stock-out",
        element: <RequireAuth allowedRoles={['field_operator']}><StockOutForm /></RequireAuth>,
      },
      {
        path: "field/submissions",
        element: <RequireAuth allowedRoles={['field_operator']}><FieldOperatorSubmissions /></RequireAuth>,
      },
      {
        path: "field/barcode-lookup",
        element: <RequireAuth allowedRoles={['field_operator']}><BarcodeLookup /></RequireAuth>,
      },
      {
        path: "field/transfers",
        element: <RequireAuth allowedRoles={['field_operator']}><FieldOperatorTransfers /></RequireAuth>,
      },
      {
        path: "sales",
        element: <RequireAuth allowedRoles={['sales_operator']}><SalesOperatorDashboard /></RequireAuth>,
      },
      {
        path: "customer/portal",
        element: <RequireAuth allowedRoles={['customer']}><CustomerDashboard /></RequireAuth>,
      },
      {
        path: "admin/stock-in",
        element: <RequireAuth allowedRoles={['admin']}><AdminStockInManagement /></RequireAuth>,
      },
      {
        path: "manager/stock-in",
        element: <RequireAuth allowedRoles={['warehouse_manager']}><StockInProcessing /></RequireAuth>,
      },
      {
        path: "admin/stock-in/batch",
        element: <RequireAuth allowedRoles={['admin']}><AdminBatchStockInPage /></RequireAuth>,
      },
      {
        path: "admin/stock-in/batch/:stockInId",
        element: <RequireAuth allowedRoles={['admin']}><AdminBatchStockInPage /></RequireAuth>,
      },
      {
        path: "manager/stock-in/batch",
        element: <RequireAuth allowedRoles={['warehouse_manager']}><BatchStockInPage /></RequireAuth>,
      },
      {
        path: "manager/stock-in/batch/:stockInId",
        element: <RequireAuth allowedRoles={['warehouse_manager']}><BatchStockInPage /></RequireAuth>,
      },
      {
        path: "admin/inventory",
        element: <RequireAuth allowedRoles={['admin']}><AdminInventoryView /></RequireAuth>,
      },
      {
        path: "manager/inventory",
        element: <RequireAuth allowedRoles={['warehouse_manager']}><InventoryView /></RequireAuth>,
      },
      {
        path: "admin/stock-out",
        element: <RequireAuth allowedRoles={['admin']}><AdminStockOutManagement /></RequireAuth>,
      },
      {
        path: "manager/stock-out",
        element: <RequireAuth allowedRoles={['warehouse_manager']}><StockOutRequests /></RequireAuth>,
      },
      {
        path: "admin/users",
        element: <RequireAuth allowedRoles={['admin']}><UsersManagement /></RequireAuth>,
      },
      {
        path: "admin/products",
        element: <RequireAuth allowedRoles={['admin']}><AdminDashboard /></RequireAuth>, // Placeholder for product management
      },
      {
        path: "admin/warehouses",
        element: <RequireAuth allowedRoles={['admin']}><AdminDashboard /></RequireAuth>, // Placeholder for warehouse management
      },
      {
        path: "admin/profiles",
        element: <RequireAuth allowedRoles={['admin']}><UsersManagement /></RequireAuth>,
      },
      {
        path: "admin/sales-inquiries",
        element: <RequireAuth allowedRoles={['admin']}><SalesInquiriesManagement /></RequireAuth>,
      },
      {
        path: "admin/inventory/batches",
        element: <RequireAuth allowedRoles={['admin']}><AdminBatchInventoryPage /></RequireAuth>,
      },
      {
        path: "admin/inventory/barcodes/:batchId",
        element: <RequireAuth allowedRoles={['admin']}><AdminBarcodeInventoryPage /></RequireAuth>,
      },
      {
        path: "manager/inventory/batches",
        element: <RequireAuth allowedRoles={['warehouse_manager']}><BatchInventoryPage /></RequireAuth>,
      },
      {
        path: "manager/inventory/barcodes/:batchId",
        element: <RequireAuth allowedRoles={['warehouse_manager']}><BarcodeInventoryPage /></RequireAuth>,
      },
      {
        path: "manager/stock-in/process/:stockInId",
        element: <RequireAuth allowedRoles={['warehouse_manager']}><ProcessStockInPage /></RequireAuth>,
      },
      {
        path: "manager/transfers",
        element: <RequireAuth allowedRoles={['warehouse_manager']}><InventoryTransfers /></RequireAuth>,
      },
      {
        path: "admin/transfers",
        element: <RequireAuth allowedRoles={['admin']}><AdminInventoryTransfers /></RequireAuth>,
      },
    ]
  },
  {
    path: "*",
    element: <Navigate to="/login" replace />
  }
]);

function App() {
  return (
    <RouterProvider router={router} />
  );
}

export default App;
