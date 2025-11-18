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

interface ApplicationUserStats {
  name: string;
  userCount: number;
  activeUsers: number;
  category: string;
  color: string;
}

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
  applicationUserStats: ApplicationUserStats[];
  lastSync: string | null;
  systemHealth: 'healthy' | 'warning' | 'error';
}

interface NewDashboardProps {
  onNavigate: (section: string) => void;
}

export default function NewDashboard({ onNavigate }: NewDashboardProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hoveredApp, setHoveredApp] = useState<string | null>(null);

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
        applicationUserStats: [
          { name: 'GitHub', userCount: 342, activeUsers: 328, category: 'Development', color: 'bg-purple-500' },
          { name: 'Slack', userCount: 1247, activeUsers: 1201, category: 'Communication', color: 'bg-pink-500' },
          { name: 'Jira', userCount: 289, activeUsers: 267, category: 'Project Management', color: 'bg-blue-500' },
          { name: 'AWS', userCount: 156, activeUsers: 142, category: 'Infrastructure', color: 'bg-orange-500' },
          { name: 'Salesforce', userCount: 78, activeUsers: 72, category: 'CRM', color: 'bg-cyan-500' },
          { name: 'Google Workspace', userCount: 1278, activeUsers: 1247, category: 'Productivity', color: 'bg-red-500' },
          { name: 'Zoom', userCount: 892, activeUsers: 856, category: 'Communication', color: 'bg-indigo-500' },
          { name: 'Figma', userCount: 124, activeUsers: 118, category: 'Design', color: 'bg-green-500' },
          { name: 'Notion', userCount: 567, activeUsers: 534, category: 'Documentation', color: 'bg-gray-500' },
          { name: 'DataDog', userCount: 89, activeUsers: 82, category: 'Monitoring', color: 'bg-violet-500' },
        ],
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

      {/* Applications & Users Chart - Vertical */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <BarChart3 className="h-5 w-5 mr-2 text-emerald-600" />
            Applications & User Distribution
          </h2>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm">
              <div className="w-3 h-3 bg-emerald-500 rounded"></div>
              <span className="text-gray-600">Active Users</span>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <div className="w-3 h-3 bg-gray-300 rounded"></div>
              <span className="text-gray-600">Total Users</span>
            </div>
          </div>
        </div>
        
        {/* Vertical Bar Chart */}
        <div className="relative">
          {/* Y-axis labels */}
          <div className="absolute left-0 top-0 bottom-12 flex flex-col justify-between text-xs text-gray-500 w-12">
            {[1400, 1200, 1000, 800, 600, 400, 200, 0].map((value) => (
              <div key={value} className="text-right pr-2">{value}</div>
            ))}
          </div>
          
          {/* Chart area */}
          <div className="ml-12 pl-4">
            <div className="flex items-end justify-between gap-2 h-80 border-l-2 border-b-2 border-gray-300 pl-4 pb-4">
              {stats.applicationUserStats.sort((a, b) => b.userCount - a.userCount).map((app) => {
                const maxUsers = Math.max(...stats.applicationUserStats.map(a => a.userCount));
                const totalHeightPercentage = (app.userCount / maxUsers) * 100;
                const activeHeightPercentage = (app.activeUsers / maxUsers) * 100;
                
                return (
                  <div 
                    key={app.name}
                    className="flex-1 flex flex-col items-center group"
                    onMouseEnter={() => setHoveredApp(app.name)}
                    onMouseLeave={() => setHoveredApp(null)}
                  >
                    {/* Tooltip */}
                    {hoveredApp === app.name && (
                      <div className="absolute -mt-20 bg-gray-900 text-white px-3 py-2 rounded-lg shadow-lg text-xs z-10">
                        <div className="font-semibold">{app.name}</div>
                        <div className="text-emerald-300">Active: {app.activeUsers.toLocaleString()}</div>
                        <div className="text-gray-300">Total: {app.userCount.toLocaleString()}</div>
                        <div className="text-yellow-300">Rate: {((app.activeUsers / app.userCount) * 100).toFixed(1)}%</div>
                      </div>
                    )}
                    
                    {/* Bar container */}
                    <div className="relative w-full h-full flex flex-col justify-end">
                      {/* Total users bar (background) */}
                      <div 
                        className="w-full bg-gray-300 rounded-t-lg transition-all duration-300 ease-out relative"
                        style={{ height: `${totalHeightPercentage}%` }}
                      >
                        {/* Active users bar (foreground) */}
                        <div 
                          className={`absolute bottom-0 left-0 right-0 ${app.color} rounded-t-lg transition-all duration-300 ease-out ${
                            hoveredApp === app.name ? 'opacity-100 shadow-lg' : 'opacity-90'
                          }`}
                          style={{ height: `${(activeHeightPercentage / totalHeightPercentage) * 100}%` }}
                        >
                          {/* User count label */}
                          {hoveredApp === app.name && (
                            <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-bold text-gray-900 whitespace-nowrap">
                              {app.activeUsers}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* App name label (X-axis) */}
                    <div className="mt-2 text-center">
                      <div 
                        className={`text-xs font-medium text-gray-900 transform -rotate-45 origin-top-left whitespace-nowrap ${
                          hoveredApp === app.name ? 'font-bold text-emerald-600' : ''
                        }`}
                        style={{ 
                          maxWidth: '80px',
                          fontSize: '10px'
                        }}
                      >
                        {app.name}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* X-axis label */}
            <div className="text-center mt-8 text-sm font-medium text-gray-600">
              Applications
            </div>
          </div>
          
          {/* Y-axis label */}
          <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -rotate-90 text-sm font-medium text-gray-600 whitespace-nowrap">
            Number of Users
          </div>
        </div>
        
        {/* Summary Stats */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {stats.applicationUserStats.length}
              </div>
              <div className="text-sm text-gray-600">Total Applications</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-600">
                {stats.applicationUserStats.reduce((sum, app) => sum + app.activeUsers, 0).toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">Active Users (All Apps)</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-700">
                {(stats.applicationUserStats.reduce((sum, app) => sum + app.activeUsers, 0) / 
                  stats.applicationUserStats.reduce((sum, app) => sum + app.userCount, 0) * 100).toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">Overall Active Rate</div>
            </div>
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
