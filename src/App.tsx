
import React from 'react';
import {
  createBrowserRouter,
  RouterProvider,
  Route,
  Outlet,
  Navigate
} from "react-router-dom";
import { useAuth } from '@/context/AuthContext';
import { MainLayout } from '@/components/layout/MainLayout';
import { PublicLayout } from '@/components/layout/PublicLayout';
import LoginPage from './pages/Login';
import SignUpPage from './pages/Index'; // Using Index as SignUpPage for now
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
import ProfilesManagement from './pages/admin/UsersManagement';
import SalesInquiriesManagement from './pages/admin/SalesInquiries';
import BatchStockInPage from '@/pages/warehouseManager/BatchStockInPage';
import BatchInventoryPage from '@/pages/warehouse/BatchInventoryPage';
import BarcodeInventoryPage from '@/pages/warehouse/BarcodeInventoryPage';
import AdminBatchInventoryPage from '@/pages/admin/BatchInventoryPage';
import AdminBarcodeInventoryPage from '@/pages/admin/BarcodeInventoryPage';
import { RequireAuth } from '@/components/auth/RequireAuth';
import UnauthorizedPage from '@/pages/Unauthorized';
import { UserRole } from '@/types/auth';

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
    ]
  },
  {
    path: "/unauthorized",
    element: <UnauthorizedPage />
  },
  {
    path: "/",
    element: 
      <RequireAuth allowedRoles={['admin', 'warehouse_manager', 'field_operator', 'sales_operator'] as UserRole[]}>
        <MainLayout>
          <Outlet />
        </MainLayout>
      </RequireAuth>,
    children: [
      {
        path: "admin",
        element: <AdminDashboard />,
      },
      {
        path: "manager",
        element: <WarehouseManagerDashboard />,
      },
      {
        path: "field",
        element: <FieldOperatorDashboard />,
      },
      {
        path: "sales",
        element: <SalesOperatorDashboard />,
      },
      {
        path: "customer",
        element: <CustomerDashboard />,
      },
      {
        path: "admin/stock-in",
        element: <AdminStockInManagement />,
      },
      {
        path: "manager/stock-in",
        element: <StockInProcessing />,
      },
      {
        path: "admin/stock-in/batch",
        element: <AdminBatchStockInPage />,
      },
      {
        path: "admin/stock-in/batch/:stockInId",
        element: <AdminBatchStockInPage />,
      },
      {
        path: "manager/stock-in/batch",
        element: <BatchStockInPage />,
      },
      {
        path: "manager/stock-in/batch/:stockInId",
        element: <BatchStockInPage />,
      },
      {
        path: "admin/inventory",
        element: <AdminInventoryView />,
      },
      {
        path: "manager/inventory",
        element: <InventoryView />,
      },
      {
        path: "admin/stock-out",
        element: <AdminStockOutManagement />,
      },
      {
        path: "manager/stock-out",
        element: <StockOutRequests />,
      },
      {
        path: "admin/profiles",
        element: <ProfilesManagement />,
      },
      {
        path: "admin/sales-inquiries",
        element: <SalesInquiriesManagement />,
      },
      
      // Admin routes
      {
        path: "admin/inventory/batches",
        element: <AdminBatchInventoryPage />
      },
      {
        path: "admin/inventory/barcodes/:batchId",
        element: <AdminBarcodeInventoryPage />
      },
      
      // Manager routes
      {
        path: "manager/inventory/batches",
        element: <BatchInventoryPage />
      },
      {
        path: "manager/inventory/barcodes/:batchId",
        element: <BarcodeInventoryPage />
      }
    ]
  },
  {
    path: "*",
    element: <div>Page not found</div>
  }
]);

function App() {
  return (
    <RouterProvider router={router} />
  );
}

export default App;
