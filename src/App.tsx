import React, { useState } from 'react';
import { Upload, Download, Trash2, Users, AlertTriangle, CheckCircle, Search, Mail, Settings, History, LogOut, Plus, Eye, Shield, Bird, BarChart3, FileText } from 'lucide-react';
import ToolManagement from './components/ToolManagement';
import HistoryView from './components/HistoryView';
import AddToolModal from './components/AddToolModal';
import AccessControlGate from './components/AccessControlGate';
import EnhancedDashboard from './components/EnhancedDashboard';
import UserManagement from './components/UserManagement';
import BulkUserManagement from './components/BulkUserManagement';
import PolicyService from './services/policy';

interface UserAccess {
  id: string;
  tool: string;
  email: string;
  role: string;
  status: 'ACTIVE' | 'EXITED';
  lastLogin?: string;
  permissions?: string[];
}

interface Tool {
  id: string;
  name: string;
  category: string;
  isActive: boolean;
  hasApiSupport?: boolean;
  apiKey?: string;
  apiEndpoint?: string;
  lastSync?: string;
  connectionStatus?: 'connected' | 'disconnected' | 'testing';
  userListFile?: File;
  exitUsersFile?: File;
}


interface HistoryRecord {
  id: string;
  date: string;
  tool: string;
  action: 'SCAN' | 'REMOVE' | 'EMAIL_SENT';
  userEmail: string;
  performedBy: string;
  details: string;
}

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isAddToolModalOpen, setIsAddToolModalOpen] = useState(false);
  const [downloadOnlyFlagged, setDownloadOnlyFlagged] = useState(false);
  const [searchEmail, setSearchEmail] = useState('');
  const [filterTool, setFilterTool] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  
  const [selectedTool, setSelectedTool] = useState('');
  const [exitEmails, setExitEmails] = useState('');
  const [userAccessData, setUserAccessData] = useState<UserAccess[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [bulkManagementOpen, setBulkManagementOpen] = useState(false);
  const [bulkManagementUsers, setBulkManagementUsers] = useState<any[]>([]);
  const [selectedToolForBulk, setSelectedToolForBulk] = useState<string>('');

  const policyService = PolicyService;
  const currentUser = 'admin@surveysparrow.com';
  
  const [tools, setTools] = useState<Tool[]>([
    // Pre-configured tools with some sample data
    { 
      id: '1', 
      name: 'Slack', 
      category: 'Communication', 
      isActive: true,
      hasApiSupport: true,
      apiKey: 'xoxb-slack-bot-token-67890',
      apiEndpoint: 'https://slack.com/api',
      connectionStatus: 'connected',
      lastSync: '2024-01-14T15:20:00Z'
    },
    { 
      id: '2', 
      name: 'AWS', 
      category: 'Cloud Services', 
      isActive: true,
      hasApiSupport: true,
      apiKey: 'AKIA_aws_access_key_ghijkl',
      apiEndpoint: 'https://iam.amazonaws.com',
      connectionStatus: 'connected',
      lastSync: '2024-01-13T09:45:00Z'
    },
    { 
      id: '3', 
      name: 'CCTV - Kochi', 
      category: 'Physical Security', 
      isActive: true,
      hasApiSupport: false,
      connectionStatus: 'disconnected'
    },
  ]);

  const [historyRecords, setHistoryRecords] = useState<HistoryRecord[]>([
    {
      id: '1',
      date: '2024-01-15T10:30:00Z',
      tool: 'Slack',
      action: 'SCAN',
      userEmail: 'john.doe@surveysparrow.com',
      performedBy: 'admin@surveysparrow.com',
      details: 'Access review scan completed for Slack workspace'
    },
    {
      id: '2',
      date: '2024-01-15T11:00:00Z',
      tool: 'Slack',
      action: 'REMOVE',
      userEmail: 'jane.smith@surveysparrow.com',
      performedBy: 'admin@surveysparrow.com',
      details: 'User removed from Slack workspace due to exit'
    },
    {
      id: '3',
      date: '2024-01-10T14:20:00Z',
      tool: 'AWS',
      action: 'EMAIL_SENT',
      userEmail: 'mike.johnson@surveysparrow.com',
      performedBy: 'admin@surveysparrow.com',
      details: 'Access review notification sent to user'
    },
    {
      id: '4',
      date: '2023-12-20T09:15:00Z',
      tool: 'Figma',
      action: 'SCAN',
      userEmail: 'sarah.wilson@surveysparrow.com',
      performedBy: 'admin@surveysparrow.com',
      details: 'Quarterly access review scan for Figma'
    }
  ]);

  // Helper function to check if email is from SurveySparrow
  const isOrgEmail = (email: string) => email.toLowerCase().endsWith('@surveysparrow.com');

  // Filter user data based on search and filters
  const filteredUserData = userAccessData.filter(user => {
    const matchesSearch = searchEmail === '' || user.email.toLowerCase().includes(searchEmail.toLowerCase());
    const matchesTool = filterTool === '' || user.tool === filterTool;
    const matchesRole = filterRole === '' || user.role === filterRole;
    const matchesStatus = filterStatus === '' || user.status === filterStatus;
    
    return matchesSearch && matchesTool && matchesRole && matchesStatus;
  });

  // Calculate enhanced summary with non-org users
  const enhancedSummary = {
    totalUsers: filteredUserData.length,
    exitedUsers: filteredUserData.filter(user => user.status === 'EXITED').length,
    flaggedAccounts: filteredUserData.filter(user => user.status === 'EXITED' && (user.role === 'Admin' || user.role === 'Owner')).length,
    nonOrgUsers: filteredUserData.filter(user => !isOrgEmail(user.email)).length
  };

  const mockData: UserAccess[] = [
    { 
      id: '1', 
      tool: 'Slack', 
      email: 'john.doe@surveysparrow.com', 
      role: 'Admin', 
      status: 'ACTIVE',
      lastLogin: '2024-01-15',
      permissions: ['Channel Management', 'User Management']
    },
    { 
      id: '2', 
      tool: 'Slack', 
      email: 'jane.smith@surveysparrow.com', 
      role: 'Member', 
      status: 'EXITED',
      lastLogin: '2023-12-20',
      permissions: ['Basic Access']
    },
    { 
      id: '3', 
      tool: 'Slack', 
      email: 'mike.johnson@surveysparrow.com', 
      role: 'Owner', 
      status: 'ACTIVE',
      lastLogin: '2024-01-14',
      permissions: ['Full Access', 'Billing Management']
    },
    { 
      id: '4', 
      tool: 'Slack', 
      email: 'sarah.wilson@surveysparrow.com', 
      role: 'Member', 
      status: 'EXITED',
      lastLogin: '2023-11-15',
      permissions: ['Basic Access']
    },
    { 
      id: '5', 
      tool: 'Slack', 
      email: 'david.brown@surveysparrow.com', 
      role: 'Admin', 
      status: 'ACTIVE',
      lastLogin: '2024-01-13',
      permissions: ['Channel Management', 'User Management']
    },
    // Add some non-org email examples for testing
    { 
      id: '6', 
      tool: 'Slack', 
      email: 'contractor@external.com', 
      role: 'Member', 
      status: 'ACTIVE',
      lastLogin: '2024-01-10',
      permissions: ['Basic Access']
    },
    { 
      id: '7', 
      tool: 'Slack', 
      email: 'freelancer@gmail.com', 
      role: 'Guest', 
      status: 'EXITED',
      lastLogin: '2023-10-15',
      permissions: ['Limited Access']
    },
  ];

  const handleLogout = () => {
    setActiveTab('dashboard');
    setUserAccessData([]);
    setSelectedUsers([]);
  };

  const handleStartReview = async () => {
    if (!selectedTool) {
      alert('Please select a tool first');
      return;
    }

    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    let filteredData;
    if (selectedTool === 'all') {
      // Generate mock data for all tools
      filteredData = tools.filter(tool => tool.isActive && tool.connectionStatus === 'connected').flatMap(tool => 
        mockData.map(user => ({ ...user, tool: tool.name, id: `${tool.id}-${user.id}` }))
      );
    } else {
      // Check if the selected tool has API access
      const selectedToolData = tools.find(tool => tool.name === selectedTool);
      if (!selectedToolData?.apiKey) {
        alert('API key not configured for this tool. Please configure it in Tool Management.');
        setIsLoading(false);
        return;
      }
      if (selectedToolData.connectionStatus !== 'connected') {
        alert('Tool is not connected. Please test the connection in Tool Management.');
        setIsLoading(false);
        return;
      }
      
      filteredData = mockData.filter(user => user.tool === selectedTool);
    }
    
    setUserAccessData(filteredData);
    
    // Add to history
    const newHistoryRecord: HistoryRecord = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      tool: selectedTool === 'all' ? 'All Tools' : selectedTool,
      action: 'SCAN',
      userEmail: 'Multiple Users',
      performedBy: currentUser,
      details: `Access review scan completed for ${selectedTool === 'all' ? 'all tools' : selectedTool}`
    };
    setHistoryRecords(prev => [newHistoryRecord, ...prev]);
    
    setIsLoading(false);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setCsvFile(file);
      console.log('CSV file uploaded:', file.name);
    }
  };

  const handleDownloadCSV = () => {
    const dataToDownload = downloadOnlyFlagged 
      ? filteredUserData.filter(user => user.status === 'EXITED' || !isOrgEmail(user.email))
      : filteredUserData;
      
    const csv = [
      ['Tool', 'Email', 'Role', 'Status', 'Last Login', 'Permissions', 'Non-Org Email'],
      ...dataToDownload.map(user => [
        user.tool, 
        user.email, 
        user.role, 
        user.status, 
        user.lastLogin || 'N/A',
        user.permissions?.join('; ') || 'N/A',
        isOrgEmail(user.email) ? 'No' : 'Yes'
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = downloadOnlyFlagged ? 'flagged_users_access_review.csv' : 'access_review.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadExcel = () => {
    alert('Excel download functionality would be implemented here');
  };

  const handleRemoveUsers = async () => {
    if (selectedUsers.length === 0) {
      alert('Please select users to remove');
      return;
    }

    const confirmRemoval = window.confirm(
      `Are you sure you want to remove ${selectedUsers.length} user(s) from their respective tools? This action cannot be undone.`
    );

    if (!confirmRemoval) return;

    setIsLoading(true);
    
    // Simulate API calls to remove users from tools
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Remove selected users from the data
    const removedUsers = userAccessData.filter(user => selectedUsers.includes(user.id));
    const remainingUsers = userAccessData.filter(user => !selectedUsers.includes(user.id));
    
    setUserAccessData(remainingUsers);
    setSelectedUsers([]);
    
    // Add to history for each removed user
    const newHistoryRecords = removedUsers.map(user => ({
      id: `${Date.now()}-${user.id}`,
      date: new Date().toISOString(),
      tool: user.tool,
      action: 'REMOVE' as const,
      userEmail: user.email,
      performedBy: currentUser,
      details: `User removed from ${user.tool} due to access review`
    }));
    
    setHistoryRecords(prev => [...newHistoryRecords, ...prev]);
    setIsLoading(false);
    
    alert(`${removedUsers.length} user(s) successfully removed from their tools`);
  };

  const handleSendEmail = async () => {
    if (selectedUsers.length === 0) {
      alert('Please select users to send emails to');
      return;
    }

    setIsLoading(true);
    
    // Simulate sending emails
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const emailedUsers = userAccessData.filter(user => selectedUsers.includes(user.id));
    
    // Add to history for each emailed user
    const newHistoryRecords = emailedUsers.map(user => ({
      id: `${Date.now()}-email-${user.id}`,
      date: new Date().toISOString(),
      tool: user.tool,
      action: 'EMAIL_SENT' as const,
      userEmail: user.email,
      performedBy: currentUser,
      details: `Access review notification sent to user`
    }));
    
    setHistoryRecords(prev => [...newHistoryRecords, ...prev]);
    setIsLoading(false);
    
    alert(`Email notifications sent to ${emailedUsers.length} user(s)`);
  };

  const handleUserSelection = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === filteredUserData.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUserData.map(user => user.id));
    }
  };

  const handleAddNewTool = (tool: Omit<Tool, 'id'>) => {
    const newTool: Tool = {
      ...tool,
      id: Date.now().toString()
    };
    setTools(prev => [...prev, newTool]);
    setIsAddToolModalOpen(false);
  };

  const handleAddTool = (tool: Omit<Tool, 'id'>) => {
    const newTool: Tool = {
      ...tool,
      id: Date.now().toString()
    };
    setTools(prev => [...prev, newTool]);
  };

  const handleUpdateTool = (id: string, updates: Partial<Tool>) => {
    setTools(prev => prev.map(tool => 
      tool.id === id ? { ...tool, ...updates } : tool
    ));
  };

  const handleDeleteTool = (id: string) => {
    if (window.confirm('Are you sure you want to delete this tool?')) {
      setTools(prev => prev.filter(tool => tool.id !== id));
    }
  };

  const handleBulkUserManagement = (toolName: string) => {
    const toolUsers = userAccessData.filter(user => user.tool === toolName);
    setBulkManagementUsers(toolUsers);
    setSelectedToolForBulk(toolName);
    setBulkManagementOpen(true);
  };

  const handleBulkAction = async (action: string, userIds: string[]) => {
    setIsLoading(true);
    
    try {
      // Simulate API calls for bulk actions
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      switch (action) {
        case 'deactivate':
          // Update user status to inactive
          setUserAccessData(prev => 
            prev.map(user => 
              userIds.includes(user.id) 
                ? { ...user, status: 'EXITED' as const }
                : user
            )
          );
          break;
        case 'send_email':
          // Simulate sending emails
          console.log(`Sending emails to ${userIds.length} users`);
          break;
        case 'export':
          // Export functionality is handled in the component
          break;
        case 'flag':
          // Flag users for review
          setUserAccessData(prev => 
            prev.map(user => 
              userIds.includes(user.id) 
                ? { ...user, isFlagged: true }
                : user
            )
          );
          break;
      }
      
      // Add to history
      const newHistoryRecord: HistoryRecord = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        tool: selectedToolForBulk,
        action: action.toUpperCase() as any,
        userEmail: `${userIds.length} users`,
        performedBy: currentUser,
        details: `Bulk ${action} performed on ${userIds.length} users`
      };
      setHistoryRecords(prev => [newHistoryRecord, ...prev]);
      
    } catch (error) {
      console.error('Bulk action failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AccessControlGate currentUser={''}>
    <div className="min-h-screen bg-gray-50 font-['Inter',sans-serif]">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="relative mr-3" style={{ width: '32px', height: '32px' }}>
                <Shield className="h-8 w-8 text-emerald-600" />
                <Bird className="h-4 w-4 text-white absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" />
              </div>
                          <h1 className="text-2xl font-bold text-gray-900">Sparrow Vision</h1>
            </div>
            <nav className="flex items-center space-x-8">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'dashboard' 
                    ? 'text-emerald-600 bg-emerald-50' 
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                <BarChart3 className="h-4 w-4 inline mr-1" />
                Dashboard
              </button>
              <button
                onClick={() => setActiveTab('access-review')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'access-review' 
                    ? 'text-emerald-600 bg-emerald-50' 
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                <Eye className="h-4 w-4 inline mr-1" />
                Access Review
              </button>
              <button
                onClick={() => setActiveTab('tools')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'tools' 
                    ? 'text-emerald-600 bg-emerald-50' 
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                <Settings className="h-4 w-4 inline mr-1" />
                Tools
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'users' 
                    ? 'text-emerald-600 bg-emerald-50' 
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                <Users className="h-4 w-4 inline mr-1" />
                Users
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'history' 
                    ? 'text-emerald-600 bg-emerald-50' 
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                <History className="h-4 w-4 inline mr-1" />
                Audit Logs
              </button>
              <button
                onClick={() => setActiveTab('policies')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'policies' 
                    ? 'text-emerald-600 bg-emerald-50' 
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                <FileText className="h-4 w-4 inline mr-1" />
                Policies
              </button>
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">Guest</div>
                  <div className="text-xs text-gray-500">guest@example.com</div>
                </div>
                <button
                  onClick={handleLogout}
                  className="text-gray-500 hover:text-gray-900 p-2 rounded-md transition-colors"
                  title="Logout"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && (
          <EnhancedDashboard />
        )}

        {activeTab === 'access-review' && (
          <>
            {/* Access Review Content */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Access Review</h2>
              <p className="text-gray-600 mt-1">Review and manage user access across all systems</p>
            </div>

            {/* Dashboard Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <div className="flex items-center">
                  <Users className="h-8 w-8 text-blue-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Users</p>
                    <p className="text-2xl font-bold text-gray-900">{enhancedSummary.totalUsers}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <div className="flex items-center">
                  <AlertTriangle className="h-8 w-8 text-red-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Exited Users</p>
                    <p className="text-2xl font-bold text-red-600">{enhancedSummary.exitedUsers}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <div className="flex items-center">
                  <CheckCircle className="h-8 w-8 text-yellow-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Flagged Accounts</p>
                    <p className="text-2xl font-bold text-yellow-600">{enhancedSummary.flaggedAccounts}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <div className="flex items-center">
                  <AlertTriangle className="h-8 w-8 text-orange-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Non-Org Users</p>
                    <p className="text-2xl font-bold text-orange-600">{enhancedSummary.nonOrgUsers}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6">
                {/* Tool Selection and Email Input */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  {/* Tool Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Tool
                    </label>
                    <select
                      value={selectedTool}
                      onChange={(e) => setSelectedTool(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    >
                      <option value="">Choose a tool...</option>
                      <option value="all">All Tools</option>
                      <optgroup label="Available Tools">
                        {tools.filter(tool => tool.isActive && (tool.hasApiSupport ? tool.connectionStatus === 'connected' : true)).map(tool => (
                          <option key={tool.id} value={tool.name}>{tool.name}</option>
                        ))}
                      </optgroup>
                    </select>
                    <button
                      onClick={() => setIsAddToolModalOpen(true)}
                      className="mt-2 w-full bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-md font-medium flex items-center justify-center space-x-2 transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Add New Tool</span>
                    </button>
                  </div>

                  {/* Exit Employee Emails */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Exit Employee Emails
                    </label>
                    <div className="space-y-2">
                      <textarea
                        value={exitEmails}
                        onChange={(e) => setExitEmails(e.target.value)}
                        placeholder="Enter emails separated by commas (e.g., john@company.com, jane@company.com)"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        rows={3}
                      />
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500">Or upload CSV:</span>
                        <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-md text-sm font-medium text-gray-700 flex items-center space-x-1 transition-colors">
                          <Upload className="h-4 w-4" />
                          <span>Choose File</span>
                          <input
                            type="file"
                            accept=".csv"
                            onChange={handleFileUpload}
                            className="hidden"
                          />
                        </label>
                        {csvFile && (
                          <span className="text-sm text-green-600">{csvFile.name}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Start Review Button */}
                <div className="mb-6">
                  <button
                    onClick={handleStartReview}
                    disabled={isLoading}
                    className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-md font-medium flex items-center space-x-2 transition-colors"
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Scanning Access Data...</span>
                      </>
                    ) : (
                      <>
                        <Search className="h-4 w-4" />
                        <span>Start Access Review</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Results Table */}
                {userAccessData.length > 0 && (
                  <div className="space-y-4">
                    {/* Search and Filter Controls */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 p-4 bg-gray-50 rounded-lg">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Search Email</label>
                        <input
                          type="text"
                          value={searchEmail}
                          onChange={(e) => setSearchEmail(e.target.value)}
                          placeholder="Search by email..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Tool</label>
                        <select
                          value={filterTool}
                          onChange={(e) => setFilterTool(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        >
                          <option value="">All Tools</option>
                          {Array.from(new Set(userAccessData.map(user => user.tool))).map(tool => (
                            <option key={tool} value={tool}>{tool}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Role</label>
                        <select
                          value={filterRole}
                          onChange={(e) => setFilterRole(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        >
                          <option value="">All Roles</option>
                          {Array.from(new Set(userAccessData.map(user => user.role))).map(role => (
                            <option key={role} value={role}>{role}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Status</label>
                        <select
                          value={filterStatus}
                          onChange={(e) => setFilterStatus(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        >
                          <option value="">All Status</option>
                          <option value="ACTIVE">Active</option>
                          <option value="EXITED">Exited</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Download Filter</label>
                        <div className="flex items-center space-x-2 mt-2">
                          <input
                            type="checkbox"
                            id="downloadFlagged"
                            checked={downloadOnlyFlagged}
                            onChange={(e) => setDownloadOnlyFlagged(e.target.checked)}
                            className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                          />
                          <label htmlFor="downloadFlagged" className="text-sm text-gray-700">
                            Only flagged users
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-medium text-gray-900">Access Review Results</h3>
                      <div className="flex space-x-2">
                        {selectedTool && selectedTool !== 'all' && (
                          <button
                            onClick={() => handleBulkUserManagement(selectedTool)}
                            className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-md font-medium flex items-center space-x-2 transition-colors"
                          >
                            <Users className="h-4 w-4" />
                            <span>Bulk Manage</span>
                          </button>
                        )}
                        <button
                          onClick={handleSendEmail}
                          disabled={selectedUsers.length === 0 || isLoading}
                          className="bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-md font-medium flex items-center space-x-2 transition-colors"
                        >
                          <Mail className="h-4 w-4" />
                          <span>Send Email ({selectedUsers.length})</span>
                        </button>
                        <button
                          onClick={handleDownloadCSV}
                          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md font-medium flex items-center space-x-2 transition-colors"
                        >
                          <Download className="h-4 w-4" />
                          <span>Download CSV</span>
                        </button>
                        <button
                          onClick={handleDownloadExcel}
                          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium flex items-center space-x-2 transition-colors"
                        >
                          <Download className="h-4 w-4" />
                          <span>Download Excel</span>
                        </button>
                        <button
                          onClick={handleRemoveUsers}
                          disabled={selectedUsers.length === 0 || isLoading}
                          className="bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-md font-medium flex items-center space-x-2 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span>Remove Selected ({selectedUsers.length})</span>
                        </button>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left">
                              <input
                                type="checkbox"
                                checked={selectedUsers.length === filteredUserData.length && filteredUserData.length > 0}
                                onChange={handleSelectAll}
                                className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                              />
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Tool
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              User Email
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Role/Privilege
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Non-Org Email
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Last Login
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Permissions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {filteredUserData.map((user) => (
                            <tr key={user.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <input
                                  type="checkbox"
                                  checked={selectedUsers.includes(user.id)}
                                  onChange={() => handleUserSelection(user.id)}
                                  className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                                />
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {user.tool}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <span className={isOrgEmail(user.email) ? 'text-gray-900' : 'text-red-600 font-medium'}>
                                  {user.email}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {user.role}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  user.status === 'ACTIVE' 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {user.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-center">
                                {isOrgEmail(user.email) ? (
                                  <span className="text-green-600 text-lg">✅</span>
                                ) : (
                                  <span className="text-red-600 text-lg">❌</span>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {user.lastLogin || 'N/A'}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                                <div className="truncate">
                                  {user.permissions?.join(', ') || 'N/A'}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {activeTab === 'tools' && (
          <ToolManagement
            tools={tools}
            onAddTool={handleAddTool}
            onUpdateTool={handleUpdateTool}
            onDeleteTool={handleDeleteTool}
          />
        )}

        {activeTab === 'users' && (
          <UserManagement tools={tools} />
        )}

        {activeTab === 'history' && (
          <HistoryView records={historyRecords} />
        )}

        {activeTab === 'policies' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Policy Management</h2>
              <p className="text-gray-600 mt-1">Manage access policies and view violations</p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Active Policies</h3>
                <div className="space-y-3">
                  {policyService.getActivePolicies().map(policy => (
                    <div key={policy.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">{policy.name}</h4>
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                          Active
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{policy.description}</p>
                      <div className="text-xs text-gray-500">
                        {policy.rules.length} rules • Priority: {policy.priority}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Violations</h3>
                <div className="space-y-3">
                  {policyService.getViolations().slice(0, 5).map(violation => (
                    <div key={violation.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">{violation.policyName}</h4>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          violation.severity === 'CRITICAL' ? 'bg-red-100 text-red-800' :
                          violation.severity === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                          violation.severity === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {violation.severity}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{violation.description}</p>
                      <div className="text-xs text-gray-500">
                        {violation.userEmail} • {new Date(violation.detectedAt).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-2 md:space-y-0">
            <div className="text-center md:text-left">
                        <p className="text-sm text-gray-500">Powered by Sparrow IT • Sparrow Vision</p>
            </div>
            <div className="text-center md:text-right">
              <p className="text-sm text-gray-500">Reach to It-admin@surveysparrow.com</p>
            </div>
          </div>
        </div>
      </footer>
      
      {/* Add Tool Modal */}
      <AddToolModal
        isOpen={isAddToolModalOpen}
        onClose={() => setIsAddToolModalOpen(false)}
        onAddTool={handleAddNewTool}
      />

      {/* Bulk User Management Modal */}
      {bulkManagementOpen && (
        <BulkUserManagement
          users={bulkManagementUsers}
          toolName={selectedToolForBulk}
          onBulkAction={handleBulkAction}
          onClose={() => {
            setBulkManagementOpen(false);
            setBulkManagementUsers([]);
            setSelectedToolForBulk('');
          }}
        />
      )}
    </div>
    </AccessControlGate>
  );
}

export default App;