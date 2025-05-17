
import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Header from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';

export const MainLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header
        isCollapsed={!isSidebarOpen}
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
      />
      <div className="flex flex-1">
        <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
        <main className={`flex-1 p-6 transition-all duration-300 ${isSidebarOpen ? 'md:ml-64' : ''}`}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};
