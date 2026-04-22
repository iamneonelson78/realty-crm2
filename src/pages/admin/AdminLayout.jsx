import { Outlet, Link, useLocation } from 'react-router-dom';
import { Users, LayoutDashboard, Menu, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import TopHeader from '../../components/TopHeader';
import Watermark from '../../components/Watermark';

export default function AdminLayout() {
  const location = useLocation();
  const appVersion = import.meta.env.VITE_APP_VERSION || '0.0.1';
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem('realty:admin-nav-collapsed') === 'true';
  });
  
  const navItems = [
    { path: '/admin', exact: true, icon: <LayoutDashboard className="w-5 h-5 flex-shrink-0" />, label: 'Dashboard' },
    { path: '/admin/access', exact: false, icon: <Users className="w-5 h-5 flex-shrink-0" />, label: 'Access Control' },
  ];

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem('realty:admin-nav-collapsed', String(isCollapsed));
  }, [isCollapsed]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleStorage = (event) => {
      if (event.key !== 'realty:admin-nav-collapsed') return;
      setIsCollapsed(event.newValue === 'true');
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  return (
    <div className="h-screen bg-slate-50 dark:bg-slate-950 flex flex-col transition-colors overflow-hidden">
      <TopHeader />

      <div className="flex-1 flex overflow-hidden relative">
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-20 bg-slate-900/60 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
        )}

        {/* Sidebar */}
        <aside className={`fixed md:relative inset-y-0 left-0 z-30 ${isCollapsed ? 'w-20' : 'w-64'} bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col shadow-lg md:shadow-none transform transition-[width,transform] duration-300 ease-in-out overflow-visible ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
          
          {/* Mobile Header */}
          <div className="md:hidden p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
            <span className="font-bold text-slate-800 dark:text-white">Admin</span>
            <button className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200" onClick={() => setMobileMenuOpen(false)}>
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Collapse Button — straddling right border, inline with first nav item */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden md:flex absolute top-3 -right-3.5 items-center justify-center w-7 h-7 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-full text-slate-500 dark:text-slate-400 hover:bg-brand-600 hover:text-white hover:border-brand-600 shadow-md transition-all duration-200 z-50"
          >
            {isCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
          </button>

          <nav className="flex-1 px-3 space-y-2 overflow-y-auto pt-10">
            {navItems.map((item) => {
              const isActive = item.exact ? location.pathname === item.path : location.pathname.includes(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center font-medium transition-all duration-300 ease-in-out group ${
                    isCollapsed
                      ? 'justify-center w-11 h-11 mx-auto rounded-full p-0'
                      : 'gap-3 px-3 py-3 rounded-full w-full'
                  } ${
                    isActive
                      ? 'bg-brand-700 text-white shadow-lg shadow-brand-500/30 dark:shadow-brand-900/40 -translate-y-0.5'
                      : 'text-slate-600 hover:bg-slate-200 hover:text-slate-900 hover:shadow-md hover:-translate-y-0.5 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-white dark:hover:shadow-slate-900/50'
                  }`}
                  title={isCollapsed ? item.label : ''}
                >
                  {item.icon}
                  <span
                    className={`text-sm whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out ${
                      isCollapsed ? 'max-w-0 opacity-0 ml-0' : 'max-w-[140px] opacity-100 ml-0'
                    }`}
                  >
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </nav>

          <div className="px-3 py-3 border-t border-slate-100 dark:border-slate-800">
            <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center">Version v{appVersion}</p>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col min-w-0 overflow-y-auto relative bg-slate-50 dark:bg-slate-950 transition-colors">
          <div className="md:hidden py-2 px-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10 flex justify-between items-center">
            <button className="flex items-center gap-2 text-slate-600 dark:text-slate-300 font-medium text-sm" onClick={() => setMobileMenuOpen(true)}>
              <Menu className="w-5 h-5" /> Admin Menu
            </button>
            <span className="text-xs font-bold bg-rose-100 text-rose-700 px-2 py-1 rounded dark:bg-rose-900/30 dark:text-rose-400">Restricted</span>
          </div>
          
          <div className="w-full max-w-6xl mx-auto px-4 sm:px-8 py-6 sm:py-8">
            <Outlet />
          </div>
        </main>
      </div>

      <Watermark fixed />
    </div>
  );
}
