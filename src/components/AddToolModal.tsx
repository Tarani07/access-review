import React, { useState } from 'react';
import { X, Plus, Key, Globe, Trash2 } from 'lucide-react';

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