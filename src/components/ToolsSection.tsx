import React, { useState } from 'react';
import { 
  Settings, 
  Plus, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  Link,
  Upload,
  Database,
  Eye,
  Activity
} from 'lucide-react';

interface Tool {
  id: string;
  name: string;
  type: 'API' | 'WEBHOOK' | 'CSV' | 'GOOGLE_WORKSPACE';
  category?: string;
  isActive: boolean;
  lastSync?: string;
  syncStatus: 'IDLE' | 'SYNCING' | 'SUCCESS' | 'ERROR';
  userCount: number;
  errorMessage?: string;
}

export default function ToolsSection() {
  const [tools] = useState<Tool[]>([
    {
      id: '1',
      name: 'Slack',
      type: 'API',
      category: 'Communication',
      isActive: true,
      lastSync: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      syncStatus: 'SUCCESS',
      userCount: 124
    },
    {
      id: '2',
      name: 'GitHub',
      type: 'API',
      category: 'Development',
      isActive: true,
      lastSync: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      syncStatus: 'SUCCESS',
      userCount: 89
    },
    {
      id: '3',
      name: 'CCTV Access',
      type: 'CSV',
      category: 'Physical Security',
      isActive: true,
      lastSync: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      syncStatus: 'SUCCESS',
      userCount: 45
    }
  ]);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSyncAll = async () => {
    setIsSyncing(true);
    console.log('Syncing all tools...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsSyncing(false);
  };

  const getStatusIcon = (status: Tool['syncStatus']) => {
    switch (status) {
      case 'SYNCING':
        return <Clock className="h-4 w-4 text-yellow-500 animate-spin" />;
      case 'SUCCESS':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'ERROR':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getTypeIcon = (type: Tool['type']) => {
    switch (type) {
      case 'API':
        return <Link className="h-4 w-4 text-blue-500" />;
      case 'WEBHOOK':
        return <Activity className="h-4 w-4 text-purple-500" />;
      case 'CSV':
        return <Upload className="h-4 w-4 text-orange-500" />;
      case 'GOOGLE_WORKSPACE':
        return <Database className="h-4 w-4 text-green-500" />;
      default:
        return <Settings className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tools</h1>
          <p className="text-gray-600 mt-1">Manage API, Webhook, and CSV integrations</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleSyncAll}
            disabled={isSyncing}
            className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Syncing...' : 'Sync All'}
          </button>
          <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center">
            <Plus className="h-4 w-4 mr-2" />
            Add Tool
          </button>
        </div>
      </div>

      {/* Tools Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="text-2xl font-bold text-blue-700">{tools.length}</div>
          <div className="text-sm text-blue-600">Total Tools</div>
        </div>
        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <div className="text-2xl font-bold text-green-700">{tools.filter(t => t.isActive).length}</div>
          <div className="text-sm text-green-600">Active</div>
        </div>
        <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
          <div className="text-2xl font-bold text-yellow-700">{tools.filter(t => t.syncStatus === 'SYNCING').length}</div>
          <div className="text-sm text-yellow-600">Syncing</div>
        </div>
        <div className="bg-red-50 rounded-lg p-4 border border-red-200">
          <div className="text-2xl font-bold text-red-700">{tools.filter(t => t.syncStatus === 'ERROR').length}</div>
          <div className="text-sm text-red-600">Errors</div>
        </div>
      </div>

      {/* Tools List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">All Tools</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tool
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Users
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Sync
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tools.map((tool) => (
                <tr key={tool.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center">
                          {getTypeIcon(tool.type)}
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{tool.name}</div>
                        <div className="text-sm text-gray-500">{tool.category}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      tool.type === 'API' ? 'bg-blue-100 text-blue-800' :
                      tool.type === 'WEBHOOK' ? 'bg-purple-100 text-purple-800' :
                      tool.type === 'CSV' ? 'bg-orange-100 text-orange-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {tool.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getStatusIcon(tool.syncStatus)}
                      <span className="ml-2 text-sm text-gray-900 capitalize">
                        {tool.syncStatus.toLowerCase()}
                      </span>
                    </div>
                    {tool.errorMessage && (
                      <div className="text-xs text-red-600 mt-1">{tool.errorMessage}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {tool.userCount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {tool.lastSync ? new Date(tool.lastSync).toLocaleString() : 'Never'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button className="text-emerald-600 hover:text-emerald-900" title="Sync now">
                        <RefreshCw className="h-4 w-4" />
                      </button>
                      <button className="text-blue-600 hover:text-blue-900" title="View details">
                        <Eye className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
