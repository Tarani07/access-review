import React, { useState } from 'react';
import { Users, Trash2, Mail, Download, Upload, CheckCircle, AlertTriangle, X, RefreshCw, Eye, EyeOff, Filter, Search } from 'lucide-react';

interface UserData {
  id: string;
  email: string;
  name?: string;
  role?: string;
  department?: string;
  status?: string;
  lastLogin?: string;
  permissions?: string[];
  manager?: string;
  joinDate?: string;
  isSelected?: boolean;
  isFlagged?: boolean;
  reason?: string;
}

interface BulkUserManagementProps {
  users: UserData[];
  toolName: string;
  onBulkAction: (action: string, userIds: string[]) => Promise<void>;
  onClose: () => void;
}

export default function BulkUserManagement({ users, toolName, onBulkAction, onClose }: BulkUserManagementProps) {
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterRole, setFilterRole] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionType, setActionType] = useState<string>('');
  const [showPreview, setShowPreview] = useState(false);

  // Filter users based on search and filters
  const filteredUsers = users.filter(user => {
    const matchesSearch = searchTerm === '' || 
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.name && user.name.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = filterStatus === '' || user.status === filterStatus;
    const matchesRole = filterRole === '' || user.role === filterRole;
    
    return matchesSearch && matchesStatus && matchesRole;
  });

  const handleUserSelection = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map(user => user.id));
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedUsers.length === 0) {
      alert('Please select users first');
      return;
    }

    setActionType(action);
    setIsProcessing(true);

    try {
      await onBulkAction(action, selectedUsers);
      setSelectedUsers([]);
      setShowPreview(false);
    } catch (error) {
      console.error('Bulk action failed:', error);
      alert(`Bulk action failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
      setActionType('');
    }
  };

  const exportSelectedUsers = () => {
    const selectedUserData = users.filter(user => selectedUsers.includes(user.id));
    
    const csv = [
      ['Email', 'Name', 'Role', 'Department', 'Status', 'Last Login', 'Permissions', 'Manager', 'Join Date'],
      ...selectedUserData.map(user => [
        user.email,
        user.name || '',
        user.role || '',
        user.department || '',
        user.status || '',
        user.lastLogin || '',
        user.permissions?.join(';') || '',
        user.manager || '',
        user.joinDate || ''
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${toolName}_selected_users_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-red-100 text-red-800';
      case 'exited':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role?.toLowerCase()) {
      case 'admin':
      case 'owner':
        return 'bg-red-100 text-red-800';
      case 'manager':
        return 'bg-yellow-100 text-yellow-800';
      case 'user':
      case 'member':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Bulk User Management - {toolName}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{users.length}</div>
              <div className="text-sm text-blue-700">Total Users</div>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{selectedUsers.length}</div>
              <div className="text-sm text-green-700">Selected</div>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {users.filter(u => u.isFlagged).length}
              </div>
              <div className="text-sm text-yellow-700">Flagged</div>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-red-600">
                {users.filter(u => u.status === 'exited' || u.status === 'inactive').length}
              </div>
              <div className="text-sm text-red-700">Inactive</div>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by email or name..."
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="exited">Exited</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                <option value="">All Roles</option>
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
                <option value="user">User</option>
                <option value="member">Member</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="w-full bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md font-medium flex items-center justify-center space-x-2 transition-colors"
              >
                <Eye className="h-4 w-4" />
                <span>{showPreview ? 'Hide' : 'Show'} Preview</span>
              </button>
            </div>
          </div>

          {/* Bulk Actions */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Bulk Actions</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <button
                onClick={() => handleBulkAction('deactivate')}
                disabled={selectedUsers.length === 0 || isProcessing}
                className="bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-md font-medium flex items-center justify-center space-x-2 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                <span>Deactivate</span>
              </button>
              
              <button
                onClick={() => handleBulkAction('send_email')}
                disabled={selectedUsers.length === 0 || isProcessing}
                className="bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-md font-medium flex items-center justify-center space-x-2 transition-colors"
              >
                <Mail className="h-4 w-4" />
                <span>Send Email</span>
              </button>
              
              <button
                onClick={() => handleBulkAction('export')}
                disabled={selectedUsers.length === 0}
                className="bg-green-500 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-md font-medium flex items-center justify-center space-x-2 transition-colors"
              >
                <Download className="h-4 w-4" />
                <span>Export</span>
              </button>
              
              <button
                onClick={() => handleBulkAction('flag')}
                disabled={selectedUsers.length === 0 || isProcessing}
                className="bg-yellow-500 hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-md font-medium flex items-center justify-center space-x-2 transition-colors"
              >
                <AlertTriangle className="h-4 w-4" />
                <span>Flag</span>
              </button>
              
              <button
                onClick={handleSelectAll}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md font-medium flex items-center justify-center space-x-2 transition-colors"
              >
                <CheckCircle className="h-4 w-4" />
                <span>{selectedUsers.length === filteredUsers.length ? 'Deselect All' : 'Select All'}</span>
              </button>
            </div>
          </div>

          {/* Users Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Department
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
                  <tr key={user.id} className={`hover:bg-gray-50 ${user.isFlagged ? 'bg-yellow-50' : ''}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.id)}
                        onChange={() => handleUserSelection(user.id)}
                        className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <div className="text-sm font-medium text-gray-900">{user.email}</div>
                        {user.name && (
                          <div className="text-sm text-gray-500">{user.name}</div>
                        )}
                        {user.isFlagged && (
                          <div className="text-xs text-red-600 font-medium">⚠️ Flagged</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.role || '')}`}>
                        {user.role || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(user.status || '')}`}>
                        {user.status || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.department || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleUserSelection(user.id)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          {selectedUsers.includes(user.id) ? 'Deselect' : 'Select'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Processing Indicator */}
          {isProcessing && (
            <div className="fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 flex items-center space-x-3">
                <RefreshCw className="h-6 w-6 animate-spin text-blue-500" />
                <span className="text-lg font-medium">Processing {actionType}...</span>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              Showing {filteredUsers.length} of {users.length} users
              {selectedUsers.length > 0 && ` • ${selectedUsers.length} selected`}
            </div>
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium transition-colors"
              >
                Close
              </button>
              {selectedUsers.length > 0 && (
                <button
                  onClick={exportSelectedUsers}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-md font-medium flex items-center space-x-2 transition-colors"
                >
                  <Download className="h-4 w-4" />
                  <span>Export Selected</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
