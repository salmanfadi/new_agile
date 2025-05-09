
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
