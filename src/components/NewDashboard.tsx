import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Settings, 
  Users, 
  Eye, 
  CheckCircle, 
  AlertTriangle,
  Activity,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Clock,
  Shield,
  UserMinus,
  UserCheck,
  FileCheck,
  Calendar
} from 'lucide-react';

interface DashboardStats {
  tools: {
    total: number;
    syncing: number;
    active: number;
    errors: number;
  };
  users: {
    active: number;
    inactive30: number;
    inactive90: number;
    total: number;
  };
  accessReviews: {
    total: number;
    completed: number;
    pending: number;
    usersReviewed: number;
    usersRemoved: number;
    flaggedUsers: number;
  };
  lastSync: string | null;
  systemHealth: 'healthy' | 'warning' | 'error';
}

interface NewDashboardProps {
  onNavigate: (section: string) => void;
}

export default function NewDashboard({ onNavigate }: NewDashboardProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    setIsLoading(true);
    try {
      // Mock data for now
      const mockStats: DashboardStats = {
        tools: {
          total: 12,
          syncing: 2,
          active: 10,
          errors: 0
        },
        users: {
          active: 1247,
          inactive30: 23,
          inactive90: 8,
          total: 1278
        },
        accessReviews: {
          total: 15,
          completed: 12,
          pending: 3,
          usersReviewed: 1156,
          usersRemoved: 47,
          flaggedUsers: 15
        },
        lastSync: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
        systemHealth: 'healthy'
      };
      
      setStats(mockStats);
    } catch (error) {
      console.error('Failed to load dashboard stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSyncAll = async () => {
    console.log('Syncing all tools...');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center text-gray-500 py-8">
        Failed to load dashboard data
      </div>
    );
  }

  const healthColor = stats.systemHealth === 'healthy' ? 'text-green-600' : 
                     stats.systemHealth === 'warning' ? 'text-yellow-600' : 'text-red-600';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">SparrowVision - Access Governance Overview</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className={`flex items-center ${healthColor}`}>
            <Shield className="h-5 w-5 mr-2" />
            <span className="font-medium capitalize">{stats.systemHealth}</span>
          </div>
          <button
            onClick={handleSyncAll}
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Sync All
          </button>
        </div>
      </div>

      {/* Exit Employee Metrics */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <UserMinus className="h-5 w-5 mr-2 text-red-600" />
            Exit Employee Dashboard
          </h2>
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <select className="text-sm border border-gray-300 rounded px-2 py-1 bg-white">
              <option value="current">Current Month</option>
              <option value="last">Last Month</option>
              <option value="last3">Last 3 Months</option>
            </select>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-red-50 rounded-lg p-4 border border-red-200">
            <div className="flex items-center justify-between mb-2">
              <UserMinus className="h-8 w-8 text-red-600" />
              <TrendingUp className="h-4 w-4 text-red-500" />
            </div>
            <div className="text-2xl font-bold text-red-700">47</div>
            <div className="text-sm text-red-600">Exit Users This Month</div>
            <div className="text-xs text-red-500 mt-1">+12 from last month</div>
          </div>
          
          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <div className="flex items-center justify-between mb-2">
              <UserCheck className="h-8 w-8 text-green-600" />
              <TrendingUp className="h-4 w-4 text-green-500" />
            </div>
            <div className="text-2xl font-bold text-green-700">1,201</div>
            <div className="text-sm text-green-600">Active Users</div>
            <div className="text-xs text-green-500 mt-1">+3.2% growth</div>
          </div>
          
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <FileCheck className="h-8 w-8 text-blue-600" />
              <TrendingDown className="h-4 w-4 text-blue-500" />
            </div>
            <div className="text-2xl font-bold text-blue-700">156</div>
            <div className="text-sm text-blue-600">Access Reviews Completed</div>
            <div className="text-xs text-blue-500 mt-1">94.2% completion rate</div>
          </div>
        </div>
        
        {/* Exit Employee Actions */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
            <button 
              onClick={() => onNavigate('access-review')}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center"
            >
              <Eye className="h-4 w-4 mr-2" />
              Review Exit Employee Access
            </button>
            <button 
              onClick={() => onNavigate('rep-doc')}
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center"
            >
              <FileCheck className="h-4 w-4 mr-2" />
              Generate Exit Reports
            </button>
          </div>
        </div>
      </div>

      {/* Tools Overview */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <Settings className="h-5 w-5 mr-2 text-emerald-600" />
            Tools Overview
          </h2>
          {stats.lastSync && (
            <div className="text-sm text-gray-500 flex items-center">
              <Clock className="h-4 w-4 mr-1" />
              Last sync: {new Date(stats.lastSync).toLocaleString()}
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="text-2xl font-bold text-blue-700">{stats.tools.total}</div>
            <div className="text-sm text-blue-600">Total Tools</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <div className="text-2xl font-bold text-green-700">{stats.tools.active}</div>
            <div className="text-sm text-green-600">Currently Syncing</div>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
            <div className="text-2xl font-bold text-yellow-700">{stats.tools.syncing}</div>
            <div className="text-sm text-yellow-600">In Sync Process</div>
          </div>
          <div className="bg-red-50 rounded-lg p-4 border border-red-200">
            <div className="text-2xl font-bold text-red-700">{stats.tools.errors}</div>
            <div className="text-sm text-red-600">Sync Errors</div>
          </div>
        </div>
      </div>

      {/* Users Overview */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center mb-4">
          <Users className="h-5 w-5 mr-2 text-emerald-600" />
          Users Overview
        </h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-emerald-700">{stats.users.active}</div>
                <div className="text-sm text-emerald-600">Active Users</div>
              </div>
              <TrendingUp className="h-8 w-8 text-emerald-500" />
            </div>
          </div>
          <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-orange-700">{stats.users.inactive30}</div>
                <div className="text-sm text-orange-600">Inactive &gt;30 days</div>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-500" />
            </div>
          </div>
          <div className="bg-red-50 rounded-lg p-4 border border-red-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-red-700">{stats.users.inactive90}</div>
                <div className="text-sm text-red-600">Inactive &gt;90 days</div>
              </div>
              <TrendingDown className="h-8 w-8 text-red-500" />
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="text-2xl font-bold text-gray-700">{stats.users.total}</div>
            <div className="text-sm text-gray-600">Total Users</div>
          </div>
        </div>
      </div>

      {/* Access Reviews Summary */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center mb-4">
          <Eye className="h-5 w-5 mr-2 text-emerald-600" />
          Access Reviews Summary
        </h2>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="text-2xl font-bold text-blue-700">{stats.accessReviews.total}</div>
            <div className="text-sm text-blue-600">Total Reviews</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <div className="text-2xl font-bold text-green-700">{stats.accessReviews.completed}</div>
            <div className="text-sm text-green-600">Completed</div>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
            <div className="text-2xl font-bold text-yellow-700">{stats.accessReviews.pending}</div>
            <div className="text-sm text-yellow-600">Pending</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
            <div className="text-2xl font-bold text-purple-700">{stats.accessReviews.usersReviewed}</div>
            <div className="text-sm text-purple-600">Users Reviewed</div>
          </div>
          <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
            <div className="text-2xl font-bold text-orange-700">{stats.accessReviews.flaggedUsers}</div>
            <div className="text-sm text-orange-600">Users Flagged</div>
          </div>
          <div className="bg-red-50 rounded-lg p-4 border border-red-200">
            <div className="text-2xl font-bold text-red-700">{stats.accessReviews.usersRemoved}</div>
            <div className="text-sm text-red-600">Users Removed</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button 
            onClick={() => onNavigate('app-center')}
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-emerald-500 hover:bg-emerald-50 transition-colors text-center"
          >
            <Settings className="h-8 w-8 mx-auto mb-2 text-emerald-500" />
            <div className="font-medium text-gray-700">Browse App Center</div>
            <div className="text-sm text-gray-500">150+ apps & custom tools</div>
          </button>
          
          <button 
            onClick={() => onNavigate('access-review')}
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-emerald-500 hover:bg-emerald-50 transition-colors text-center"
          >
            <Eye className="h-8 w-8 mx-auto mb-2 text-emerald-500" />
            <div className="font-medium text-gray-700">Start Access Review</div>
            <div className="text-sm text-gray-500">User-wise or Tool-wise</div>
          </button>
          
          <button 
            onClick={() => onNavigate('users')}
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-emerald-500 hover:bg-emerald-50 transition-colors text-center"
          >
            <Users className="h-8 w-8 mx-auto mb-2 text-emerald-500" />
            <div className="font-medium text-gray-700">Sync JumpCloud</div>
            <div className="text-sm text-gray-500">User directory sync</div>
          </button>
          
          <button 
            onClick={() => onNavigate('logs')}
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-emerald-500 hover:bg-emerald-50 transition-colors text-center"
          >
            <Activity className="h-8 w-8 mx-auto mb-2 text-emerald-500" />
            <div className="font-medium text-gray-700">View Audit Logs</div>
            <div className="text-sm text-gray-500">ISO 27001 compliant</div>
          </button>
        </div>
      </div>
    </div>
  );
}
