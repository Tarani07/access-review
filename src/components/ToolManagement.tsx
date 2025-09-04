import React, { useState, useMemo } from 'react';
import { Plus, Trash2, Edit2, Save, X, Key, Eye, EyeOff, TestTube, CheckCircle, AlertCircle, Upload, Download, Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';

interface Tool {
  id: string;
  name: string;
  category: string;
  isActive: boolean;
  hasApiSupport: boolean;
  apiKey?: string;
  apiEndpoint?: string;
  lastSync?: string;
  connectionStatus?: 'connected' | 'disconnected' | 'testing';
  userListFile?: File;
  exitUsersFile?: File;
}

interface ToolManagementProps {
  tools: Tool[];
  onAddTool: (tool: Omit<Tool, 'id'>) => void;
  onUpdateTool: (id: string, tool: Partial<Tool>) => void;
  onDeleteTool: (id: string) => void;
}

export default function ToolManagement({ tools, onAddTool, onUpdateTool, onDeleteTool }: ToolManagementProps) {
  const [isAddingTool, setIsAddingTool] = useState(false);
  const [editingTool, setEditingTool] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedIntegrationType, setSelectedIntegrationType] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [viewMode, setViewMode] = useState<'paginated' | 'all'>('paginated');
  
  const [newTool, setNewTool] = useState({ 
    name: '', 
    category: '', 
    isActive: true, 
    hasApiSupport: true,
    apiKey: '', 
    apiEndpoint: '',
    connectionStatus: 'disconnected' as const
  });
  const [editTool, setEditTool] = useState({ 
    name: '', 
    category: '', 
    isActive: true, 
    hasApiSupport: true,
    apiKey: '', 
    apiEndpoint: '',
    connectionStatus: 'disconnected' as const
  });
  const [showApiKeys, setShowApiKeys] = useState<{ [key: string]: boolean }>({});
  const [testingConnection, setTestingConnection] = useState<string | null>(null);

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

  const predefinedTools = [
    // Communication
    { name: 'Slack', category: 'Communication', hasApiSupport: true, apiEndpoint: 'https://slack.com/api' },
    { name: 'Zoom', category: 'Communication', hasApiSupport: true, apiEndpoint: 'https://api.zoom.us/v2' },
    { name: 'Ringcentral', category: 'Communication', hasApiSupport: true, apiEndpoint: 'https://platform.ringcentral.com' },
    { name: 'Twilio', category: 'Communication', hasApiSupport: true, apiEndpoint: 'https://api.twilio.com' },
    { name: 'Twilio - Staging', category: 'Communication', hasApiSupport: true, apiEndpoint: 'https://api.twilio.com' },
    
    // Development
    { name: 'Github Copilot', category: 'Development', hasApiSupport: true, apiEndpoint: 'https://api.github.com' },
    { name: 'Bitbucket', category: 'Development', hasApiSupport: true, apiEndpoint: 'https://api.bitbucket.org/2.0' },
    { name: 'NPM', category: 'Development', hasApiSupport: true, apiEndpoint: 'https://registry.npmjs.org' },
    { name: 'v0.dev', category: 'Development', hasApiSupport: false },
    
    // Design
    { name: 'Figma', category: 'Design', hasApiSupport: true, apiEndpoint: 'https://api.figma.com/v1' },
    { name: 'Creative Cloud', category: 'Design', hasApiSupport: false },
    { name: 'Canva', category: 'Design', hasApiSupport: true, apiEndpoint: 'https://api.canva.com/rest/v1' },
    
    // Cloud Services
    { name: 'AWS', category: 'Cloud Services', hasApiSupport: true, apiEndpoint: 'https://iam.amazonaws.com' },
    { name: 'Office 365', category: 'Cloud Services', hasApiSupport: true, apiEndpoint: 'https://graph.microsoft.com/v1.0' },
    { name: 'Gsuite', category: 'Cloud Services', hasApiSupport: true, apiEndpoint: 'https://admin.googleapis.com' },
    
    // Project Management
    { name: 'Altassian', category: 'Project Management', hasApiSupport: true, apiEndpoint: 'https://api.atlassian.com' },
    
    // Monitoring
    { name: 'Newrelic', category: 'Monitoring', hasApiSupport: true, apiEndpoint: 'https://api.newrelic.com/v2' },
    { name: 'Newrelic Staging', category: 'Monitoring', hasApiSupport: true, apiEndpoint: 'https://api.newrelic.com/v2' },
    { name: 'Sentry', category: 'Monitoring', hasApiSupport: true, apiEndpoint: 'https://sentry.io/api/0' },
    { name: 'Logzio', category: 'Monitoring', hasApiSupport: true, apiEndpoint: 'https://api.logz.io/v1' },
    { name: 'Logzio Staging', category: 'Monitoring', hasApiSupport: true, apiEndpoint: 'https://api.logz.io/v1' },
    
    // IT Management
    { name: 'SnipeIT', category: 'IT Management', hasApiSupport: true, apiEndpoint: 'https://snipe-it.surveysparrow.com/api/v1' },
    { name: 'Hexnode', category: 'IT Management', hasApiSupport: true, apiEndpoint: 'https://api.hexnode.com' },
    { name: 'Endpoint Central', category: 'IT Management', hasApiSupport: true, apiEndpoint: 'https://api.manageengine.com' },
    { name: 'Jumpcloud', category: 'IT Management', hasApiSupport: true, apiEndpoint: 'https://console.jumpcloud.com/api' },
    
    // Security
    { name: 'Heimdal Security', category: 'Security', hasApiSupport: true, apiEndpoint: 'https://api.heimdalsecurity.com' },
    { name: 'CCTV - Kochi', category: 'Physical Security', hasApiSupport: false },
    { name: 'Biometric - Kochi', category: 'Physical Security', hasApiSupport: false },
    { name: 'CCTV - Chennai', category: 'Physical Security', hasApiSupport: false },
    { name: 'Biometric - Chennai', category: 'Physical Security', hasApiSupport: false },
    
    // HR & Recruitment
    { name: 'Greythr', category: 'HR & Recruitment', hasApiSupport: true, apiEndpoint: 'https://api.greythr.com' },
    { name: 'Springverify', category: 'HR & Recruitment', hasApiSupport: true, apiEndpoint: 'https://api.springverify.com' },
    { name: 'Zappyhire', category: 'HR & Recruitment', hasApiSupport: true, apiEndpoint: 'https://api.zappyhire.com' },
    { name: 'Keka', category: 'HR & Recruitment', hasApiSupport: true, apiEndpoint: 'https://api.keka.com' },
    
    // Finance & Accounting
    { name: 'Quickbooks', category: 'Finance & Accounting', hasApiSupport: true, apiEndpoint: 'https://sandbox-quickbooks.api.intuit.com' },
    { name: 'Stripe', category: 'Finance & Accounting', hasApiSupport: true, apiEndpoint: 'https://api.stripe.com/v1' },
    
    // Marketing & Sales
    { name: 'Hubspot', category: 'Marketing & Sales', hasApiSupport: true, apiEndpoint: 'https://api.hubapi.com' },
    { name: 'Outplay', category: 'Marketing & Sales', hasApiSupport: true, apiEndpoint: 'https://api.outplayhq.com' },
    { name: 'Apollo', category: 'Marketing & Sales', hasApiSupport: true, apiEndpoint: 'https://api.apollo.io/v1' },
    { name: 'Linkedin Sales Navigator', category: 'Marketing & Sales', hasApiSupport: false },
    { name: 'Zendesk', category: 'Marketing & Sales', hasApiSupport: true, apiEndpoint: 'https://api.zendesk.com/api/v2' },
    { name: 'Sendgrid Production', category: 'Marketing & Sales', hasApiSupport: true, apiEndpoint: 'https://api.sendgrid.com/v3' },
    { name: 'Sendgrid', category: 'Marketing & Sales', hasApiSupport: true, apiEndpoint: 'https://api.sendgrid.com/v3' },
    { name: 'Sendgrid Staging', category: 'Marketing & Sales', hasApiSupport: true, apiEndpoint: 'https://api.sendgrid.com/v3' },
    { name: 'Brevo', category: 'Marketing & Sales', hasApiSupport: true, apiEndpoint: 'https://api.brevo.com/v3' },
    
    // Analytics
    { name: 'Analytics', category: 'Analytics', hasApiSupport: true, apiEndpoint: 'https://analyticsreporting.googleapis.com/v4' },
    { name: 'Google search console', category: 'Analytics', hasApiSupport: true, apiEndpoint: 'https://searchconsole.googleapis.com/v1' },
    { name: 'Ahref', category: 'Analytics', hasApiSupport: true, apiEndpoint: 'https://apiv2.ahrefs.com' },
    
    // AI & Productivity
    { name: 'ChatGPT', category: 'AI & Productivity', hasApiSupport: true, apiEndpoint: 'https://api.openai.com/v1' },
    { name: 'Cursor Pro', category: 'AI & Productivity', hasApiSupport: false },
    { name: 'Anthropic', category: 'AI & Productivity', hasApiSupport: true, apiEndpoint: 'https://api.anthropic.com' },
    { name: 'Grammarly', category: 'AI & Productivity', hasApiSupport: false },
    
    // Other
    { name: 'Dropbox Sign', category: 'Other', hasApiSupport: true, apiEndpoint: 'https://api.hellosign.com/v3' },
    { name: 'Area51', category: 'Other', hasApiSupport: false },
    { name: 'Entries.ai', category: 'Other', hasApiSupport: true, apiEndpoint: 'https://api.entries.ai' },
    { name: 'Flex', category: 'Other', hasApiSupport: false },
  ];

  // Filter and search logic
  const filteredTools = useMemo(() => {
    return tools.filter(tool => {
      const matchesSearch = tool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           tool.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === '' || tool.category === selectedCategory;
      const matchesStatus = selectedStatus === '' || 
                           (selectedStatus === 'active' && tool.isActive) ||
                           (selectedStatus === 'inactive' && !tool.isActive) ||
                           (selectedStatus === 'connected' && tool.connectionStatus === 'connected') ||
                           (selectedStatus === 'disconnected' && tool.connectionStatus === 'disconnected');
      const matchesIntegrationType = selectedIntegrationType === '' ||
                                   (selectedIntegrationType === 'api' && tool.hasApiSupport) ||
                                   (selectedIntegrationType === 'csv' && !tool.hasApiSupport);
      
      return matchesSearch && matchesCategory && matchesStatus && matchesIntegrationType;
    });
  }, [tools, searchTerm, selectedCategory, selectedStatus, selectedIntegrationType]);

  // Pagination logic
  const totalPages = Math.ceil(filteredTools.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentTools = viewMode === 'paginated' ? filteredTools.slice(startIndex, endIndex) : filteredTools;

  // Reset to first page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, selectedStatus, selectedIntegrationType, itemsPerPage]);

  const handleAddTool = () => {
    if (newTool.name && newTool.category) {
      onAddTool(newTool);
      setNewTool({ 
        name: '', 
        category: '', 
        isActive: true, 
        hasApiSupport: true,
        apiKey: '', 
        apiEndpoint: '',
        connectionStatus: 'disconnected'
      });
      setIsAddingTool(false);
    }
  };

  const handleAddPredefinedTool = (predefinedTool: any) => {
    const toolToAdd = {
      ...predefinedTool,
      isActive: true,
      connectionStatus: 'disconnected' as const,
      apiKey: ''
    };
    onAddTool(toolToAdd);
  };

  const handleEditTool = (tool: Tool) => {
    setEditingTool(tool.id);
    setEditTool({ 
      name: tool.name, 
      category: tool.category, 
      isActive: tool.isActive,
      hasApiSupport: tool.hasApiSupport,
      apiKey: tool.apiKey || '',
      apiEndpoint: tool.apiEndpoint || '',
      connectionStatus: tool.connectionStatus || 'disconnected'
    });
  };

  const handleSaveEdit = () => {
    if (editingTool && editTool.name && editTool.category) {
      onUpdateTool(editingTool, editTool);
      setEditingTool(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingTool(null);
    setEditTool({ 
      name: '', 
      category: '', 
      isActive: true, 
      hasApiSupport: true,
      apiKey: '', 
      apiEndpoint: '',
      connectionStatus: 'disconnected'
    });
  };

  const toggleApiKeyVisibility = (toolId: string) => {
    setShowApiKeys(prev => ({
      ...prev,
      [toolId]: !prev[toolId]
    }));
  };

  const handleTestConnection = async (toolId: string) => {
    setTestingConnection(toolId);
    
    // Simulate API connection test
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Randomly simulate success/failure for demo
    const isSuccess = Math.random() > 0.3;
    const status = isSuccess ? 'connected' : 'disconnected';
    
    onUpdateTool(toolId, { 
      connectionStatus: status,
      lastSync: isSuccess ? new Date().toISOString() : undefined
    });
    
    setTestingConnection(null);
  };

  const handleFileUpload = (toolId: string, fileType: 'userList' | 'exitUsers', file: File) => {
    onUpdateTool(toolId, {
      [fileType === 'userList' ? 'userListFile' : 'exitUsersFile']: file
    });
  };

  const getConnectionStatusIcon = (status?: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'testing':
        return <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>;
      case 'disconnected':
      default:
        return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getConnectionStatusText = (status?: string) => {
    switch (status) {
      case 'connected':
        return 'Connected';
      case 'testing':
        return 'Testing...';
      case 'disconnected':
      default:
        return 'Disconnected';
    }
  };

  const availablePredefinedTools = predefinedTools.filter(
    predefined => !tools.some(tool => tool.name === predefined.name)
  );

  const handleBulkAddTools = () => {
    availablePredefinedTools.forEach(tool => {
      handleAddPredefinedTool(tool);
    });
  };

  const exportToolsData = () => {
    const csv = [
      ['Tool Name', 'Category', 'Status', 'API Support', 'Connection Status', 'Last Sync'],
      ...filteredTools.map(tool => [
        tool.name,
        tool.category,
        tool.isActive ? 'Active' : 'Inactive',
        tool.hasApiSupport ? 'Yes' : 'No',
        tool.connectionStatus || 'Not Set',
        tool.lastSync ? new Date(tool.lastSync).toLocaleDateString() : 'Never'
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'surveysparrow_tools_export.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-6 space-y-4 lg:space-y-0">
        <div>
          <h3 className="text-lg font-medium text-gray-900">SurveySparrow Tools Management</h3>
          <p className="text-sm text-gray-500 mt-1">
            Manage {tools.length} tools with API integration and CSV upload support
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={exportToolsData}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md font-medium flex items-center space-x-2 transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>Export</span>
          </button>
          <button
            onClick={() => setIsAddingTool(true)}
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-md font-medium flex items-center space-x-2 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Add Custom Tool</span>
          </button>
          {availablePredefinedTools.length > 0 && (
            <button
              onClick={handleBulkAddTools}
              className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-md font-medium flex items-center space-x-2 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Add All ({availablePredefinedTools.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* Filters and Search */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Search Tools</label>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name or category..."
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          >
            <option value="">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="connected">Connected</option>
            <option value="disconnected">Disconnected</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Integration Type</label>
          <select
            value={selectedIntegrationType}
            onChange={(e) => setSelectedIntegrationType(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          >
            <option value="">All Types</option>
            <option value="api">API Integration</option>
            <option value="csv">CSV Upload Only</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">View Mode</label>
          <select
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value as 'paginated' | 'all')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          >
            <option value="paginated">Paginated</option>
            <option value="all">Show All</option>
          </select>
        </div>

        {viewMode === 'paginated' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Per Page</label>
            <select
              value={itemsPerPage}
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        )}
      </div>

      {/* Results Summary */}
      <div className="flex justify-between items-center mb-4">
        <div className="text-sm text-gray-600">
          <Filter className="h-4 w-4 inline mr-1" />
          Showing {currentTools.length} of {filteredTools.length} tools
          {viewMode === 'paginated' && ` (Page ${currentPage} of ${totalPages})`}
        </div>
        
        {viewMode === 'paginated' && totalPages > 1 && (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="p-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            
            <span className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
            
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="p-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Add New Tool Form */}
      {isAddingTool && (
        <div className="mb-6 p-6 bg-gray-50 rounded-lg border border-gray-200">
          <h4 className="text-md font-medium text-gray-900 mb-4">Add Custom Tool</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tool Name *</label>
              <input
                type="text"
                value={newTool.name}
                onChange={(e) => setNewTool({ ...newTool, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="e.g., Custom Tool"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
              <select
                value={newTool.category}
                onChange={(e) => setNewTool({ ...newTool, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                <option value="">Select category...</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <input
                  type="checkbox"
                  id="hasApiSupport"
                  checked={newTool.hasApiSupport}
                  onChange={(e) => setNewTool({ ...newTool, hasApiSupport: e.target.checked })}
                  className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="hasApiSupport" className="text-sm text-gray-700">
                  This tool supports API integration
                </label>
              </div>
            </div>
            {newTool.hasApiSupport && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">API Endpoint</label>
                  <input
                    type="url"
                    value={newTool.apiEndpoint}
                    onChange={(e) => setNewTool({ ...newTool, apiEndpoint: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="https://api.example.com/v1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
                  <div className="relative">
                    <input
                      type="password"
                      value={newTool.apiKey}
                      onChange={(e) => setNewTool({ ...newTool, apiKey: e.target.value })}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      placeholder="Enter API key or token"
                    />
                    <Key className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
                  </div>
                </div>
              </>
            )}
          </div>
          <div className="flex items-center space-x-2 mb-4">
            <input
              type="checkbox"
              id="newToolActive"
              checked={newTool.isActive}
              onChange={(e) => setNewTool({ ...newTool, isActive: e.target.checked })}
              className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
            />
            <label htmlFor="newToolActive" className="text-sm text-gray-700">
              Activate tool immediately
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleAddTool}
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-md font-medium flex items-center space-x-1 transition-colors"
            >
              <Save className="h-4 w-4" />
              <span>Save Tool</span>
            </button>
            <button
              onClick={() => setIsAddingTool(false)}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md font-medium flex items-center space-x-1 transition-colors"
            >
              <X className="h-4 w-4" />
              <span>Cancel</span>
            </button>
          </div>
        </div>
      )}

      {/* Tools Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tool Details</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Integration Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">API Configuration</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CSV Upload</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentTools.map((tool) => (
              <tr key={tool.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="space-y-1">
                    {editingTool === tool.id ? (
                      <>
                        <input
                          type="text"
                          value={editTool.name}
                          onChange={(e) => setEditTool({ ...editTool, name: e.target.value })}
                          className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                        />
                        <select
                          value={editTool.category}
                          onChange={(e) => setEditTool({ ...editTool, category: e.target.value })}
                          className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500 text-sm"
                        >
                          {categories.map(category => (
                            <option key={category} value={category}>{category}</option>
                          ))}
                        </select>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-900">{tool.name}</span>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            tool.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {tool.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">{tool.category}</span>
                      </>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-2">
                    {tool.hasApiSupport ? (
                      <>
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="text-sm text-blue-700 font-medium">API Integration</span>
                      </>
                    ) : (
                      <>
                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                        <span className="text-sm text-orange-700 font-medium">CSV Upload Only</span>
                      </>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  {tool.hasApiSupport ? (
                    <div className="space-y-2">
                      {editingTool === tool.id ? (
                        <>
                          <input
                            type="url"
                            value={editTool.apiEndpoint}
                            onChange={(e) => setEditTool({ ...editTool, apiEndpoint: e.target.value })}
                            className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500 text-sm"
                            placeholder="API Endpoint"
                          />
                          <input
                            type="password"
                            value={editTool.apiKey}
                            onChange={(e) => setEditTool({ ...editTool, apiKey: e.target.value })}
                            className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500 text-sm"
                            placeholder="API Key"
                          />
                        </>
                      ) : (
                        <>
                          <div className="text-xs text-gray-600 truncate max-w-xs">
                            {tool.apiEndpoint || 'No endpoint configured'}
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-gray-600">
                              {tool.apiKey ? '••••••••••••' : 'No API key'}
                            </span>
                            {tool.apiKey && (
                              <button
                                onClick={() => toggleApiKeyVisibility(tool.id)}
                                className="text-gray-400 hover:text-gray-600"
                              >
                                {showApiKeys[tool.id] ? (
                                  <EyeOff className="h-3 w-3" />
                                ) : (
                                  <Eye className="h-3 w-3" />
                                )}
                              </button>
                            )}
                          </div>
                          {showApiKeys[tool.id] && tool.apiKey && (
                            <div className="text-xs font-mono bg-gray-100 p-2 rounded border break-all">
                              {tool.apiKey}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-gray-500">API not supported</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="space-y-2">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">User List CSV</label>
                      <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded text-xs flex items-center space-x-1 transition-colors">
                        <Upload className="h-3 w-3" />
                        <span>Upload</span>
                        <input
                          type="file"
                          accept=".csv"
                          onChange={(e) => e.target.files?.[0] && handleFileUpload(tool.id, 'userList', e.target.files[0])}
                          className="hidden"
                        />
                      </label>
                      {tool.userListFile && (
                        <span className="text-xs text-green-600 block mt-1">{tool.userListFile.name}</span>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Exit Users CSV</label>
                      <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded text-xs flex items-center space-x-1 transition-colors">
                        <Upload className="h-3 w-3" />
                        <span>Upload</span>
                        <input
                          type="file"
                          accept=".csv"
                          onChange={(e) => e.target.files?.[0] && handleFileUpload(tool.id, 'exitUsers', e.target.files[0])}
                          className="hidden"
                        />
                      </label>
                      {tool.exitUsersFile && (
                        <span className="text-xs text-green-600 block mt-1">{tool.exitUsersFile.name}</span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      {testingConnection === tool.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                      ) : (
                        getConnectionStatusIcon(tool.connectionStatus)
                      )}
                      <span className="text-xs text-gray-600">
                        {testingConnection === tool.id ? 'Testing...' : getConnectionStatusText(tool.connectionStatus)}
                      </span>
                    </div>
                    {tool.lastSync && (
                      <div className="text-xs text-gray-500">
                        Last sync: {new Date(tool.lastSync).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center space-x-2">
                    {editingTool === tool.id ? (
                      <>
                        <button
                          onClick={handleSaveEdit}
                          className="text-emerald-600 hover:text-emerald-900"
                          title="Save changes"
                        >
                          <Save className="h-4 w-4" />
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="text-gray-600 hover:text-gray-900"
                          title="Cancel editing"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        {tool.hasApiSupport && (
                          <button
                            onClick={() => handleTestConnection(tool.id)}
                            disabled={!tool.apiKey || testingConnection === tool.id}
                            className="text-blue-600 hover:text-blue-900 disabled:text-gray-400 disabled:cursor-not-allowed"
                            title="Test API connection"
                          >
                            <TestTube className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleEditTool(tool)}
                          className="text-indigo-600 hover:text-indigo-900"
                          title="Edit tool"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => onDeleteTool(tool.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete tool"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {viewMode === 'paginated' && totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            Showing {startIndex + 1} to {Math.min(endIndex, filteredTools.length)} of {filteredTools.length} tools
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 text-sm"
            >
              First
            </button>
            
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="p-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            
            <span className="px-3 py-1 text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
            
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="p-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 text-sm"
            >
              Last
            </button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredTools.length === 0 && (
        <div className="text-center py-8">
          <Key className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No tools found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || selectedCategory || selectedStatus 
              ? 'Try adjusting your filters or search terms.'
              : 'Get started by adding SurveySparrow tools with API access or CSV upload.'
            }
          </p>
          {(searchTerm || selectedCategory || selectedStatus) && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('');
                setSelectedStatus('');
                setSelectedIntegrationType('');
                setSelectedIntegrationType('');
              }}
              className="mt-2 text-emerald-600 hover:text-emerald-700 text-sm font-medium"
            >
              Clear all filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}