
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { MainLayout } from "@/components/layout/MainLayout";

// Pages
import Login from "./pages/Login";
import Unauthorized from "./pages/Unauthorized";
import NotFound from "./pages/NotFound";

// Admin pages
import AdminDashboard from "./pages/admin/AdminDashboard";

// Warehouse Manager pages
import ManagerDashboard from "./pages/warehouseManager/ManagerDashboard";
import InventoryView from "./pages/warehouseManager/InventoryView";

// Field Operator pages
import OperatorDashboard from "./pages/fieldOperator/OperatorDashboard";
import StockInForm from "./pages/fieldOperator/StockInForm";
import StockOutForm from "./pages/fieldOperator/StockOutForm";
import MySubmissions from "./pages/fieldOperator/MySubmissions";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/unauthorized" element={<Unauthorized />} />
            
            {/* Protected routes */}
            <Route element={<RequireAuth><MainLayout /></RequireAuth>}>
              {/* Dashboard route based on user role */}
              <Route path="/" element={
                <RequireAuth>
                  {({ user }) => {
                    switch (user.role) {
                      case 'admin':
                        return <AdminDashboard />;
                      case 'warehouse_manager':
                        return <ManagerDashboard />;
                      case 'field_operator':
                        return <OperatorDashboard />;
                      default:
                        return <Navigate to="/login" />;
                    }
                  }}
                </RequireAuth>
              } />
              
              {/* Admin routes */}
              <Route 
                path="/admin/*" 
                element={<RequireAuth allowedRoles={['admin']}><AdminDashboard /></RequireAuth>} 
              />
              
              {/* Warehouse Manager routes */}
              <Route 
                path="/manager" 
                element={<RequireAuth allowedRoles={['warehouse_manager']}><ManagerDashboard /></RequireAuth>} 
              />
              <Route 
                path="/manager/inventory" 
                element={<RequireAuth allowedRoles={['warehouse_manager']}><InventoryView /></RequireAuth>} 
              />
              
              {/* Field Operator routes */}
              <Route path="/operator" element={<RequireAuth allowedRoles={['field_operator']}><OperatorDashboard /></RequireAuth>} />
              <Route path="/operator/stock-in" element={<RequireAuth allowedRoles={['field_operator']}><StockInForm /></RequireAuth>} />
              <Route path="/operator/stock-out" element={<RequireAuth allowedRoles={['field_operator']}><StockOutForm /></RequireAuth>} />
              <Route path="/operator/submissions" element={<RequireAuth allowedRoles={['field_operator']}><MySubmissions /></RequireAuth>} />
            </Route>
            
            {/* Catch all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
