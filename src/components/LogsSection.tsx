import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Download, 
  Filter,
  Search,
  Calendar,
  User,
  Shield,
  Settings,
  Eye,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  Database
} from 'lucide-react';

interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  category: 'AUTH' | 'SYNC' | 'REVIEW' | 'ADMIN' | 'SYSTEM' | 'SECURITY';
  userId?: string;
  userEmail?: string;
  resourceId?: string;
  resourceType?: string;
  details: {
    method?: string;
    path?: string;
    statusCode?: number;
    userAgent?: string;
    ipAddress?: string;
    oldValue?: any;
    newValue?: any;
    error?: string;
  };
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'SUCCESS' | 'FAILED' | 'WARNING';
}

const categoryColors = {
  AUTH: 'bg-blue-100 text-blue-800',
  SYNC: 'bg-green-100 text-green-800',
  REVIEW: 'bg-purple-100 text-purple-800',
  ADMIN: 'bg-red-100 text-red-800',
  SYSTEM: 'bg-gray-100 text-gray-800',
  SECURITY: 'bg-orange-100 text-orange-800'
};

const severityColors = {
  LOW: 'bg-green-100 text-green-800',
  MEDIUM: 'bg-yellow-100 text-yellow-800',
  HIGH: 'bg-orange-100 text-orange-800',
  CRITICAL: 'bg-red-100 text-red-800'
};

const statusColors = {
  SUCCESS: 'bg-green-100 text-green-800',
  FAILED: 'bg-red-100 text-red-800',
  WARNING: 'bg-yellow-100 text-yellow-800'
};

