import React, { useState } from 'react';
import AccessControlGate from './components/AccessControlGate';
import Sidebar from './components/Sidebar';
import NewDashboard from './components/NewDashboard';
import ToolsSection from './components/ToolsSection';

// Placeholder components for sections not yet implemented
const PlaceholderSection = ({ title, description }: { title: string; description: string }) => (
  <div className="flex items-center justify-center h-96 bg-white rounded-lg shadow-sm border border-gray-200">
    <div className="text-center">
      <div className="text-6xl mb-4">🚧</div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
      <p className="text-gray-600 max-w-md">{description}</p>
      <p className="text-sm text-emerald-600 mt-4">Coming soon in the next update!</p>
    </div>
  </div>
);

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
        return <NewDashboard />;
      
      case 'tools':
        return <ToolsSection />;
      
      case 'users':
        return (
          <PlaceholderSection 
            title="Users Section"
            description="Sync from Gshoot (Google Workspace), show all users with status: Active / Suspended / Exit. On click → show tool-wise access with roles and privileges."
          />
        );
      
      case 'access-review':
        return (
          <PlaceholderSection 
            title="Access Review"
            description="Two modes: User-wise and Tool-wise reviews. Auto-sync latest tool data, export results as Excel/CSV/PDF with certification."
          />
        );
      
      case 'rep-doc':
        return (
          <PlaceholderSection 
            title="Rep-Doc (Reports & Documentation)"
            description="Certify each access review with tool details, review times, counts, and auto-generate PDF certifications with email delivery."
          />
        );
      
      case 'admin':
        return (
          <PlaceholderSection 
            title="SparrowVision Admin"
            description="Invite users to access SparrowVision, assign roles (View/Edit/Logs/Integration), and manage role-based permissions with Slack integration settings."
          />
        );
      
      case 'logs':
        return (
          <PlaceholderSection 
            title="Logs (ISO 27001 Compliant)"
            description="Audit-ready logs with user logins/logouts, data sync events, review actions, and removals performed. Timestamped, categorized, and exportable."
          />
        );
      
      default:
        return <NewDashboard />;
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
                    InfoSec Access Governance Platform - ISO 27001 Compliant
                  </p>
                </div>
                <div className="text-center md:text-right">
                  <p className="text-sm text-gray-500">
                    Contact: it-admin@surveysparrow.com
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Secure • Auditable • Professional
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
