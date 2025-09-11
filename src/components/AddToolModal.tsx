import React, { useState } from 'react';
import { X, Plus, Key, Globe, Trash2, RefreshCw, CheckCircle, AlertCircle, TestTube } from 'lucide-react';

interface Tool {
  id: string;
  name: string;
  category: string;
  isActive: boolean;
  hasApiSupport?: boolean;
  apiKey?: string;
  apiEndpoint?: string;
  removeUserEndpoint?: string;
  connectionStatus?: 'connected' | 'disconnected' | 'testing';
}

interface AddToolModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTool: (tool: Omit<Tool, 'id'>) => void;
}

export default function AddToolModal({ isOpen, onClose, onAddTool }: AddToolModalProps) {
  const [toolData, setToolData] = useState({
    name: '',
    category: '',
    apiKey: '',
    apiEndpoint: '',
    removeUserEndpoint: '',
    isActive: true,
    hasApiSupport: true
  });

  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [connectionMessage, setConnectionMessage] = useState('');
  const [syncedUsers, setSyncedUsers] = useState<any[]>([]);

  const categories = [
    'Communication', 
    'Development', 
    'Design', 
    'Cloud Services', 
    'Project Management', 
    'Monitoring', 
    'IT Management', 
    'Documentation', 
    'Security',
    'HR & Recruitment',
    'Finance & Accounting',
    'Marketing & Sales',
    'Analytics',
    'Physical Security',
    'AI & Productivity',
    'Other'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (toolData.name && toolData.category) {
      onAddTool({
        ...toolData,
        connectionStatus: 'disconnected'
      });
      setToolData({
        name: '',
        category: '',
        apiKey: '',
        apiEndpoint: '',
        removeUserEndpoint: '',
        isActive: true,
        hasApiSupport: true
      });
      onClose();
    }
  };

  const handleReset = () => {
    setToolData({
      name: '',
      category: '',
      apiKey: '',
      apiEndpoint: '',
      removeUserEndpoint: '',
      isActive: true,
      hasApiSupport: true
    });
    setConnectionStatus('idle');
    setConnectionMessage('');
    setSyncedUsers([]);
  };

  const testConnection = async () => {
    if (!toolData.apiKey || !toolData.apiEndpoint) {
      setConnectionStatus('error');
      setConnectionMessage('Please provide both API key and endpoint URL');
      return;
    }

    setIsTestingConnection(true);
    setConnectionStatus('idle');
    setConnectionMessage('');

    try {
      // Use our backend proxy to avoid CORS issues
      const response = await fetch('https://access-review-production.up.railway.app/api/proxy/test-tool', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken') || 'demo-token'}`
        },
        body: JSON.stringify({
          toolName: toolData.name,
          apiKey: toolData.apiKey,
          endpoint: toolData.apiEndpoint
        })
      });

      if (response.ok) {
        const data = await response.json();
        setConnectionStatus('success');
        setConnectionMessage(`Connection successful! Found ${data.totalUsers} users.`);
        
        // Store the users data
        if (data.users && Array.isArray(data.users)) {
          setSyncedUsers(data.users);
        }
      } else {
        const errorData = await response.json();
        setConnectionStatus('error');
        setConnectionMessage(`Connection failed: ${errorData.message || response.statusText}`);
      }
    } catch (error) {
      setConnectionStatus('error');
      setConnectionMessage(`Connection error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsTestingConnection(false);
    }
  };

  const syncUsers = async () => {
    if (connectionStatus !== 'success') {
      setConnectionMessage('Please test connection first');
      return;
    }

    setIsTestingConnection(true);
    setConnectionMessage('Syncing users...');

    try {
      // Simulate storing users in access review system
      const usersToStore = syncedUsers.map((user, index) => ({
        id: `user-${Date.now()}-${index}`,
        tool: toolData.name,
        email: user.email || user.username || `user${index}@${toolData.name.toLowerCase()}.com`,
        role: user.role || 'user',
        status: 'ACTIVE' as const,
        lastLogin: user.last_login || user.lastLogin || new Date().toISOString(),
        permissions: user.permissions || [],
        syncedAt: new Date().toISOString()
      }));

      // Here you would typically send this to your backend API
      console.log('Users to sync:', usersToStore);
      
      setConnectionMessage(`Successfully synced ${usersToStore.length} users!`);
      
      // Store in localStorage for demo purposes
      const existingUsers = JSON.parse(localStorage.getItem('syncedUsers') || '[]');
      const updatedUsers = [...existingUsers, ...usersToStore];
      localStorage.setItem('syncedUsers', JSON.stringify(updatedUsers));
      
    } catch (error) {
      setConnectionMessage(`Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsTestingConnection(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Add New Tool</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tool Name *
              </label>
              <input
                type="text"
                value={toolData.name}
                onChange={(e) => setToolData({ ...toolData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="e.g., Zoom, Slack, GitHub"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              <select
                value={toolData.category}
                onChange={(e) => setToolData({ ...toolData, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                required
              >
                <option value="">Select category...</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>

          {/* API Configuration */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="hasApiSupport"
                checked={toolData.hasApiSupport}
                onChange={(e) => setToolData({ ...toolData, hasApiSupport: e.target.checked })}
                className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
              />
              <label htmlFor="hasApiSupport" className="text-sm font-medium text-gray-700">
                This tool supports API integration
              </label>
            </div>

            {toolData.hasApiSupport && (
              <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Key className="h-4 w-4 inline mr-1" />
                    API Key / OAuth Token
                  </label>
                  <input
                    type="password"
                    value={toolData.apiKey}
                    onChange={(e) => setToolData({ ...toolData, apiKey: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="Enter API key or OAuth token"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Globe className="h-4 w-4 inline mr-1" />
                    API Endpoint URL (to fetch users)
                  </label>
                  <input
                    type="url"
                    value={toolData.apiEndpoint}
                    onChange={(e) => setToolData({ ...toolData, apiEndpoint: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="https://api.example.com/v1/users"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Trash2 className="h-4 w-4 inline mr-1" />
                    Remove User Endpoint URL (optional)
                  </label>
                  <input
                    type="url"
                    value={toolData.removeUserEndpoint}
                    onChange={(e) => setToolData({ ...toolData, removeUserEndpoint: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="https://api.example.com/v1/users/remove"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    URL endpoint to remove users from this tool
                  </p>
                </div>

                {/* Connection Test and Sync Section */}
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-gray-700">API Connection & Sync</h3>
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={testConnection}
                        disabled={isTestingConnection || !toolData.apiKey || !toolData.apiEndpoint}
                        className="flex items-center space-x-2 px-3 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm rounded-md transition-colors"
                      >
                        <TestTube className="h-4 w-4" />
                        <span>{isTestingConnection ? 'Testing...' : 'Test Connection'}</span>
                      </button>
                      
                      {connectionStatus === 'success' && (
                        <button
                          type="button"
                          onClick={syncUsers}
                          disabled={isTestingConnection}
                          className="flex items-center space-x-2 px-3 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm rounded-md transition-colors"
                        >
                          <RefreshCw className={`h-4 w-4 ${isTestingConnection ? 'animate-spin' : ''}`} />
                          <span>{isTestingConnection ? 'Syncing...' : 'Sync Users'}</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Connection Status */}
                  {connectionMessage && (
                    <div className={`p-3 rounded-md text-sm ${
                      connectionStatus === 'success' 
                        ? 'bg-green-50 text-green-700 border border-green-200' 
                        : connectionStatus === 'error'
                        ? 'bg-red-50 text-red-700 border border-red-200'
                        : 'bg-blue-50 text-blue-700 border border-blue-200'
                    }`}>
                      <div className="flex items-center space-x-2">
                        {connectionStatus === 'success' && <CheckCircle className="h-4 w-4" />}
                        {connectionStatus === 'error' && <AlertCircle className="h-4 w-4" />}
                        <span>{connectionMessage}</span>
                      </div>
                    </div>
                  )}

                  {/* Synced Users Preview */}
                  {syncedUsers.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">
                        Found {syncedUsers.length} users to sync:
                      </h4>
                      <div className="max-h-32 overflow-y-auto bg-gray-50 rounded-md p-2">
                        {syncedUsers.slice(0, 5).map((user, index) => (
                          <div key={index} className="text-xs text-gray-600 py-1">
                            • {user.email || user.username || `User ${index + 1}`} 
                            {user.role && ` (${user.role})`}
                          </div>
                        ))}
                        {syncedUsers.length > 5 && (
                          <div className="text-xs text-gray-500 py-1">
                            ... and {syncedUsers.length - 5} more users
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Tool Status */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isActive"
              checked={toolData.isActive}
              onChange={(e) => setToolData({ ...toolData, isActive: e.target.checked })}
              className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
            />
            <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
              Activate tool immediately
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleReset}
              className="text-gray-600 hover:text-gray-800 font-medium transition-colors"
            >
              Reset Form
            </button>
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2 rounded-md font-medium flex items-center space-x-2 transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Add Tool</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}