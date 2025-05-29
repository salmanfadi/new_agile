import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

const AdminRoute = () => {
  const { user } = useAuth();

  // Check if user is admin or warehouse manager
  if (!user || (user.role !== 'admin' && user.role !== 'warehouse_manager')) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

export default AdminRoute; 