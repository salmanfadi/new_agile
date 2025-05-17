
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { RequireAuth } from './components/auth/RequireAuth';
import MainLayout from './layouts/MainLayout';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import ManagerDashboard from './pages/warehouseManager/ManagerDashboard';
import SalesOperatorDashboard from './pages/salesOperator/SalesOperatorDashboard';
import CustomerPortal from './pages/customer/CustomerPortal';
import StockInManagement from './pages/admin/StockInManagement';
import StockOutManagement from './pages/admin/StockOutManagement';
import AllBatchesPage from './pages/warehouseManager/AllBatchesPage';
import BatchOverviewPage from './pages/warehouseManager/BatchOverviewPage';
import BatchStockInPage from './pages/admin/BatchStockInPage';
import StockInDetailsPage from './pages/warehouseManager/StockInDetailsPage';
import ReportsDashboard from './pages/reports/ReportsDashboard';
import Index from './pages/Index';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 1000,
    },
  },
});

function App() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleStatusChange = () => {
      setIsOnline(navigator.onLine);
    };

    window.addEventListener('online', handleStatusChange);
    window.addEventListener('offline', handleStatusChange);

    return () => {
      window.removeEventListener('online', handleStatusChange);
      window.removeEventListener('offline', handleStatusChange);
    };
  }, []);
  
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
          {!isOnline && (
            <div className="fixed top-0 left-0 w-full bg-red-500 text-white text-center py-2 z-50">
              You are currently offline. Some features may not be available.
            </div>
          )}
          <Routes>
            {/* Default Route */}
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            
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
            <Route
              path="/admin/stock-in" 
              element={
                <RequireAuth allowedRoles={['admin']}>
                  <MainLayout>
                    <StockInManagement />
                  </MainLayout>
                </RequireAuth>
              }
            />
            <Route
              path="/admin/stock-in/batch/:stockInId" 
              element={
                <RequireAuth allowedRoles={['admin']}>
                  <MainLayout>
                    <BatchStockInPage />
                  </MainLayout>
                </RequireAuth>
              }
            />
            <Route
              path="/admin/stock-out" 
              element={
                <RequireAuth allowedRoles={['admin']}>
                  <MainLayout>
                    <StockOutManagement />
                  </MainLayout>
                </RequireAuth>
              }
            />
            <Route
              path="/admin/stock-in/batches/:stockInId" 
              element={
                <RequireAuth allowedRoles={['admin']}>
                  <MainLayout>
                    <BatchOverviewPage />
                  </MainLayout>
                </RequireAuth>
              }
            />
            <Route
              path="/admin/stock-in/batches" 
              element={
                <RequireAuth allowedRoles={['admin']}>
                  <MainLayout>
                    <AllBatchesPage />
                  </MainLayout>
                </RequireAuth>
              }
            />

            {/* Manager Routes */}
            <Route
              path="/manager" 
              element={
                <RequireAuth allowedRoles={['warehouse_manager']}>
                  <MainLayout>
                    <ManagerDashboard />
                  </MainLayout>
                </RequireAuth>
              }
            />
            <Route
              path="/manager/stock-in/details/:stockInId" 
              element={
                <RequireAuth allowedRoles={['warehouse_manager']}>
                  <MainLayout>
                    <StockInDetailsPage />
                  </MainLayout>
                </RequireAuth>
              }
            />
            <Route
              path="/manager/stock-in/batches/:stockInId" 
              element={
                <RequireAuth allowedRoles={['warehouse_manager']}>
                  <MainLayout>
                    <BatchOverviewPage />
                  </MainLayout>
                </RequireAuth>
              }
            />
            <Route
              path="/manager/stock-in/batches" 
              element={
                <RequireAuth allowedRoles={['warehouse_manager']}>
                  <MainLayout>
                    <AllBatchesPage />
                  </MainLayout>
                </RequireAuth>
              }
            />
            <Route
              path="/manager/stock-in/batch/:stockInId" 
              element={
                <RequireAuth allowedRoles={['warehouse_manager']}>
                  <MainLayout>
                    <BatchStockInPage />
                  </MainLayout>
                </RequireAuth>
              }
            />

            {/* Sales Operator Routes */}
            <Route
              path="/sales" 
              element={
                <RequireAuth allowedRoles={['sales_operator']}>
                  <MainLayout>
                    <SalesOperatorDashboard />
                  </MainLayout>
                </RequireAuth>
              }
            />

            {/* Customer Routes */}
            <Route
              path="/customer/portal" 
              element={
                <RequireAuth allowedRoles={['customer']}>
                  <MainLayout>
                    <CustomerPortal />
                  </MainLayout>
                </RequireAuth>
              }
            />
            
            {/* Reports Routes */}
            <Route
              path="/reports" 
              element={
                <RequireAuth allowedRoles={['admin', 'warehouse_manager']}>
                  <MainLayout>
                    <ReportsDashboard />
                  </MainLayout>
                </RequireAuth>
              }
            />
          </Routes>
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
