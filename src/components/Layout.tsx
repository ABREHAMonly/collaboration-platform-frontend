import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

    const navigation = [
    { name: 'Dashboard', href: '/', icon: '📊' },
    { name: 'AI Assistant', href: '/ai-dashboard', icon: '🤖' }, // Add this line
    { name: 'Workspaces', href: '/workspaces', icon: '🏢' },
    { name: 'Projects', href: '/projects', icon: '📁' },
    { name: 'My Tasks', href: '/tasks', icon: '✅' },
    ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'block' : 'hidden'} md:block md:w-64 bg-white shadow-lg`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-4 bg-blue-600 text-white">
            <h1 className="text-xl font-bold">CollabPlatform</h1>
            <button
              onClick={() => setSidebarOpen(false)}
              className="md:hidden p-2"
            >
              ✕
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-2">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                  isActive(item.href)
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="mr-3 text-lg">{item.icon}</span>
                {item.name}
              </Link>
            ))}

            {/* Admin Section */}
            {user?.globalStatus === 'ADMIN' && (
            <div className="pt-4 mt-4 border-t border-gray-200">
                <p className="px-4 text-xs font-semibold text-gray-500 uppercase">Admin</p>
                <Link
                to="/admin"
                className="flex items-center px-4 py-3 mt-2 text-sm font-medium text-red-700 rounded-lg bg-red-50 hover:bg-red-100"
                >
                <span className="mr-3 text-lg">👑</span>
                Admin Panel
                </Link>
            </div>
            )}
          </nav>

          {/* User Info */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                  {user?.email?.charAt(0).toUpperCase()}
                </div>
              </div>
              <div className="ml-3 flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.email}
                </p>
                <p className="text-xs text-gray-500 capitalize">
                  {user?.globalStatus?.toLowerCase()}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="ml-3 p-2 text-gray-400 hover:text-gray-500"
                title="Logout"
              >
                ⎋
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-white shadow-sm z-10">
          <div className="flex items-center justify-between h-16 px-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 text-gray-600"
            >
              ☰
            </button>
            <div className="flex-1 md:flex-none">
              <h1 className="text-xl font-semibold text-gray-900">
                {navigation.find(nav => isActive(nav.href))?.name || 'Dashboard'}
              </h1>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-4">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;