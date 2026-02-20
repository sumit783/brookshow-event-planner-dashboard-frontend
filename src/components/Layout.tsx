import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './layout/Sidebar';
import { MobileNav } from './layout/MobileNav';
import { cn } from '@/lib/utils';

export function Layout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  // Close sidebar when navigating on mobile
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  // Prevent scrolling when mobile sidebar is open
  useEffect(() => {
    if (isSidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isSidebarOpen]);

  return (
    <div className="flex min-h-screen w-full bg-gradient-dark">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar className="fixed left-0 top-0 h-screen w-64" />
      </div>

      {/* Mobile/Tablet Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Mobile/Tablet Sidebar */}
      <Sidebar
        onClose={() => setIsSidebarOpen(false)}
        className={cn(
          "fixed left-0 top-0 z-50 h-screen w-72 transition-transform duration-300 lg:hidden",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col lg:ml-64">
        <MobileNav onMenuClick={() => setIsSidebarOpen(true)} />

        <main className="flex-1 overflow-x-hidden">
          <div className="container mx-auto px-4 py-8 md:px-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
