import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Filter,
  RefreshCw,
  Download,
  UserPlus,
  Eye,
  Edit,
  Trash2,
  AlertCircle,
  CheckCircle,
  Clock,
  Building,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Shield,
  Settings,
  ExternalLink,
  Key,
  Server,
  Wifi,
  WifiOff,
  TestTube
} from 'lucide-react';

interface User {
  id: string;
  email: string;
  name: string;
  firstName: string;
  lastName: string;
  department: string;
  jobTitle: string;
  manager: string;
  employeeId: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'EXIT';
  lastLogin?: string;
  createdDate: string;
  phoneNumber?: string;
  location: string;
  profilePhoto?: string;
  toolsAccess: ToolAccess[];
  totalTools: number;
  riskScore: number;
}

interface ToolAccess {
  toolId: string;
  toolName: string;
  role: string;
  permissions: string[];
  lastAccess?: string;
  status: 'ACTIVE' | 'INACTIVE';
}

interface JumpCloudSyncStatus {
  isActive: boolean;
  lastSync?: string;
  totalUsers: number;
  newUsers: number;
  updatedUsers: number;
  errors: string[];
}

interface JumpCloudConfig {
  isConfigured: boolean;
  apiKey: string;
  orgId: string;
  baseUrl: string;
  connectionStatus: 'CONNECTED' | 'DISCONNECTED' | 'TESTING' | 'ERROR';
  lastTested?: string;
  errorMessage?: string;
}

