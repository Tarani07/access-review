import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, Download, Upload, RefreshCw, Search, Filter, Eye, EyeOff, 
  CheckCircle, AlertTriangle, X, FileText, BarChart3, TrendingUp,
  UserCheck, UserX, Shield, Clock, Mail, Calendar, Settings
} from 'lucide-react';
import ExcelExportService from '../services/excelExport';

interface SyncedUser {
  id: string;
  tool: string;
  email: string;
  role: string;
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING';
  lastLogin?: string;
  permissions: string[];
  syncedAt: string;
  department?: string;
  manager?: string;
  joinDate?: string;
}

interface ExitUser {
  email: string;
  name: string;
  department: string;
  exitDate: string;
  reason: string;
}

interface UserManagementProps {
  tools: any[];
}

export default function UserManagement({ tools }: UserManagementProps) {
  const [syncedUsers, setSyncedUsers] = useState<SyncedUser[]>([]);
  const [exitUsers, setExitUsers] = useState<ExitUser[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTool, setSelectedTool] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [showExitComparison, setShowExitComparison] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);

  // Load synced users from localStorage
  useEffect(() => {
    const storedUsers = localStorage.getItem('syncedUsers');
    if (storedUsers) {
      setSyncedUsers(JSON.parse(storedUsers));
    }
  }, []);

  // Filter users based on search and filters
  const filteredUsers = useMemo(() => {
    return syncedUsers.filter(user => {
      const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           user.tool.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           user.role.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesTool = selectedTool === '' || user.tool === selectedTool;
      const matchesStatus = selectedStatus === '' || user.status === selectedStatus;
      
      return matchesSearch && matchesTool && matchesStatus;
    });
  }, [syncedUsers, searchTerm, selectedTool, selectedStatus]);

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentUsers = filteredUsers.slice(startIndex, endIndex);

  // Exit list comparison
  const usersToRemove = useMemo(() => {
    if (!showExitComparison || exitUsers.length === 0) return [];
    
    return syncedUsers.filter(user => 
      exitUsers.some(exitUser => 
        exitUser.email.toLowerCase() === user.email.toLowerCase()
      )
    );
  }, [syncedUsers, exitUsers, showExitComparison]);

  const activeUsers = useMemo(() => {
    if (!showExitComparison) return filteredUsers;
    
    return filteredUsers.filter(user => 
      !exitUsers.some(exitUser => 
        exitUser.email.toLowerCase() === user.email.toLowerCase()
      )
    );
  }, [filteredUsers, exitUsers, showExitComparison]);

  // Sync all tools
  const syncAllTools = async () => {
    setIsLoading(true);
    const toolsWithApi = tools.filter(tool => tool.hasApiSupport && tool.apiKey && tool.apiEndpoint);
    
    for (const tool of toolsWithApi) {
      try {
        const response = await fetch(tool.apiEndpoint, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${tool.apiKey}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          const users = Array.isArray(data) ? data : (data.users || []);
          
          const usersToStore = users.map((user: any, index: number) => ({
            id: `user-${Date.now()}-${tool.id}-${index}`,
            tool: tool.name,
            email: user.email || user.username || `user${index}@${tool.name.toLowerCase()}.com`,
            role: user.role || user.title || 'user',
            status: 'ACTIVE' as const,
            lastLogin: user.last_login || user.lastLogin || new Date().toISOString(),
            permissions: user.permissions || [],
            syncedAt: new Date().toISOString(),
            department: user.department || 'Unknown',
            manager: user.manager || 'Unknown',
            joinDate: user.join_date || user.joinDate || new Date().toISOString()
          }));

          const existingUsers = JSON.parse(localStorage.getItem('syncedUsers') || '[]');
          const updatedUsers = [...existingUsers, ...usersToStore];
          localStorage.setItem('syncedUsers', JSON.stringify(updatedUsers));
        }
      } catch (error) {
        console.error(`Failed to sync ${tool.name}:`, error);
      }
    }
    
    // Reload users
    const storedUsers = localStorage.getItem('syncedUsers');
    if (storedUsers) {
      setSyncedUsers(JSON.parse(storedUsers));
    }
    setIsLoading(false);
  };

  // Export to Excel using the service
  const exportToExcel = (users: SyncedUser[], filename: string) => {
    ExcelExportService.exportUsersToCSV(users, filename);
  };

  // Export comprehensive report
  const exportComprehensiveReport = () => {
    const stats = {
      totalUsers: syncedUsers.length,
      activeUsers: syncedUsers.filter(u => u.status === 'ACTIVE').length,
      inactiveUsers: syncedUsers.filter(u => u.status === 'INACTIVE').length,
      usersToRemove: usersToRemove.length,
      toolsCount: uniqueTools.length
    };

    ExcelExportService.exportMultiSheetReport(
      activeUsers,
      usersToRemove,
      exitUsers,
      stats
    );
  };

  // Handle exit list upload
  const handleExitListUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n');
      const headers = lines[0].split(',').map(h => h.trim());
      
      const exitUsersData: ExitUser[] = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim());
        return {
          email: values[0] || '',
          name: values[1] || '',
          department: values[2] || '',
          exitDate: values[3] || '',
          reason: values[4] || ''
        };
      }).filter(user => user.email);

      setExitUsers(exitUsersData);
    };
    reader.readAsText(file);
  };

  const uniqueTools = [...new Set(syncedUsers.map(user => user.tool))];
  const stats = {
    total: syncedUsers.length,
    active: syncedUsers.filter(u => u.status === 'ACTIVE').length,
    inactive: syncedUsers.filter(u => u.status === 'INACTIVE').length,
    toRemove: usersToRemove.length
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-6 space-y-4 lg:space-y-0">
        <div>
          <h3 className="text-lg font-medium text-gray-900">User Access Management</h3>
          <p className="text-sm text-gray-500 mt-1">
            Manage user access across {uniqueTools.length} tools • {stats.total} total users
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={syncAllTools}
            disabled={isLoading}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white text-sm rounded-md transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'Syncing...' : 'Sync All Tools'}</span>
          </button>
          <button
            onClick={() => exportToExcel(activeUsers, 'active_users')}
            className="flex items-center space-x-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm rounded-md transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>Export Active Users</span>
          </button>
          <button
            onClick={() => setShowExitComparison(!showExitComparison)}
            className={`flex items-center space-x-2 px-4 py-2 text-sm rounded-md transition-colors ${
              showExitComparison 
                ? 'bg-red-500 hover:bg-red-600 text-white' 
                : 'bg-gray-500 hover:bg-gray-600 text-white'
            }`}
          >
            <UserX className="h-4 w-4" />
            <span>{showExitComparison ? 'Hide Exit Comparison' : 'Show Exit Comparison'}</span>
          </button>
          <button
            onClick={exportComprehensiveReport}
            className="flex items-center space-x-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white text-sm rounded-md transition-colors"
          >
            <FileText className="h-4 w-4" />
            <span>Export Full Report</span>
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-blue-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-blue-900">Total Users</p>
              <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center">
            <UserCheck className="h-8 w-8 text-green-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-green-900">Active Users</p>
              <p className="text-2xl font-bold text-green-600">{stats.active}</p>
            </div>
          </div>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-yellow-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-yellow-900">Inactive Users</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.inactive}</p>
            </div>
          </div>
        </div>
        <div className="bg-red-50 p-4 rounded-lg">
          <div className="flex items-center">
            <UserX className="h-8 w-8 text-red-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-red-900">To Remove</p>
              <p className="text-2xl font-bold text-red-600">{stats.toRemove}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Exit List Upload */}
      {showExitComparison && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <h4 className="text-sm font-medium text-red-900 mb-2">Upload Exit List</h4>
          <p className="text-xs text-red-700 mb-3">
            Upload a CSV file with columns: Email, Name, Department, Exit Date, Reason
          </p>
          <input
            type="file"
            accept=".csv"
            onChange={handleExitListUpload}
            className="text-sm text-red-700 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-red-100 file:text-red-700 hover:file:bg-red-200"
          />
          {exitUsers.length > 0 && (
            <div className="mt-3 text-sm text-red-700">
              Loaded {exitUsers.length} exit users
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex-1 min-w-64">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search users by email, tool, or role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>
        </div>
        <select
          value={selectedTool}
          onChange={(e) => setSelectedTool(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
        >
          <option value="">All Tools</option>
          {uniqueTools.map(tool => (
            <option key={tool} value={tool}>{tool}</option>
          ))}
        </select>
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
        >
          <option value="">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
          <option value="PENDING">Pending</option>
        </select>
      </div>

      {/* Users Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tool
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
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
            {currentUsers.map((user) => {
              const isInExitList = showExitComparison && exitUsers.some(exitUser => 
                exitUser.email.toLowerCase() === user.email.toLowerCase()
              );
              
              return (
                <tr key={user.id} className={isInExitList ? 'bg-red-50' : 'hover:bg-gray-50'}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                          <Users className="h-5 w-5 text-emerald-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{user.email}</div>
                        <div className="text-sm text-gray-500">{user.department || 'Unknown Department'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{user.tool}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{user.role}</div>
                    {user.permissions.length > 0 && (
                      <div className="text-xs text-gray-500">
                        {user.permissions.slice(0, 2).join(', ')}
                        {user.permissions.length > 2 && ` +${user.permissions.length - 2} more`}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      user.status === 'ACTIVE' 
                        ? 'bg-green-100 text-green-800'
                        : user.status === 'INACTIVE'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {user.status}
                    </span>
                    {isInExitList && (
                      <div className="mt-1 text-xs text-red-600 font-medium">
                        ⚠️ In Exit List
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => exportToExcel([user], `user_${user.email.replace('@', '_')}`)}
                        className="text-emerald-600 hover:text-emerald-900"
                        title="Export user details"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <div className="text-sm text-gray-700">
            Showing {startIndex + 1} to {Math.min(endIndex, filteredUsers.length)} of {filteredUsers.length} users
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="px-3 py-1 text-sm text-gray-700">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Export Actions */}
      {showExitComparison && usersToRemove.length > 0 && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <h4 className="text-sm font-medium text-red-900 mb-2">
            Users to Remove ({usersToRemove.length})
          </h4>
          <p className="text-xs text-red-700 mb-3">
            These users are in your exit list and should have their access removed.
          </p>
          <button
            onClick={() => exportToExcel(usersToRemove, 'users_to_remove')}
            className="flex items-center space-x-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm rounded-md transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>Export Users to Remove</span>
          </button>
        </div>
      )}
    </div>
  );
}
