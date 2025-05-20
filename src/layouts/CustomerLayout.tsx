
import React from 'react';
import { Navbar } from '@/components/layout/Navbar';

interface CustomerLayoutProps {
  children: React.ReactNode;
}

const CustomerLayout: React.FC<CustomerLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <main className="flex-grow p-4 sm:p-6 lg:p-8">{children}</main>
      <footer className="py-4 px-6 text-center text-sm text-gray-500">
        &copy; {new Date().getFullYear()} Inventory Management System
      </footer>
    </div>
  );
};

export default CustomerLayout;
