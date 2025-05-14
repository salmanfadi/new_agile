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
import LoginPage from '@/pages/LoginPage';
import SignUpPage from '@/pages/SignUpPage';
import AdminDashboard from '@/pages/admin/AdminDashboard';
import WarehouseManagerDashboard from '@/pages/warehouseManager/WarehouseManagerDashboard';
import FieldOperatorDashboard from '@/pages/fieldOperator/FieldOperatorDashboard';
import SalesOperatorDashboard from '@/pages/salesOperator/SalesOperatorDashboard';
import CustomerDashboard from '@/pages/customer/CustomerDashboard';
import AdminStockInManagement from '@/pages/admin/StockInManagement';
import StockInProcessing from '@/pages/warehouseManager/StockInProcessing';
import AdminBatchStockInPage from '@/pages/admin/BatchStockInPage';
import AdminInventoryView from '@/pages/admin/InventoryView';
import InventoryView from '@/pages/warehouseManager/InventoryView';
import AdminStockOutManagement from '@/pages/admin/StockOutManagement';
import StockOutRequests from '@/pages/warehouseManager/StockOutRequests';
import AdminProfilesManagement from '@/pages/admin/ProfilesManagement';
import SalesInquiriesManagement from '@/pages/admin/SalesInquiriesManagement';
import BatchStockInPage from '@/pages/warehouseManager/BatchStockInPage';
import BatchInventoryPage from '@/pages/warehouse/BatchInventoryPage';
import BarcodeInventoryPage from '@/pages/warehouse/BarcodeInventoryPage';
import AdminBatchInventoryPage from '@/pages/admin/BatchInventoryPage';
import AdminBarcodeInventoryPage from '@/pages/admin/BarcodeInventoryPage';

// Define a function component for protected routes
const RequireAuth = ({ allowedRoles, children }: { allowedRoles: string[], children: JSX.Element }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>; // Show a loading indicator while checking authentication
  }

  if (!user) {
    // Redirect to login if not authenticated
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    // Redirect to unauthorized page or appropriate route if user doesn't have required role
    return <div>Unauthorized</div>;
  }

  return children;
};

// Define routes
const router = createBrowserRouter([
  {
    path: "/",
    element: <PublicLayout />,
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
    path: "/",
    element: <RequireAuth allowedRoles={['admin', 'warehouse_manager', 'field_operator', 'sales_operator']} />,
    children: [
      {
        path: "/",
        element: <MainLayout />,
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
            element: <AdminProfilesManagement />,
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