export default function UsersSection() {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ACTIVE' | 'SUSPENDED' | 'EXIT'>('ALL');
  const [filterDepartment, setFilterDepartment] = useState('ALL');
  const [showUserModal, setShowUserModal] = useState(false);
  const [showJumpCloudConfig, setShowJumpCloudConfig] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [jumpCloudStatus, setJumpCloudStatus] = useState<JumpCloudSyncStatus>({
    isActive: false,
    lastSync: undefined,
    totalUsers: 0,
    newUsers: 0,
    updatedUsers: 0,
    errors: []
  });
  const [jumpCloudConfig, setJumpCloudConfig] = useState<JumpCloudConfig>({
    isConfigured: false,
    apiKey: '',
    orgId: '',
    baseUrl: 'https://console.jumpcloud.com/api',
    connectionStatus: 'DISCONNECTED',
    lastTested: undefined,
    errorMessage: undefined
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      // Mock user data - in real app, this would come from API
      const mockUsers: User[] = [
        {
          id: '1',
          email: 'john.doe@surveysparrow.com',
          name: 'John Doe',
          firstName: 'John',
          lastName: 'Doe',
          department: 'Engineering',
          jobTitle: 'Senior Software Engineer',
          manager: 'Jane Smith',
          employeeId: 'SS001',
          status: 'ACTIVE',
          lastLogin: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
          createdDate: '2023-01-15T10:00:00Z',
          phoneNumber: '+1-555-0123',
          location: 'San Francisco, CA',
          toolsAccess: [
            { toolId: '1', toolName: 'GitHub', role: 'Developer', permissions: ['read', 'write'], lastAccess: new Date().toISOString(), status: 'ACTIVE' },
            { toolId: '2', toolName: 'Slack', role: 'Member', permissions: ['message'], lastAccess: new Date().toISOString(), status: 'ACTIVE' },
            { toolId: '3', toolName: 'Jira', role: 'Developer', permissions: ['create', 'edit'], lastAccess: new Date().toISOString(), status: 'ACTIVE' }
          ],
          totalTools: 3,
          riskScore: 15
        },
        {
          id: '2',
          email: 'jane.smith@surveysparrow.com',
          name: 'Jane Smith',
          firstName: 'Jane',
          lastName: 'Smith',
          department: 'Engineering',
          jobTitle: 'Engineering Manager',
          manager: 'Mike Johnson',
          employeeId: 'SS002',
          status: 'ACTIVE',
          lastLogin: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          createdDate: '2022-08-20T14:30:00Z',
          phoneNumber: '+1-555-0124',
          location: 'San Francisco, CA',
          toolsAccess: [
            { toolId: '1', toolName: 'GitHub', role: 'Admin', permissions: ['read', 'write', 'admin'], lastAccess: new Date().toISOString(), status: 'ACTIVE' },
            { toolId: '2', toolName: 'Slack', role: 'Admin', permissions: ['message', 'admin'], lastAccess: new Date().toISOString(), status: 'ACTIVE' },
            { toolId: '4', toolName: 'AWS', role: 'Admin', permissions: ['full-access'], lastAccess: new Date().toISOString(), status: 'ACTIVE' }
          ],
          totalTools: 5,
          riskScore: 85
        },
        {
          id: '3',
          email: 'bob.wilson@surveysparrow.com',
          name: 'Bob Wilson',
          firstName: 'Bob',
          lastName: 'Wilson',
          department: 'Marketing',
          jobTitle: 'Marketing Specialist',
          manager: 'Sarah Lee',
          employeeId: 'SS003',
          status: 'SUSPENDED',
          lastLogin: new Date(Date.now() - 1000 * 60 * 60 * 24 * 45).toISOString(),
          createdDate: '2023-03-10T09:15:00Z',
          phoneNumber: '+1-555-0125',
          location: 'Austin, TX',
          toolsAccess: [
            { toolId: '2', toolName: 'Slack', role: 'Member', permissions: ['message'], lastAccess: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(), status: 'INACTIVE' },
            { toolId: '5', toolName: 'HubSpot', role: 'User', permissions: ['read', 'write'], lastAccess: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(), status: 'INACTIVE' }
          ],
          totalTools: 2,
          riskScore: 45
        },
        {
          id: '4',
          email: 'alice.brown@surveysparrow.com',
          name: 'Alice Brown',
          firstName: 'Alice',
          lastName: 'Brown',
          department: 'Human Resources',
          jobTitle: 'HR Manager',
          manager: 'David Chen',
          employeeId: 'SS004',
          status: 'EXIT',
          lastLogin: new Date(Date.now() - 1000 * 60 * 60 * 24 * 95).toISOString(),
          createdDate: '2022-11-05T11:45:00Z',
          phoneNumber: '+1-555-0126',
          location: 'Remote',
          toolsAccess: [
            { toolId: '6', toolName: 'BambooHR', role: 'Admin', permissions: ['full-access'], lastAccess: new Date(Date.now() - 1000 * 60 * 60 * 24 * 90).toISOString(), status: 'INACTIVE' },
            { toolId: '2', toolName: 'Slack', role: 'Member', permissions: ['message'], lastAccess: new Date(Date.now() - 1000 * 60 * 60 * 24 * 90).toISOString(), status: 'INACTIVE' }
          ],
          totalTools: 2,
          riskScore: 95
        }
      ];

      setUsers(mockUsers);
      setJumpCloudStatus(prev => ({
        ...prev,
        totalUsers: mockUsers.length,
        newUsers: mockUsers.filter(u => new Date(u.createdDate) > new Date(Date.now() - 1000 * 60 * 60 * 24 * 30)).length,
        updatedUsers: mockUsers.filter(u => u.lastLogin && new Date(u.lastLogin) > new Date(Date.now() - 1000 * 60 * 60 * 24 * 7)).length
      }));
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSyncJumpCloud = async () => {
    if (!jumpCloudConfig.isConfigured || jumpCloudConfig.connectionStatus !== 'CONNECTED') {
      alert('Please configure and test JumpCloud connection first');
      setShowJumpCloudConfig(true);
      return;
    }

    setIsSyncing(true);
    try {
      console.log('Syncing with JumpCloud Directory...');
      
      // Real JumpCloud API call would go here
      const response = await fetchJumpCloudUsers();
      
      // For now, using mock data but structure for real API
      await loadUsers();
      setJumpCloudStatus(prev => ({
        ...prev,
        lastSync: new Date().toISOString(),
        isActive: true
      }));
    } catch (error) {
      console.error('JumpCloud sync failed:', error);
      setJumpCloudStatus(prev => ({
        ...prev,
        errors: [...prev.errors, (error as Error).message]
      }));
    } finally {
      setIsSyncing(false);
    }
  };

  const fetchJumpCloudUsers = async () => {
    if (!jumpCloudConfig.isConfigured) {
      throw new Error('JumpCloud not configured properly');
    }

    try {
      // Get token from session
      const session = JSON.parse(localStorage.getItem('iga_session') || '{}');
      const token = session.token || '';
      
      // Real JumpCloud sync API call
      const response = await fetch('/api/jumpcloud/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          fullSync: true
        })
      });

      const result = await response.json();

      if (result.success) {
        // Update sync status with real data
        setJumpCloudStatus({
          isActive: true,
          lastSync: result.data.syncedAt,
          totalUsers: result.data.totalFetched,
          newUsers: result.data.created,
          updatedUsers: result.data.updated,
          errors: result.data.errors > 0 ? [`${result.data.errors} users failed to sync`] : []
        });

        console.log('JumpCloud sync completed:', result.data);

        return {
          totalUsers: result.data.totalFetched,
          newUsers: result.data.created,
          updatedUsers: result.data.updated,
          errors: result.data.errors,
          users: [] // Users are saved to database, not returned directly
        };
      } else {
        throw new Error(result.error || 'Sync failed');
      }
    } catch (error) {
      console.error('JumpCloud sync failed:', error);
      throw new Error(`Failed to sync JumpCloud users: ${(error as Error).message}`);
    }
  };

  const testJumpCloudConnection = async () => {
    if (!jumpCloudConfig.apiKey) {
      setJumpCloudConfig(prev => ({
        ...prev,
        connectionStatus: 'ERROR',
        errorMessage: 'API Key is required'
      }));
      return;
    }

    setJumpCloudConfig(prev => ({
      ...prev,
      connectionStatus: 'TESTING'
    }));

    try {
      // Get token from session
      const session = JSON.parse(localStorage.getItem('iga_session') || '{}');
      const token = session.token || '';
      
      // Real JumpCloud API test call
      const response = await fetch('/api/jumpcloud/test-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          apiKey: jumpCloudConfig.apiKey,
          orgId: jumpCloudConfig.orgId
        })
      });

      const result = await response.json();

      if (result.success) {
        setJumpCloudConfig(prev => ({
          ...prev,
          connectionStatus: 'CONNECTED',
          lastTested: new Date().toISOString(),
          errorMessage: undefined,
          isConfigured: true
        }));

        setJumpCloudStatus(prev => ({
          ...prev,
          isActive: true,
          totalUsers: result.data?.userCount || 0
        }));

        console.log('JumpCloud connection successful:', result.data);
      } else {
        setJumpCloudConfig(prev => ({
          ...prev,
          connectionStatus: 'ERROR',
          errorMessage: result.error || 'Connection failed',
          lastTested: new Date().toISOString()
        }));
      }

    } catch (error) {
      console.error('JumpCloud connection test failed:', error);
      setJumpCloudConfig(prev => ({
        ...prev,
        connectionStatus: 'ERROR',
        errorMessage: `Connection failed: ${(error as Error).message}`,
        lastTested: new Date().toISOString()
      }));
    }
  };

  const saveJumpCloudConfig = async () => {
    try {
      // Get token from session
      const session = JSON.parse(localStorage.getItem('iga_session') || '{}');
      const token = session.token || '';
      
      // Save to backend
      const response = await fetch('/api/jumpcloud/configure', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          apiKey: jumpCloudConfig.apiKey,
          orgId: jumpCloudConfig.orgId,
          baseUrl: jumpCloudConfig.baseUrl,
          isActive: true
        })
      });

      const result = await response.json();

      if (result.success) {
        // Also save to localStorage as backup
        localStorage.setItem('jumpcloud-config', JSON.stringify(jumpCloudConfig));
        setShowJumpCloudConfig(false);
        console.log('JumpCloud configuration saved successfully');
      } else {
        console.error('Failed to save JumpCloud configuration:', result.error);
        // Still save to localStorage if backend fails
        localStorage.setItem('jumpcloud-config', JSON.stringify(jumpCloudConfig));
        setShowJumpCloudConfig(false);
      }
    } catch (error) {
      console.error('Error saving JumpCloud configuration:', error);
      // Fallback to localStorage only
      localStorage.setItem('jumpcloud-config', JSON.stringify(jumpCloudConfig));
      setShowJumpCloudConfig(false);
    }
  };

  const loadJumpCloudConfig = () => {
    // In a real app, this would load from backend/localStorage
    const saved = localStorage.getItem('jumpcloud-config');
    if (saved) {
      const config = JSON.parse(saved);
      setJumpCloudConfig(config);
    }
  };

  useEffect(() => {
    loadJumpCloudConfig();
  }, []);

  const handleUserClick = (user: User) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.department.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'ALL' || user.status === filterStatus;
    const matchesDepartment = filterDepartment === 'ALL' || user.department === filterDepartment;
    
    return matchesSearch && matchesStatus && matchesDepartment;
  });

  const departments = Array.from(new Set(users.map(u => u.department)));

  const getStatusColor = (status: User['status']) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800';
      case 'SUSPENDED': return 'bg-yellow-100 text-yellow-800';
      case 'EXIT': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRiskColor = (score: number) => {
    if (score >= 80) return 'text-red-600';
    if (score >= 50) return 'text-yellow-600';
    if (score >= 20) return 'text-orange-600';
    return 'text-green-600';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Users</h1>
          <p className="text-gray-600 mt-1">Employee management and access overview</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            {jumpCloudConfig.connectionStatus === 'CONNECTED' ? (
              <div className="flex items-center text-green-600 text-sm">
                <Wifi className="h-4 w-4 mr-1" />
                Connected
              </div>
            ) : (
              <div className="flex items-center text-red-600 text-sm">
                <WifiOff className="h-4 w-4 mr-1" />
                Not Connected
              </div>
            )}
          </div>
          <button
            onClick={() => setShowJumpCloudConfig(true)}
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center"
          >
            <Settings className="h-4 w-4 mr-2" />
            Configure JumpCloud
          </button>
          <button
            onClick={handleSyncJumpCloud}
            disabled={isSyncing || jumpCloudConfig.connectionStatus !== 'CONNECTED'}
            className="bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Syncing...' : 'Sync JumpCloud'}
          </button>
          <button className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center">
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Sync Status */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <Building className="h-5 w-5 mr-2 text-blue-600" />
            JumpCloud Directory Sync Status
          </h2>
          <div className="flex items-center space-x-4">
            {jumpCloudConfig.isConfigured ? (
              <div className="flex items-center text-green-600 text-sm">
                <CheckCircle className="h-4 w-4 mr-1" />
                Configured
              </div>
            ) : (
              <div className="flex items-center text-yellow-600 text-sm">
                <AlertCircle className="h-4 w-4 mr-1" />
                Setup Required
              </div>
            )}
            {jumpCloudStatus.lastSync && (
              <div className="text-sm text-gray-500 flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                Last sync: {new Date(jumpCloudStatus.lastSync).toLocaleString()}
              </div>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="text-2xl font-bold text-blue-700">{jumpCloudStatus.totalUsers}</div>
            <div className="text-sm text-blue-600">Total Users</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <div className="text-2xl font-bold text-green-700">{users.filter(u => u.status === 'ACTIVE').length}</div>
            <div className="text-sm text-green-600">Active</div>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
            <div className="text-2xl font-bold text-yellow-700">{users.filter(u => u.status === 'SUSPENDED').length}</div>
            <div className="text-sm text-yellow-600">Suspended</div>
          </div>
          <div className="bg-red-50 rounded-lg p-4 border border-red-200">
            <div className="text-2xl font-bold text-red-700">{users.filter(u => u.status === 'EXIT').length}</div>
            <div className="text-sm text-red-600">Exit</div>
          </div>
        </div>
      </div>

      {/* JumpCloud Configuration Notice */}
      {!jumpCloudConfig.isConfigured && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-yellow-600 mr-3 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-yellow-800 mb-1">
                JumpCloud Integration Required
              </h3>
              <p className="text-sm text-yellow-700 mb-3">
                To sync real-time user data from JumpCloud directory, you need to configure the API connection. 
                Currently showing mock data for demonstration purposes.
              </p>
              <button
                onClick={() => setShowJumpCloudConfig(true)}
                className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center"
              >
                <Settings className="h-4 w-4 mr-2" />
                Configure JumpCloud Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex-1 max-w-lg">
            <div className="relative">
              <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, employee ID, or department..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
          
          <div className="flex space-x-4">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="EXIT">Exit</option>
            </select>
            
            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="ALL">All Departments</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            All Employees ({filteredUsers.length})
          </h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tools Access
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Risk Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Login
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => handleUserClick(user)}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                          <Users className="h-5 w-5 text-gray-500" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                        <div className="text-xs text-gray-400">ID: {user.employeeId}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{user.department}</div>
                    <div className="text-sm text-gray-500">{user.jobTitle}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(user.status)}`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.totalTools} tools
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm font-medium ${getRiskColor(user.riskScore)}`}>
                      {user.riskScore}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleUserClick(user)}
                        className="text-blue-600 hover:text-blue-900"
                        title="View details"
                      >
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

      {/* User Detail Modal */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Employee Details</h3>
              <button
                onClick={() => setShowUserModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            
            <div className="p-6">
              {/* User Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-4">
                  <div className="flex items-center">
                    <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center mr-4">
                      <Users className="h-8 w-8 text-gray-500" />
                    </div>
                    <div>
                      <h4 className="text-xl font-semibold text-gray-900">{selectedUser.name}</h4>
                      <p className="text-gray-600">{selectedUser.jobTitle}</p>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedUser.status)}`}>
                        {selectedUser.status}
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center text-sm">
                      <Mail className="h-4 w-4 mr-2 text-gray-400" />
                      {selectedUser.email}
                    </div>
                    <div className="flex items-center text-sm">
                      <Phone className="h-4 w-4 mr-2 text-gray-400" />
                      {selectedUser.phoneNumber || 'N/A'}
                    </div>
                    <div className="flex items-center text-sm">
                      <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                      {selectedUser.location}
                    </div>
                    <div className="flex items-center text-sm">
                      <Building className="h-4 w-4 mr-2 text-gray-400" />
                      {selectedUser.department}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h5 className="font-medium text-gray-900 mb-2">Employee Information</h5>
                    <div className="space-y-2 text-sm text-gray-600">
                      <div>Employee ID: {selectedUser.employeeId}</div>
                      <div>Manager: {selectedUser.manager}</div>
                      <div>Created: {new Date(selectedUser.createdDate).toLocaleDateString()}</div>
                      <div>Last Login: {selectedUser.lastLogin ? new Date(selectedUser.lastLogin).toLocaleString() : 'Never'}</div>
                    </div>
                  </div>
                  
                  <div>
                    <h5 className="font-medium text-gray-900 mb-2">Risk Assessment</h5>
                    <div className={`text-2xl font-bold ${getRiskColor(selectedUser.riskScore)}`}>
                      {selectedUser.riskScore}/100
                    </div>
                    <div className="text-sm text-gray-600">
                      {selectedUser.riskScore >= 80 ? 'High Risk' :
                       selectedUser.riskScore >= 50 ? 'Medium Risk' :
                       selectedUser.riskScore >= 20 ? 'Low Risk' : 'Minimal Risk'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Tools Access */}
              <div>
                <h5 className="font-medium text-gray-900 mb-4 flex items-center">
                  <Settings className="h-4 w-4 mr-2" />
                  Tool Access ({selectedUser.toolsAccess.length})
                </h5>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tool</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Permissions</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Last Access</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedUser.toolsAccess.map((toolAccess, index) => (
                        <tr key={index}>
                          <td className="px-4 py-2 text-sm font-medium text-gray-900">{toolAccess.toolName}</td>
                          <td className="px-4 py-2 text-sm text-gray-600">{toolAccess.role}</td>
                          <td className="px-4 py-2 text-sm text-gray-600">
                            <div className="flex flex-wrap gap-1">
                              {toolAccess.permissions.map((perm, i) => (
                                <span key={i} className="inline-flex px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                                  {perm}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="px-4 py-2 text-sm">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              toolAccess.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {toolAccess.status}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-600">
                            {toolAccess.lastAccess ? new Date(toolAccess.lastAccess).toLocaleDateString() : 'Never'}
                          </td>
                          <td className="px-4 py-2 text-sm">
                            <div className="flex space-x-2">
                              <button
                                className="text-green-600 hover:text-green-800 p-1 rounded"
                                title="Add User to Tool"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  console.log(`Adding user ${selectedUser.name} to ${toolAccess.toolName}`);
                                }}
                              >
                                <UserPlus className="h-4 w-4" />
                              </button>
                              <button
                                className="text-red-600 hover:text-red-800 p-1 rounded"
                                title="Remove User from Tool"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  console.log(`Removing user ${selectedUser.name} from ${toolAccess.toolName}`);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
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
          </div>
        </div>
      )}

      {/* JumpCloud Configuration Modal */}
      {showJumpCloudConfig && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Building className="h-5 w-5 mr-2 text-blue-600" />
                JumpCloud Integration Setup
              </h3>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Connection Status */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`h-3 w-3 rounded-full mr-3 ${
                      jumpCloudConfig.connectionStatus === 'CONNECTED' ? 'bg-green-500' :
                      jumpCloudConfig.connectionStatus === 'TESTING' ? 'bg-yellow-500' :
                      jumpCloudConfig.connectionStatus === 'ERROR' ? 'bg-red-500' : 'bg-gray-400'
                    }`}></div>
                    <div>
                      <div className="font-medium text-gray-900">Connection Status</div>
                      <div className="text-sm text-gray-600">
                        {jumpCloudConfig.connectionStatus === 'CONNECTED' && 'Successfully connected to JumpCloud'}
                        {jumpCloudConfig.connectionStatus === 'TESTING' && 'Testing connection...'}
                        {jumpCloudConfig.connectionStatus === 'ERROR' && `Error: ${jumpCloudConfig.errorMessage}`}
                        {jumpCloudConfig.connectionStatus === 'DISCONNECTED' && 'Not connected'}
                      </div>
                    </div>
                  </div>
                  {jumpCloudConfig.lastTested && (
                    <div className="text-xs text-gray-500">
                      Last tested: {new Date(jumpCloudConfig.lastTested).toLocaleString()}
                    </div>
                  )}
                </div>
              </div>

              {/* API Configuration */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Key className="h-4 w-4 inline mr-2" />
                    JumpCloud API Key
                  </label>
                  <input
                    type="password"
                    value={jumpCloudConfig.apiKey}
                    onChange={(e) => setJumpCloudConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Enter your JumpCloud API key"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Generate an API key from your JumpCloud Admin Console → API Settings
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Building className="h-4 w-4 inline mr-2" />
                    Organization ID
                  </label>
                  <input
                    type="text"
                    value={jumpCloudConfig.orgId}
                    onChange={(e) => setJumpCloudConfig(prev => ({ ...prev, orgId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Enter your JumpCloud Organization ID"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Found in JumpCloud Admin Console → Settings → Organization
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Server className="h-4 w-4 inline mr-2" />
                    API Base URL
                  </label>
                  <input
                    type="url"
                    value={jumpCloudConfig.baseUrl}
                    onChange={(e) => setJumpCloudConfig(prev => ({ ...prev, baseUrl: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="https://console.jumpcloud.com/api"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Default JumpCloud API endpoint (usually no changes needed)
                  </p>
                </div>
              </div>

              {/* Test Connection */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Test Connection</h4>
                <p className="text-sm text-blue-700 mb-3">
                  Test your JumpCloud connection before saving the configuration
                </p>
                <button
                  onClick={testJumpCloudConnection}
                  disabled={jumpCloudConfig.connectionStatus === 'TESTING' || !jumpCloudConfig.apiKey || !jumpCloudConfig.orgId}
                  className="bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center"
                >
                  {jumpCloudConfig.connectionStatus === 'TESTING' ? (
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <TestTube className="h-4 w-4 mr-2" />
                  )}
                  {jumpCloudConfig.connectionStatus === 'TESTING' ? 'Testing...' : 'Test Connection'}
                </button>
              </div>

              {/* API Permissions Info */}
              <div className="bg-yellow-50 rounded-lg p-4">
                <h4 className="font-medium text-yellow-900 mb-2 flex items-center">
                  <Shield className="h-4 w-4 mr-2" />
                  Required API Permissions
                </h4>
                <ul className="text-sm text-yellow-800 space-y-1">
                  <li>• <strong>System Users:</strong> Read access to fetch user information</li>
                  <li>• <strong>User Groups:</strong> Read access to get group memberships</li>
                  <li>• <strong>Organization:</strong> Read access to verify organization details</li>
                  <li>• <strong>Directory Insights:</strong> Read access for user activity data</li>
                </ul>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => setShowJumpCloudConfig(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={saveJumpCloudConfig}
                  disabled={jumpCloudConfig.connectionStatus !== 'CONNECTED'}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Save Configuration
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
