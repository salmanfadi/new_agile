import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { RequireAuth } from './components/auth/RequireAuth';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/admin/AdminDashboard';
import ManagerDashboard from './pages/warehouseManager/ManagerDashboard';
import FieldOperatorDashboard from './pages/fieldOperator/FieldOperatorDashboard';
import SalesOperatorDashboard from './pages/salesOperator/SalesOperatorDashboard';
import CustomerDashboard from './pages/customer/CustomerDashboard';
import NotFound from './pages/NotFound';
import UserProfile from './pages/UserProfile';
import InventoryView from './pages/warehouseManager/InventoryView';
import StockInProcessing from './pages/warehouseManager/StockInProcessing';
import StockOutApproval from './pages/warehouseManager/StockOutApproval';
import BarcodeLookup from './pages/warehouseManager/BarcodeLookup';
import SalesInquiries from './pages/salesOperator/SalesInquiries';
import SalesInquiryDetails from './pages/salesOperator/SalesInquiryDetails';
import Products from './pages/admin/Products';
import CreateProduct from './pages/admin/CreateProduct';
import EditProduct from './pages/admin/EditProduct';
import WarehouseManagement from './pages/admin/WarehouseManagement';
import CreateWarehouse from './pages/admin/CreateWarehouse';
import EditWarehouse from './pages/admin/EditWarehouse';
import WarehouseLocations from './pages/admin/WarehouseLocations';
import CreateWarehouseLocation from './pages/admin/CreateWarehouseLocation';
import EditWarehouseLocation from './pages/admin/EditWarehouseLocation';
import UsersManagement from './pages/admin/UsersManagement';
import CreateUser from './pages/admin/CreateUser';
import EditUser from './pages/admin/EditUser';
import StockOutRequests from './pages/fieldOperator/StockOutRequests';
import CreateStockOutRequest from './pages/fieldOperator/CreateStockOutRequest';
import EditStockOutRequest from './pages/fieldOperator/EditStockOutRequest';
import SalesDashboard from './pages/salesOperator/SalesDashboard';
import Customers from './pages/admin/Customers';
import CreateCustomer from './pages/admin/CreateCustomer';
import EditCustomer from './pages/admin/EditCustomer';
import CustomerOrders from './pages/customer/CustomerOrders';
import CreateCustomerOrder from './pages/customer/CreateCustomerOrder';
import EditCustomerOrder from './pages/customer/EditCustomerOrder';
import AdminBatchStockInPage from './pages/admin/BatchStockInPage';
import BatchStockInPage from './pages/warehouseManager/BatchStockInPage';
import ProcessStockInPage from './pages/warehouseManager/ProcessStockInPage';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<Login />} />

          {/* Protected User Profile Route */}
          <Route path="/profile" element={<RequireAuth><UserProfile /></RequireAuth>} />

          {/* Protected Admin Routes */}
          <Route path="/admin" element={<RequireAuth allowedRoles={['admin']}><AdminDashboard /></RequireAuth>} />
          <Route path="/admin/products" element={<RequireAuth allowedRoles={['admin']}><Products /></RequireAuth>} />
          <Route path="/admin/products/create" element={<RequireAuth allowedRoles={['admin']}><CreateProduct /></RequireAuth>} />
          <Route path="/admin/products/edit/:productId" element={<RequireAuth allowedRoles={['admin']}><EditProduct /></RequireAuth>} />
          <Route path="/admin/warehouses" element={<RequireAuth allowedRoles={['admin']}><WarehouseManagement /></RequireAuth>} />
          <Route path="/admin/warehouses/create" element={<RequireAuth allowedRoles={['admin']}><CreateWarehouse /></RequireAuth>} />
          <Route path="/admin/warehouses/edit/:warehouseId" element={<RequireAuth allowedRoles={['admin']}><EditWarehouse /></RequireAuth>} />
          <Route path="/admin/warehouses/:warehouseId/locations" element={<RequireAuth allowedRoles={['admin']}><WarehouseLocations /></RequireAuth>} />
          <Route path="/admin/warehouses/:warehouseId/locations/create" element={<RequireAuth allowedRoles={['admin']}><CreateWarehouseLocation /></RequireAuth>} />
          <Route path="/admin/warehouses/:warehouseId/locations/edit/:locationId" element={<RequireAuth allowedRoles={['admin']}><EditWarehouseLocation /></RequireAuth>} />
          <Route path="/admin/users" element={<RequireAuth allowedRoles={['admin']}><UsersManagement /></RequireAuth>} />
          <Route path="/admin/users/create" element={<RequireAuth allowedRoles={['admin']}><CreateUser /></RequireAuth>} />
          <Route path="/admin/users/edit/:userId" element={<RequireAuth allowedRoles={['admin']}><EditUser /></RequireAuth>} />
          <Route path="/admin/customers" element={<RequireAuth allowedRoles={['admin']}><Customers /></RequireAuth>} />
          <Route path="/admin/customers/create" element={<RequireAuth allowedRoles={['admin']}><CreateCustomer /></RequireAuth>} />
          <Route path="/admin/customers/edit/:customerId" element={<RequireAuth allowedRoles={['admin']}><EditCustomer /></RequireAuth>} />
          
          {/* Add this line to existing admin routes */}
          <Route path="/admin/stock-in/batch/:stockInId?" element={<RequireAuth allowedRoles={['admin']}><AdminBatchStockInPage /></RequireAuth>} />

          {/* Protected Warehouse Manager Routes */}
          <Route path="/manager" element={<RequireAuth allowedRoles={['warehouse_manager']}><ManagerDashboard /></RequireAuth>} />
          <Route path="/manager/inventory" element={<RequireAuth allowedRoles={['warehouse_manager']}><InventoryView /></RequireAuth>} />
          <Route path="/manager/stock-in" element={<RequireAuth allowedRoles={['warehouse_manager']}><StockInProcessing /></RequireAuth>} />
          <Route path="/manager/stock-out" element={<RequireAuth allowedRoles={['warehouse_manager']}><StockOutApproval /></RequireAuth>} />
          <Route path="/manager/barcode" element={<RequireAuth allowedRoles={['warehouse_manager']}><BarcodeLookup /></RequireAuth>} />
          
          {/* Add this line for the warehouse manager batch processing route */}
          <Route path="/manager/stock-in/batch/:stockInId?" element={<RequireAuth allowedRoles={['warehouse_manager']}><BatchStockInPage /></RequireAuth>} />
          <Route path="/manager/stock-in/process/:stockInId" element={<RequireAuth allowedRoles={['warehouse_manager']}><ProcessStockInPage /></RequireAuth>} />

          {/* Protected Field Operator Routes */}
          <Route path="/field-operator" element={<RequireAuth allowedRoles={['field_operator']}><FieldOperatorDashboard /></RequireAuth>} />
          <Route path="/field-operator/stock-out" element={<RequireAuth allowedRoles={['field_operator']}><StockOutRequests /></RequireAuth>} />
          <Route path="/field-operator/stock-out/create" element={<RequireAuth allowedRoles={['field_operator']}><CreateStockOutRequest /></RequireAuth>} />
          <Route path="/field-operator/stock-out/edit/:stockOutId" element={<RequireAuth allowedRoles={['field_operator']}><EditStockOutRequest /></RequireAuth>} />

          {/* Protected Sales Operator Routes */}
          <Route path="/sales" element={<RequireAuth allowedRoles={['sales_operator']}><SalesOperatorDashboard /></RequireAuth>} />
          <Route path="/sales/dashboard" element={<RequireAuth allowedRoles={['sales_operator']}><SalesDashboard /></RequireAuth>} />
          <Route path="/sales/inquiries" element={<RequireAuth allowedRoles={['sales_operator']}><SalesInquiries /></RequireAuth>} />
          <Route path="/sales/inquiries/:inquiryId" element={<RequireAuth allowedRoles={['sales_operator']}><SalesInquiryDetails /></RequireAuth>} />

          {/* Customer Routes */}
          <Route path="/customer" element={<RequireAuth allowedRoles={['customer']}><CustomerDashboard /></RequireAuth>} />
          <Route path="/customer/orders" element={<RequireAuth allowedRoles={['customer']}><CustomerOrders /></RequireAuth>} />
          <Route path="/customer/orders/create" element={<RequireAuth allowedRoles={['customer']}><CreateCustomerOrder /></RequireAuth>} />
          <Route path="/customer/orders/edit/:orderId" element={<RequireAuth allowedRoles={['customer']}><EditCustomerOrder /></RequireAuth>} />

          {/* Catch All - 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
