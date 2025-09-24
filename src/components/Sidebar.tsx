import React, { useState } from 'react';
import { 
  BarChart3, 
  Eye, 
  Settings, 
  Users, 
  FileText, 
  History, 
  LogOut, 
  Menu,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import SurveySparrowLogo from './SurveySparrowLogo';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  currentUser?: string;
}

const navigationItems = [
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
  { id: 'access-review', label: 'Access Review', icon: Eye },
  { id: 'tools', label: 'Tools', icon: Settings },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'reports', label: 'Reports', icon: FileText },
  { id: 'history', label: 'History', icon: History }
];

export default function Sidebar({ activeTab, onTabChange, currentUser }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const toggleMobileSidebar = () => {
    setIsMobileOpen(!isMobileOpen);
  };

  const handleNavClick = (tabId: string) => {
    onTabChange(tabId);
    // Close mobile sidebar after navigation
    if (isMobileOpen) {
      setIsMobileOpen(false);
    }
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={toggleMobileSidebar}
          className="p-2 rounded-lg bg-white shadow-lg border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          {isMobileOpen ? (
            <X className="h-5 w-5 text-gray-600" />
          ) : (
            <Menu className="h-5 w-5 text-gray-600" />
          )}
        </button>
      </div>

      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-gray-900 bg-opacity-50 z-30"
          onClick={toggleMobileSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed left-0 top-0 h-full bg-white border-r border-gray-200 shadow-sm z-40 transition-all duration-300 ease-in-out
          ${isCollapsed ? 'w-16' : 'w-64'}
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            {!isCollapsed && (
              <div className="flex items-center">
                <SurveySparrowLogo width={32} height={32} className="mr-3" />
                <div className="text-lg font-bold text-gray-900">SparrowVision</div>
              </div>
            )}
            {isCollapsed && (
              <div className="flex justify-center w-full">
                <SurveySparrowLogo width={32} height={32} />
              </div>
            )}
            
            {/* Desktop Collapse Toggle */}
            <button
              onClick={toggleSidebar}
              className="hidden lg:flex p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4 text-gray-600" />
              ) : (
                <ChevronLeft className="h-4 w-4 text-gray-600" />
              )}
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`
                    w-full flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                    ${activeTab === item.id
                      ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 shadow-sm'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }
                    ${isCollapsed ? 'justify-center' : 'justify-start'}
                  `}
                  title={isCollapsed ? item.label : undefined}
                >
                  <Icon className={`h-5 w-5 ${isCollapsed ? '' : 'mr-3'}`} />
                  {!isCollapsed && (
                    <span className="truncate">{item.label}</span>
                  )}
                  
                  {/* Active indicator for collapsed state */}
                  {isCollapsed && activeTab === item.id && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-emerald-600 rounded-r-full" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* User Info & Logout */}
          <div className="border-t border-gray-200 p-4">
            {!isCollapsed && currentUser && (
              <div className="mb-3 px-3 py-2 bg-gray-50 rounded-lg">
                <div className="text-xs text-gray-500 mb-1">Signed in as</div>
                <div className="text-sm font-medium text-gray-900 truncate">
                  {currentUser}
                </div>
              </div>
            )}
            
            <button
              onClick={() => handleNavClick('logout')}
              className={`
                w-full flex items-center px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700 transition-all duration-200
                ${isCollapsed ? 'justify-center' : 'justify-start'}
              `}
              title={isCollapsed ? 'Logout' : undefined}
            >
              <LogOut className={`h-5 w-5 ${isCollapsed ? '' : 'mr-3'}`} />
              {!isCollapsed && <span>Logout</span>}
            </button>
          </div>

          {/* Version Info */}
          {!isCollapsed && (
            <div className="px-4 pb-4">
              <div className="text-xs text-gray-400 text-center">
                SparrowVision v2.0.0
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Spacer */}
      <div className={`hidden lg:block transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'}`} />
    </>
  );
}
