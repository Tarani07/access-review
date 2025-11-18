import React, { useState, useEffect } from 'react';
import { 
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
  Calendar,
  Video,
  FileText,
  Upload,
  CheckSquare
} from 'lucide-react';

interface ApplicationUserStats {
  name: string;
  userCount: number;
  activeUsers: number;
  category: string;
  color: string;
  integrated: boolean;
  team?: string;
  product?: string;
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
  const [selectedProduct, setSelectedProduct] = useState<string>('ALL');
  const [selectedTeam, setSelectedTeam] = useState<string>('ALL');
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    loadDashboardStats();
    
    // Update clock every second
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => clearInterval(timer);
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
          { name: 'SurveySparrow', userCount: 342, activeUsers: 328, category: 'Product', color: '#10B981', integrated: true, product: 'SurveySparrow', team: 'Marketing' },
          { name: 'ThriveSparrow', userCount: 289, activeUsers: 267, category: 'Product', color: '#3B82F6', integrated: true, product: 'ThriveSparrow', team: 'HR' },
          { name: 'SparrowDesk', userCount: 156, activeUsers: 142, category: 'Product', color: '#F59E0B', integrated: true, product: 'SparrowDesk', team: 'IT' },
          { name: 'Sparrow Genie', userCount: 198, activeUsers: 187, category: 'Product', color: '#8B5CF6', integrated: true, product: 'Sparrow Genie', team: 'Sales' },
          { name: 'Slack', userCount: 1247, activeUsers: 1201, category: 'Communication', color: '#EC4899', integrated: true, team: 'ALL' },
          { name: 'GitHub', userCount: 456, activeUsers: 442, category: 'Development', color: '#6366F1', integrated: true, team: 'Developer' },
          { name: 'Google Workspace', userCount: 1278, activeUsers: 1247, category: 'Productivity', color: '#EF4444', integrated: true, team: 'ALL' },
          { name: 'Zoom', userCount: 892, activeUsers: 856, category: 'Communication', color: '#06B6D4', integrated: true, team: 'ALL' },
          { name: 'Salesforce', userCount: 234, activeUsers: 218, category: 'CRM', color: '#14B8A6', integrated: true, team: 'Sales' },
          { name: 'Jira', userCount: 387, activeUsers: 356, category: 'Project Management', color: '#0EA5E9', integrated: true, team: 'Developer' },
          { name: 'Figma', userCount: 124, activeUsers: 118, category: 'Design', color: '#22C55E', integrated: true, team: 'Marketing' },
          { name: 'HR System', userCount: 156, activeUsers: 145, category: 'HR Tools', color: '#A855F7', integrated: false, team: 'HR' },
          { name: 'Legal Docs', userCount: 67, activeUsers: 62, category: 'Document Management', color: '#84CC16', integrated: false, team: 'Legal' },
          { name: 'Admin Portal', userCount: 89, activeUsers: 82, category: 'Administration', color: '#F97316', integrated: false, team: 'Admin' },
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

  const handleScheduleMeeting = () => {
    // Open Google Calendar in new window
    window.open('https://calendar.google.com/calendar/u/0/r/eventedit', '_blank');
  };

  // Filter applications based on selected filters
  const filteredApps = stats?.applicationUserStats.filter(app => {
    const matchesProduct = selectedProduct === 'ALL' || app.product === selectedProduct;
    const matchesTeam = selectedTeam === 'ALL' || app.team === selectedTeam || app.team === 'ALL';
    return matchesProduct && matchesTeam;
  }) || [];

  // Calculate pie chart segments
  const totalUsers = filteredApps.reduce((sum, app) => sum + app.userCount, 0);

