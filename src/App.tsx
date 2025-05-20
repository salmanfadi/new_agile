
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './components/theme-provider';
import { Toaster } from '@/components/ui/toaster';

// Auth Layouts
import { PublicLayout } from '@/layouts/PublicLayout';
import MainLayout from '@/layouts/MainLayout';

// Auth Pages
import Login from '@/pages/auth/Login';
import Register from '@/pages/auth/Register';

// Index Page
import Index from '@/pages/Index';

// Admin Pages
import AdminDashboard from '@/pages/admin/AdminDashboard';
import AdminEnhancedInventoryView from '@/pages/admin/EnhancedInventoryView';
import AdminBatchInventoryPage from '@/pages/admin/BatchInventoryPage';

// Warehouse Pages
import BatchManagementPage from '@/pages/warehouse/BatchManagementPage';
import BarcodePrintPage from '@/pages/warehouse/BarcodePrintPage';
import BatchDetailsPage from '@/pages/warehouse/BatchDetailsPage';
import BoxDetailsPage from '@/pages/warehouse/BoxDetailsPage';

// Shared Pages
import NotFound from '@/pages/NotFound';

// Auth Components
import { RequireAuth } from '@/components/auth/RequireAuth';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
        <div className="min-h-screen flex flex-col">
          <Toaster />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route
              path="/login"
              element={
                <PublicLayout>
                  <Login />
                </PublicLayout>
              }
            />
            <Route path="/register" element={<Register />} />
            
            {/* Admin Routes */}
            <Route element={<RequireAuth allowedRoles={['admin']} />}>
              <Route
                path="/admin/*"
                element={
                  <MainLayout>
                    <Routes>
                      <Route index element={<AdminDashboard />} />
                      <Route path="inventory" element={<AdminEnhancedInventoryView />} />
                      <Route path="inventory/batch" element={<AdminBatchInventoryPage />} />
                      <Route path="inventory/batch/:batchId" element={<BatchDetailsPage />} />
                      <Route path="inventory/box/:barcode" element={<BoxDetailsPage />} />
                      <Route path="inventory/barcodes/:batchId" element={<BarcodePrintPage />} />
                    </Routes>
                  </MainLayout>
                }
              />
            </Route>

            {/* Fallback route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
