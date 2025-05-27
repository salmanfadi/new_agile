import React from 'react';
import { useAuth } from '@/context/AuthContext';

export const AuthDebugger: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 p-4 bg-black/80 text-white rounded-lg text-xs space-y-2 max-w-xs z-50">
      <div className="font-bold">Auth Debug</div>
      <div>Loading: {String(isLoading)}</div>
      <div>Authenticated: {String(isAuthenticated)}</div>
      <div>User Role: {user?.role || 'none'}</div>
      <div>User Email: {user?.email || 'none'}</div>
      <div className="text-xs opacity-75 mt-2">
        Last Updated: {new Date().toLocaleTimeString()}
      </div>
    </div>
  );
}; 