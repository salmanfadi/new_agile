import React, { useState, ReactNode, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { useMobileDetector } from '@/hooks/use-mobile.tsx'; // Updated import with explicit .tsx extension

interface MainLayoutProps {
  children?: ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const isMobile = useMobileDetector();
  const location = useLocation();
  
  // On mobile, sidebar should be closed by default
  const [isSidebarOpen, setIsSidebarOpen] = useState(!isMobile);
  
  // Close sidebar on route change if mobile
  useEffect(() => {
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  }, [location.pathname, isMobile]);
  
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900">
      <Header
        isCollapsed={!isSidebarOpen}
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
      />
      <div className="flex flex-1">
        <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
        <main className={`flex-1 p-6 transition-all duration-300 ${isSidebarOpen ? 'md:ml-64' : ''}`}>
          <div className="max-w-7xl mx-auto">
            {children || <Outlet />}
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
