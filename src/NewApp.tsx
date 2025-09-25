import React, { useState } from 'react';
import AccessControlGate from './components/AccessControlGate';
import Sidebar from './components/Sidebar';
import NewDashboard from './components/NewDashboard';
import ToolsSection from './components/ToolsSection';
import UsersSection from './components/UsersSection';
import AccessReviewSection from './components/AccessReviewSection';
import RepDocSection from './components/RepDocSection';
import AdminSection from './components/AdminSection';
import LogsSection from './components/LogsSection';

function NewApp() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const currentUser = 'admin@surveysparrow.com';

  const handleTabChange = (tab: string) => {
    if (tab === 'logout') {
      // Handle logout logic here
      console.log('Logging out...');
      // In a real app, you would clear authentication tokens and redirect
      return;
    }
    setActiveTab(tab);
  };

  const renderActiveSection = () => {
    switch (activeTab) {
      case 'dashboard':
        return <NewDashboard onNavigate={setActiveTab} />;
      
      case 'tools':
        return <ToolsSection />;
      
      case 'users':
        return <UsersSection />;
      
      case 'access-review':
        return <AccessReviewSection />;
      
      case 'rep-doc':
        return <RepDocSection />;
      
      case 'admin':
        return <AdminSection />;
      
      case 'logs':
        return <LogsSection />;
      
      default:
        return <NewDashboard onNavigate={setActiveTab} />;
    }
  };

  return (
    <AccessControlGate currentUser={currentUser}>
      <div className="min-h-screen bg-gray-50 font-['Inter',sans-serif] flex">
        {/* Sidebar */}
        <Sidebar 
          activeTab={activeTab} 
          onTabChange={handleTabChange}
          currentUser={currentUser}
        />
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col min-h-screen">
          <main className="flex-1 p-4 lg:p-8">
            {renderActiveSection()}
          </main>

          {/* Footer */}
          <footer className="bg-white border-t border-gray-200 mt-auto">
            <div className="px-4 sm:px-6 lg:px-8 py-6">
              <div className="flex flex-col md:flex-row justify-between items-center space-y-2 md:space-y-0">
                <div className="text-center md:text-left">
                  <p className="text-sm text-gray-500">
                    Powered by Sparrow IT • SparrowVision v2.0
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Complete InfoSec Access Governance Platform - ISO 27001 Compliant
                  </p>
                </div>
                <div className="text-center md:text-right">
                  <p className="text-sm text-gray-500">
                    Contact: it-admin@surveysparrow.com
                  </p>
                  <p className="text-xs text-emerald-600 mt-1 font-medium">
                    ✓ Full Platform • ✓ All Features Complete
                  </p>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </AccessControlGate>
  );
}

export default NewApp;
