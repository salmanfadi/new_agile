
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { RequireAuth } from './components/auth/RequireAuth';
import Login from './pages/Login';
import NotFound from './pages/NotFound';
import AdminDashboard from './pages/admin/AdminDashboard';
import ManagerDashboard from './pages/warehouseManager/ManagerDashboard';
import InventoryView from './pages/warehouseManager/InventoryView';
import StockInProcessing from './pages/warehouseManager/StockInProcessing';
import StockOutApproval from './pages/warehouseManager/StockOutApproval';
import BarcodeLookup from './pages/warehouseManager/BarcodeLookup';
import AdminBatchStockInPage from './pages/admin/BatchStockInPage';
import BatchStockInPage from './pages/warehouseManager/BatchStockInPage';
import ProcessStockInPage from './pages/warehouseManager/ProcessStockInPage';

// Placeholder component for missing pages
const PlaceholderPage = ({ title }: { title: string }) => (
  <div className="p-8">
    <h1 className="text-2xl font-bold mb-4">{title} Page</h1>
    <p>This page is under construction.</p>
  </div>
);

// Placeholder components for missing pages
const Register = () => <PlaceholderPage title="Register" />;
const UserProfile = () => <PlaceholderPage title="User Profile" />;
const FieldOperatorDashboard = () => <PlaceholderPage title="Field Operator Dashboard" />;
const SalesOperatorDashboard = () => <PlaceholderPage title="Sales Operator Dashboard" />;
const CustomerDashboard = () => <PlaceholderPage title="Customer Dashboard" />;
const SalesInquiries = () => <PlaceholderPage title="Sales Inquiries" />;
const SalesInquiryDetails = () => <PlaceholderPage title="Sales Inquiry Details" />;
const Products = () => <PlaceholderPage title="Products" />;
const CreateProduct = () => <PlaceholderPage title="Create Product" />;
const EditProduct = () => <PlaceholderPage title="Edit Product" />;
const WarehouseManagement = () => <PlaceholderPage title="Warehouse Management" />;
const CreateWarehouse = () => <PlaceholderPage title="Create Warehouse" />;
const EditWarehouse = () => <PlaceholderPage title="Edit Warehouse" />;
const WarehouseLocations = () => <PlaceholderPage title="Warehouse Locations" />;
const CreateWarehouseLocation = () => <PlaceholderPage title="Create Warehouse Location" />;
const EditWarehouseLocation = () => <PlaceholderPage title="Edit Warehouse Location" />;
const UsersManagement = () => <PlaceholderPage title="Users Management" />;
const CreateUser = () => <PlaceholderPage title="Create User" />;
const EditUser = () => <PlaceholderPage title="Edit User" />;
const StockOutRequests = () => <PlaceholderPage title="Stock Out Requests" />;
const CreateStockOutRequest = () => <PlaceholderPage title="Create Stock Out Request" />;
const EditStockOutRequest = () => <PlaceholderPage title="Edit Stock Out Request" />;
const SalesDashboard = () => <PlaceholderPage title="Sales Dashboard" />;
const Customers = () => <PlaceholderPage title="Customers" />;
const CreateCustomer = () => <PlaceholderPage title="Create Customer" />;
const EditCustomer = () => <PlaceholderPage title="Edit Customer" />;
const CustomerOrders = () => <PlaceholderPage title="Customer Orders" />;
const CreateCustomerOrder = () => <PlaceholderPage title="Create Customer Order" />;
const EditCustomerOrder = () => <PlaceholderPage title="Edit Customer Order" />;

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
