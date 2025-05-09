
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
import ProcessStockInPage from '@/pages/warehouseManager/ProcessStockInPage';
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
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Customer facing routes
import CustomerLanding from '@/pages/customer/CustomerLanding';
import CustomerProducts from '@/pages/customer/CustomerProducts';
import CustomerInquiry from '@/pages/customer/CustomerInquiry';
import CustomerInquirySuccess from '@/pages/customer/CustomerInquirySuccess';
import CustomerLogin from '@/pages/customer/CustomerLogin';
import CustomerPortal from '@/pages/customer/CustomerPortal';

// Create a client
const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/unauthorized" element={<Unauthorized />} />

            {/* Admin Routes */}
            <Route path="/admin" element={<RequireAuth allowedRoles={['admin']} />}>
              <Route element={<MainLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="products" element={<ProductManagement />} />
                <Route path="warehouses" element={<WarehouseManagement />} />
                <Route path="inventory" element={<AdminInventoryView />} />
                <Route path="barcodes" element={<BarcodeManagement />} />
                <Route path="sales-inquiries" element={<SalesInquiries />} />
                <Route path="users" element={<UsersManagement />} />
              </Route>
            </Route>

            {/* Warehouse Manager Routes */}
            <Route path="/manager" element={<RequireAuth allowedRoles={['warehouse_manager']} />}>
              <Route element={<MainLayout />}>
                <Route index element={<ManagerDashboard />} />
                <Route path="stock-in" element={<StockInProcessing />} />
                <Route path="process-stock-in/:stockInId" element={<ProcessStockInPage />} />
                <Route path="stock-out" element={<StockOutApproval />} />
                <Route path="inventory" element={<InventoryView />} />
                <Route path="barcode-lookup" element={<ManagerBarcodeLookup />} />
              </Route>
            </Route>

            {/* Field Operator Routes */}
            <Route path="/operator" element={<RequireAuth allowedRoles={['field_operator']} />}>
              <Route element={<MainLayout />}>
                <Route index element={<OperatorDashboard />} />
                <Route path="stock-in" element={<StockInForm />} />
                <Route path="stock-out" element={<StockOutForm />} />
                <Route path="my-submissions" element={<MySubmissions />} />
                <Route path="barcode-lookup" element={<BarcodeLookup />} />
              </Route>
            </Route>

            {/* Sales Operator Routes */}
            <Route path="/sales" element={<RequireAuth allowedRoles={['sales_operator']} />}>
              <Route element={<MainLayout />}>
                <Route index element={<SalesOperatorDashboard />} />
                <Route path="inquiries" element={<SalesInquiriesManagement />} />
                <Route path="inventory" element={<SalesInventoryView />} />
              </Route>
            </Route>

            {/* Shared Route for Barcode Scanner */}
            <Route path="/scan" element={<RequireAuth allowedRoles={['warehouse_manager', 'field_operator', 'admin']} />}>
              <Route element={<MainLayout />}>
                <Route index element={<BarcodeScannerPage />} />
              </Route>
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
              <Route path="portal" element={<CustomerPortal />} />
            </Route>
          </Routes>
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  );
};

export default App;