  // Create pie chart path data
  const getPieSlice = (startAngle: number, percentage: number) => {
    const angle = (percentage / 100) * 360;
    const endAngle = startAngle + angle;
    
    const x1 = 100 + 90 * Math.cos((Math.PI * startAngle) / 180);
    const y1 = 100 + 90 * Math.sin((Math.PI * startAngle) / 180);
    const x2 = 100 + 90 * Math.cos((Math.PI * endAngle) / 180);
    const y2 = 100 + 90 * Math.sin((Math.PI * endAngle) / 180);
    
    const largeArc = angle > 180 ? 1 : 0;
    
    return {
      path: `M 100 100 L ${x1} ${y1} A 90 90 0 ${largeArc} 1 ${x2} ${y2} Z`,
      endAngle
    };
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
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">SparrowVision - Access Governance Overview</p>
        </div>
        <div className="flex items-center space-x-4 flex-wrap">
          {/* Running Clock */}
          <div className="flex items-center bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200">
            <Clock className="h-5 w-5 mr-2 text-emerald-600" />
            <span className="font-mono font-semibold text-gray-900">
              {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          </div>
          
          {/* Google Calendar Integration */}
          <button
            onClick={handleScheduleMeeting}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center"
          >
            <Calendar className="h-4 w-4 mr-2" />
            Schedule Meeting
          </button>
          
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

      {/* Applications & Users - Pie Chart */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <Activity className="h-5 w-5 mr-2 text-emerald-600" />
            Applications & User Distribution
          </h2>
          
          {/* Filters */}
          <div className="flex items-center space-x-4">
            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
            >
              <option value="ALL">All Products</option>
              <option value="SurveySparrow">SurveySparrow</option>
              <option value="ThriveSparrow">ThriveSparrow</option>
              <option value="SparrowDesk">SparrowDesk</option>
              <option value="Sparrow Genie">Sparrow Genie</option>
            </select>
            
            <select
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
            >
              <option value="ALL">All Teams</option>
              <option value="Sales">Sales</option>
              <option value="IT">IT</option>
              <option value="Marketing">Marketing</option>
              <option value="Developer">Developer</option>
              <option value="Admin">Admin</option>
              <option value="HR">HR</option>
              <option value="Legal">Legal</option>
            </select>
          </div>
        </div>

        {/* Pie Chart with Legend */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Pie Chart */}
          <div className="flex items-center justify-center">
            <svg viewBox="0 0 200 200" className="w-full max-w-md">
              {filteredApps.map((app, index) => {
                const percentage = (app.userCount / totalUsers) * 100;
                const startAngle = filteredApps.slice(0, index).reduce((sum, a) => 
                  sum + ((a.userCount / totalUsers) * 360), 0);
                const slice = getPieSlice(startAngle, percentage);
                
                return (
                  <g key={app.name}>
                    <path
                      d={slice.path}
                      fill={app.color}
                      stroke="white"
                      strokeWidth="2"
                      className={`transition-all duration-300 cursor-pointer ${
                        hoveredApp === app.name ? 'opacity-100 filter drop-shadow-lg' : 'opacity-90'
                      }`}
                      onMouseEnter={() => setHoveredApp(app.name)}
                      onMouseLeave={() => setHoveredApp(null)}
                      style={{
                        transform: hoveredApp === app.name ? 'scale(1.05)' : 'scale(1)',
                        transformOrigin: '100px 100px'
                      }}
                    />
                  </g>
                );
              })}
              {/* Center circle for donut effect */}
              <circle cx="100" cy="100" r="50" fill="white" />
              <text x="100" y="95" textAnchor="middle" className="text-2xl font-bold" fill="#1F2937">
                {totalUsers}
              </text>
              <text x="100" y="110" textAnchor="middle" className="text-xs" fill="#6B7280">
                Total Users
              </text>
            </svg>
          </div>

          {/* Legend with App Names and Counts */}
          <div className="space-y-2">
            <h3 className="font-semibold text-gray-900 mb-4">Applications</h3>
            <div className="max-h-96 overflow-y-auto space-y-2 pr-2">
              {filteredApps.sort((a, b) => b.userCount - a.userCount).map((app) => (
                <div
                  key={app.name}
                  className={`flex items-center justify-between p-3 rounded-lg border-2 transition-all cursor-pointer ${
                    hoveredApp === app.name 
                      ? 'border-gray-400 bg-gray-50 shadow-md' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onMouseEnter={() => setHoveredApp(app.name)}
                  onMouseLeave={() => setHoveredApp(null)}
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-4 h-4 rounded-full flex-shrink-0"
                      style={{ backgroundColor: app.color }}
                    />
                    <div>
                      <div className="font-medium text-gray-900 flex items-center space-x-2">
                        <span>{app.name}</span>
                        {app.integrated ? (
                          <CheckCircle className="h-4 w-4 text-green-500" title="API Integrated" />
                        ) : (
                          <Upload className="h-4 w-4 text-orange-500" title="CSV Import" />
                        )}
                      </div>
                      <div className="text-xs text-gray-500">{app.category}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-gray-900">{app.userCount.toLocaleString()}</div>
                    <div className="text-xs text-emerald-600">{app.activeUsers.toLocaleString()} active</div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Integration Status Legend */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <h4 className="font-medium text-gray-700 mb-2 text-sm">Integration Status</h4>
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-1">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-gray-600">API Integrated ({filteredApps.filter(a => a.integrated).length})</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Upload className="h-4 w-4 text-orange-500" />
                  <span className="text-gray-600">CSV Import ({filteredApps.filter(a => !a.integrated).length})</span>
                </div>
              </div>
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
    </div>
  );
}

