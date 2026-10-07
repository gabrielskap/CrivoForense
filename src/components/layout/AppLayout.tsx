import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { UserSwitcherBar } from '../common/UserSwitcherBar';

export const AppLayout: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-[#0a0e14] text-[#f4efe3] font-sans antialiased">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <Header sidebarCollapsed={sidebarCollapsed} />

      <main
        className={`pt-20 min-h-screen transition-all duration-300 ease-in-out ${
          sidebarCollapsed ? 'pl-20' : 'pl-64'
        }`}
      >
        <UserSwitcherBar />
        <div className="p-6 md:p-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