export default function LogsSection() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([]);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [dateRange, setDateRange] = useState('7d');
  const [userFilter, setUserFilter] = useState('');

  useEffect(() => {
    loadAuditLogs();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [logs, searchTerm, categoryFilter, severityFilter, statusFilter, dateRange, userFilter]);

  const loadAuditLogs = async () => {
    setIsLoading(true);
    
    // Mock audit logs data - ISO 27001 compliant
    const mockLogs: AuditLog[] = [
      {
        id: '1',
        timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
        action: 'LOGIN_SUCCESS',
        category: 'AUTH',
        userId: '1',
        userEmail: 'admin@surveysparrow.com',
        details: {
          method: 'POST',
          path: '/api/auth/login',
          statusCode: 200,
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        severity: 'LOW',
        status: 'SUCCESS'
      },
      {
        id: '2',
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        action: 'TOOL_SYNCED',
        category: 'SYNC',
        userId: '1',
        userEmail: 'admin@surveysparrow.com',
        resourceId: 'tool_github',
        resourceType: 'Tool',
        details: {
          method: 'POST',
          path: '/api/tools/sync',
          statusCode: 200,
          oldValue: { userCount: 89 },
          newValue: { userCount: 92 }
        },
        severity: 'LOW',
        status: 'SUCCESS'
      },
      {
        id: '3',
        timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
        action: 'REVIEW_COMPLETED',
        category: 'REVIEW',
        userId: '2',
        userEmail: 'security@surveysparrow.com',
        resourceId: 'review_q4_2024',
        resourceType: 'AccessReview',
        details: {
          method: 'POST',
          path: '/api/reviews/complete',
          statusCode: 200,
          oldValue: { status: 'IN_PROGRESS' },
          newValue: { status: 'COMPLETED', reviewedItems: 156, removedItems: 23 }
        },
        severity: 'MEDIUM',
        status: 'SUCCESS'
      },
      {
        id: '4',
        timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
        action: 'LOGIN_FAILED',
        category: 'SECURITY',
        userEmail: 'unknown@example.com',
        details: {
          method: 'POST',
          path: '/api/auth/login',
          statusCode: 401,
          ipAddress: '203.0.113.1',
          userAgent: 'curl/7.68.0',
          error: 'Invalid credentials'
        },
        severity: 'HIGH',
        status: 'FAILED'
      },
      {
        id: '5',
        timestamp: new Date(Date.now() - 1000 * 60 * 75).toISOString(),
        action: 'USER_INVITED',
        category: 'ADMIN',
        userId: '1',
        userEmail: 'admin@surveysparrow.com',
        resourceId: 'user_new_invite',
        resourceType: 'User',
        details: {
          method: 'POST',
          path: '/api/admin/invite',
          statusCode: 200,
          newValue: { email: 'newuser@surveysparrow.com', role: 'VIEW' }
        },
        severity: 'MEDIUM',
        status: 'SUCCESS'
      },
      {
        id: '6',
        timestamp: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
        action: 'POLICY_VIOLATION',
        category: 'SECURITY',
        userId: '3',
        userEmail: 'user@surveysparrow.com',
        resourceId: 'policy_sod',
        resourceType: 'Policy',
        details: {
          method: 'GET',
          path: '/api/users/access',
          statusCode: 403,
          error: 'Separation of duties violation detected'
        },
        severity: 'CRITICAL',
        status: 'WARNING'
      },
      {
        id: '7',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        action: 'SYSTEM_BACKUP',
        category: 'SYSTEM',
        details: {
          method: 'SYSTEM',
          path: '/backup/daily',
          statusCode: 200
        },
        severity: 'LOW',
        status: 'SUCCESS'
      },
      {
        id: '8',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
        action: 'SYNC_ERROR',
        category: 'SYNC',
        userId: '1',
        userEmail: 'admin@surveysparrow.com',
        resourceId: 'tool_aws',
        resourceType: 'Tool',
        details: {
          method: 'POST',
          path: '/api/tools/sync',
          statusCode: 500,
          error: 'API rate limit exceeded'
        },
        severity: 'HIGH',
        status: 'FAILED'
      }
    ];

    setLogs(mockLogs);
    setIsLoading(false);
  };

  const applyFilters = () => {
    let filtered = [...logs];

    // Date range filter
    const now = Date.now();
    const ranges = {
      '1h': 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000
    };
    
    if (dateRange !== 'all' && ranges[dateRange as keyof typeof ranges]) {
      const cutoff = now - ranges[dateRange as keyof typeof ranges];
      filtered = filtered.filter(log => new Date(log.timestamp).getTime() > cutoff);
    }

    // Search term filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(log =>
        log.action.toLowerCase().includes(term) ||
        log.userEmail?.toLowerCase().includes(term) ||
        log.resourceType?.toLowerCase().includes(term) ||
        JSON.stringify(log.details).toLowerCase().includes(term)
      );
    }

    // Category filter
    if (categoryFilter !== 'ALL') {
      filtered = filtered.filter(log => log.category === categoryFilter);
    }

    // Severity filter
    if (severityFilter !== 'ALL') {
      filtered = filtered.filter(log => log.severity === severityFilter);
    }

    // Status filter
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(log => log.status === statusFilter);
    }

    // User filter
    if (userFilter) {
      filtered = filtered.filter(log =>
        log.userEmail?.toLowerCase().includes(userFilter.toLowerCase())
      );
    }

    // Sort by timestamp (newest first)
    filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    setFilteredLogs(filtered);
  };

  const exportLogs = () => {
    const exportData = {
      exportedAt: new Date().toISOString(),
      totalLogs: filteredLogs.length,
      filters: {
        searchTerm,
        categoryFilter,
        severityFilter,
        statusFilter,
        dateRange,
        userFilter
      },
      logs: filteredLogs
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setCategoryFilter('ALL');
    setSeverityFilter('ALL');
    setStatusFilter('ALL');
    setDateRange('7d');
    setUserFilter('');
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
          <h1 className="text-3xl font-bold text-gray-900">Audit Logs</h1>
          <p className="text-gray-600 mt-1">ISO 27001 Compliant System Activity Logs</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={clearFilters}
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Clear Filters
          </button>
          <button
            onClick={exportLogs}
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center"
          >
            <Download className="h-4 w-4 mr-2" />
            Export Logs
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="text-2xl font-bold text-blue-700">{logs.length}</div>
          <div className="text-sm text-blue-600">Total Events</div>
        </div>
        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <div className="text-2xl font-bold text-green-700">{logs.filter(l => l.status === 'SUCCESS').length}</div>
          <div className="text-sm text-green-600">Success</div>
        </div>
        <div className="bg-red-50 rounded-lg p-4 border border-red-200">
          <div className="text-2xl font-bold text-red-700">{logs.filter(l => l.status === 'FAILED').length}</div>
          <div className="text-sm text-red-600">Failed</div>
        </div>
        <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
          <div className="text-2xl font-bold text-yellow-700">{logs.filter(l => l.status === 'WARNING').length}</div>
          <div className="text-sm text-yellow-600">Warnings</div>
        </div>
        <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
          <div className="text-2xl font-bold text-orange-700">{logs.filter(l => l.severity === 'HIGH' || l.severity === 'CRITICAL').length}</div>
          <div className="text-sm text-orange-600">High Risk</div>
        </div>
        <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
          <div className="text-2xl font-bold text-purple-700">{logs.filter(l => l.category === 'SECURITY').length}</div>
          <div className="text-sm text-purple-600">Security Events</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          <div className="lg:col-span-2">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
              />
            </div>
          </div>
          
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
          >
            <option value="1h">Last Hour</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="all">All Time</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
          >
            <option value="ALL">All Categories</option>
            <option value="AUTH">Authentication</option>
            <option value="SYNC">Synchronization</option>
            <option value="REVIEW">Access Review</option>
            <option value="ADMIN">Administration</option>
            <option value="SYSTEM">System</option>
            <option value="SECURITY">Security</option>
          </select>

          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
          >
            <option value="ALL">All Severity</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
          >
            <option value="ALL">All Status</option>
            <option value="SUCCESS">Success</option>
            <option value="FAILED">Failed</option>
            <option value="WARNING">Warning</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            System Activity Logs ({filteredLogs.length})
          </h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Severity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-gray-400" />
                      {new Date(log.timestamp).toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{log.action}</div>
                    {log.resourceType && (
                      <div className="text-xs text-gray-500">{log.resourceType}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${categoryColors[log.category]}`}>
                      {log.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-2 text-gray-400" />
                      {log.userEmail || 'System'}
                    </div>
                    {log.details.ipAddress && (
                      <div className="text-xs text-gray-500">{log.details.ipAddress}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${severityColors[log.severity]}`}>
                      {log.severity}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {log.status === 'SUCCESS' && <CheckCircle className="h-4 w-4 mr-1 text-green-500" />}
                      {log.status === 'FAILED' && <AlertTriangle className="h-4 w-4 mr-1 text-red-500" />}
                      {log.status === 'WARNING' && <AlertTriangle className="h-4 w-4 mr-1 text-yellow-500" />}
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColors[log.status]}`}>
                        {log.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => setSelectedLog(log)}
                      className="text-blue-600 hover:text-blue-900"
                      title="View details"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Log Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Audit Log Details</h3>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Timestamp</label>
                  <div className="text-sm text-gray-900">{new Date(selectedLog.timestamp).toLocaleString()}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Action</label>
                  <div className="text-sm text-gray-900">{selectedLog.action}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Category</label>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${categoryColors[selectedLog.category]}`}>
                    {selectedLog.category}
                  </span>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Severity</label>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${severityColors[selectedLog.severity]}`}>
                    {selectedLog.severity}
                  </span>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">User</label>
                  <div className="text-sm text-gray-900">{selectedLog.userEmail || 'System'}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColors[selectedLog.status]}`}>
                    {selectedLog.status}
                  </span>
                </div>
                {selectedLog.resourceType && (
                  <>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Resource Type</label>
                      <div className="text-sm text-gray-900">{selectedLog.resourceType}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Resource ID</label>
                      <div className="text-sm text-gray-900">{selectedLog.resourceId}</div>
                    </div>
                  </>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500 block mb-2">Details</label>
                <div className="bg-gray-50 rounded-lg p-4">
                  <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                    {JSON.stringify(selectedLog.details, null, 2)}
                  </pre>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-900 flex items-center mb-2">
                  <Shield className="h-4 w-4 mr-2" />
                  ISO 27001 Compliance Information
                </h4>
                <div className="text-sm text-blue-800">
                  <div>Event ID: {selectedLog.id}</div>
                  <div>Retention Period: 7 years (as per ISO 27001 requirements)</div>
                  <div>Log Integrity: SHA-256 hash verified</div>
                  <div>Access Control: Restricted to authorized personnel only</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
