import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  UserPlus, 
  Users, 
  Settings, 
  Mail, 
  Edit, 
  Trash2,
  CheckCircle,
  AlertCircle,
  Clock,
  Eye,
  Save,
  Send,
  MessageSquare,
  Webhook
} from 'lucide-react';

interface SparrowUser {
  id: string;
  email: string;
  name: string;
  role: 'VIEW' | 'EDIT' | 'LOGS' | 'INTEGRATION' | 'ADMIN';
  status: 'ACTIVE' | 'PENDING' | 'SUSPENDED';
  invitedBy: string;
  invitedAt: string;
  lastLogin?: string;
  permissions: string[];
}

interface SlackSettings {
  id: string;
  webhookUrl: string;
  isActive: boolean;
  testSentAt?: string;
  notifications: {
    accessReviewComplete: boolean;
    newToolSynced: boolean;
    userInvited: boolean;
    policyViolation: boolean;
  };
}

const rolePermissions = {
  VIEW: ['dashboard.read', 'tools.read', 'users.read', 'reports.read'],
  EDIT: ['dashboard.read', 'tools.*', 'users.*', 'reports.*', 'reviews.*'],
  LOGS: ['dashboard.read', 'logs.*', 'audit.*', 'reports.read'],
  INTEGRATION: ['dashboard.read', 'tools.*', 'sync.*', 'integrations.*'],
  ADMIN: ['*'] // Full access to everything
};

export default function AdminSection() {
  const [users, setUsers] = useState<SparrowUser[]>([]);
  const [slackSettings, setSlackSettings] = useState<SlackSettings | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showSlackModal, setShowSlackModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState<SparrowUser['role']>('VIEW');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    loadUsersAndSettings();
  }, []);

  const loadUsersAndSettings = async () => {
    // Mock users data
    const mockUsers: SparrowUser[] = [
      {
        id: '1',
        email: 'admin@surveysparrow.com',
        name: 'System Administrator',
        role: 'ADMIN',
        status: 'ACTIVE',
        invitedBy: 'system',
        invitedAt: '2023-01-01T00:00:00Z',
        lastLogin: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        permissions: rolePermissions.ADMIN
      },
      {
        id: '2',
        email: 'security@surveysparrow.com',
        name: 'Security Team',
        role: 'EDIT',
        status: 'ACTIVE',
        invitedBy: 'admin@surveysparrow.com',
        invitedAt: '2023-06-15T10:00:00Z',
        lastLogin: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        permissions: rolePermissions.EDIT
      },
      {
        id: '3',
        email: 'auditor@surveysparrow.com',
        name: 'Compliance Auditor',
        role: 'LOGS',
        status: 'ACTIVE',
        invitedBy: 'admin@surveysparrow.com',
        invitedAt: '2023-08-20T14:30:00Z',
        lastLogin: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
        permissions: rolePermissions.LOGS
      },
      {
        id: '4',
        email: 'integration@surveysparrow.com',
        name: 'Integration Specialist',
        role: 'INTEGRATION',
        status: 'PENDING',
        invitedBy: 'admin@surveysparrow.com',
        invitedAt: '2024-01-10T09:15:00Z',
        permissions: rolePermissions.INTEGRATION
      }
    ];

    // Mock Slack settings
    const mockSlackSettings: SlackSettings = {
      id: '1',
      webhookUrl: 'https://hooks.slack.com/services/YOUR_WORKSPACE/YOUR_CHANNEL/YOUR_TOKEN_HERE',
      isActive: true,
      testSentAt: '2024-01-14T16:20:00Z',
      notifications: {
        accessReviewComplete: true,
        newToolSynced: true,
        userInvited: false,
        policyViolation: true
      }
    };

    setUsers(mockUsers);
    setSlackSettings(mockSlackSettings);
    setWebhookUrl(mockSlackSettings.webhookUrl);
  };

  const handleInviteUser = async () => {
    const newUser: SparrowUser = {
      id: Date.now().toString(),
      email: inviteEmail,
      name: inviteName,
      role: inviteRole,
      status: 'PENDING',
      invitedBy: 'admin@surveysparrow.com',
      invitedAt: new Date().toISOString(),
      permissions: rolePermissions[inviteRole]
    };

    setUsers(prev => [...prev, newUser]);
    
    // Mock sending invitation email
    console.log('Sending invitation email to:', inviteEmail);
    
    // Mock Slack notification (if enabled)
    if (slackSettings?.notifications.userInvited) {
      console.log('Sending Slack notification: New user invited -', inviteEmail);
    }

    setShowInviteModal(false);
    setInviteEmail('');
    setInviteName('');
    setInviteRole('VIEW');
  };

  const handleUpdateUserRole = async (userId: string, newRole: SparrowUser['role']) => {
    setUsers(prev => prev.map(user =>
      user.id === userId
        ? { ...user, role: newRole, permissions: rolePermissions[newRole] }
        : user
    ));
  };

  const handleRemoveUser = async (userId: string) => {
    setUsers(prev => prev.filter(user => user.id !== userId));
  };

  const handleTestSlackWebhook = async () => {
    setIsTestingWebhook(true);
    
    try {
      // Mock webhook test
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const testMessage = {
        text: "🎉 SparrowVision Test Message",
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: "*SparrowVision Webhook Test*\n✅ Connection successful!\nTimestamp: " + new Date().toISOString()
            }
          }
        ]
      };

      // In real implementation, this would make an actual HTTP request
      console.log('Sending test message to Slack:', testMessage);
      
      setTestResult({ success: true, message: 'Test message sent successfully!' });
      
      if (slackSettings) {
        setSlackSettings({
          ...slackSettings,
          testSentAt: new Date().toISOString()
        });
      }
    } catch (error) {
      setTestResult({ success: false, message: 'Failed to send test message. Please check your webhook URL.' });
    } finally {
      setIsTestingWebhook(false);
    }
  };

  const handleSaveSlackSettings = async () => {
    if (!slackSettings) return;

    const updatedSettings = {
      ...slackSettings,
      webhookUrl: webhookUrl,
      isActive: Boolean(webhookUrl.trim())
    };

    setSlackSettings(updatedSettings);
    setShowSlackModal(false);
    console.log('Slack settings saved:', updatedSettings);
  };

  const getRoleColor = (role: SparrowUser['role']) => {
    switch (role) {
      case 'ADMIN': return 'bg-red-100 text-red-800';
      case 'EDIT': return 'bg-blue-100 text-blue-800';
      case 'LOGS': return 'bg-green-100 text-green-800';
      case 'INTEGRATION': return 'bg-purple-100 text-purple-800';
      case 'VIEW': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: SparrowUser['status']) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'SUSPENDED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">SparrowVision Admin</h1>
          <p className="text-gray-600 mt-1">Manage users, roles, and integrations</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowSlackModal(true)}
            className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center"
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Slack Settings
          </button>
          <button
            onClick={() => setShowInviteModal(true)}
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Invite User
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="text-2xl font-bold text-blue-700">{users.length}</div>
          <div className="text-sm text-blue-600">Total Users</div>
        </div>
        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <div className="text-2xl font-bold text-green-700">{users.filter(u => u.status === 'ACTIVE').length}</div>
          <div className="text-sm text-green-600">Active</div>
        </div>
        <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
          <div className="text-2xl font-bold text-yellow-700">{users.filter(u => u.status === 'PENDING').length}</div>
          <div className="text-sm text-yellow-600">Pending</div>
        </div>
        <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
          <div className="flex items-center">
            <div>
              <div className="text-2xl font-bold text-purple-700">
                {slackSettings?.isActive ? '✓' : '✗'}
              </div>
              <div className="text-sm text-purple-600">Slack Integration</div>
            </div>
          </div>
        </div>
      </div>

      {/* Users Management */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">User Management</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
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
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                        <Users className="h-5 w-5 text-gray-500" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                        <div className="text-xs text-gray-400">
                          Invited by {user.invitedBy} on {new Date(user.invitedAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.role)}`}>
                      {user.role}
                    </span>
                    <div className="text-xs text-gray-400 mt-1">
                      {user.permissions.length} permissions
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(user.status)}`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <select
                        value={user.role}
                        onChange={(e) => handleUpdateUserRole(user.id, e.target.value as SparrowUser['role'])}
                        className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="VIEW">View</option>
                        <option value="EDIT">Edit</option>
                        <option value="LOGS">Logs</option>
                        <option value="INTEGRATION">Integration</option>
                        <option value="ADMIN">Admin</option>
                      </select>
                      {user.role !== 'ADMIN' && (
                        <button
                          onClick={() => handleRemoveUser(user.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Remove user"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Role Permissions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <Shield className="h-5 w-5 mr-2 text-emerald-600" />
            Role Permissions
          </h2>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(rolePermissions).map(([role, permissions]) => (
              <div key={role} className="border border-gray-200 rounded-lg p-4">
                <h3 className={`font-medium text-sm rounded px-2 py-1 inline-block ${getRoleColor(role as SparrowUser['role'])}`}>
                  {role}
                </h3>
                <div className="mt-3 space-y-1">
                  {permissions.slice(0, 4).map((permission, index) => (
                    <div key={index} className="text-xs text-gray-600 flex items-center">
                      <CheckCircle className="h-3 w-3 mr-2 text-green-500" />
                      {permission}
                    </div>
                  ))}
                  {permissions.length > 4 && (
                    <div className="text-xs text-gray-400">
                      +{permissions.length - 4} more permissions
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Invite User Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Invite New User</h3>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                <input
                  type="text"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="john.doe@surveysparrow.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as SparrowUser['role'])}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="VIEW">View - Read-only access</option>
                  <option value="EDIT">Edit - Full access to tools and reviews</option>
                  <option value="LOGS">Logs - Audit logs and compliance</option>
                  <option value="INTEGRATION">Integration - Tool management</option>
                  <option value="ADMIN">Admin - Full system access</option>
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleInviteUser}
                  disabled={!inviteEmail || !inviteName}
                  className="px-4 py-2 text-sm font-medium text-white bg-emerald-500 rounded-lg hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Send Invitation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Slack Settings Modal */}
      {showSlackModal && slackSettings && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <MessageSquare className="h-5 w-5 mr-2 text-purple-600" />
                Slack Integration Settings
              </h3>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Webhook URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Slack Webhook URL
                </label>
                <div className="flex space-x-2">
                  <input
                    type="url"
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="https://hooks.slack.com/services/..."
                  />
                  <button
                    onClick={handleTestSlackWebhook}
                    disabled={!webhookUrl || isTestingWebhook}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                  >
                    {isTestingWebhook ? (
                      <Clock className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {testResult && (
                  <div className={`mt-2 text-sm flex items-center ${
                    testResult.success ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {testResult.success ? (
                      <CheckCircle className="h-4 w-4 mr-2" />
                    ) : (
                      <AlertCircle className="h-4 w-4 mr-2" />
                    )}
                    {testResult.message}
                  </div>
                )}
                {slackSettings.testSentAt && (
                  <div className="text-xs text-gray-500 mt-1">
                    Last test: {new Date(slackSettings.testSentAt).toLocaleString()}
                  </div>
                )}
              </div>

              {/* Notification Settings */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Notification Types</h4>
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={slackSettings.notifications.accessReviewComplete}
                      onChange={(e) => setSlackSettings({
                        ...slackSettings,
                        notifications: {
                          ...slackSettings.notifications,
                          accessReviewComplete: e.target.checked
                        }
                      })}
                      className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Access Review Completed</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={slackSettings.notifications.newToolSynced}
                      onChange={(e) => setSlackSettings({
                        ...slackSettings,
                        notifications: {
                          ...slackSettings.notifications,
                          newToolSynced: e.target.checked
                        }
                      })}
                      className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">New Tool Synced</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={slackSettings.notifications.userInvited}
                      onChange={(e) => setSlackSettings({
                        ...slackSettings,
                        notifications: {
                          ...slackSettings.notifications,
                          userInvited: e.target.checked
                        }
                      })}
                      className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">User Invited to SparrowVision</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={slackSettings.notifications.policyViolation}
                      onChange={(e) => setSlackSettings({
                        ...slackSettings,
                        notifications: {
                          ...slackSettings.notifications,
                          policyViolation: e.target.checked
                        }
                      })}
                      className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Policy Violations</span>
                  </label>
                </div>
              </div>

              {/* Example Message */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Example Slack Message:</h4>
                <div className="bg-white border border-gray-200 rounded p-3 text-sm">
                  <div className="font-medium text-blue-600">📋 SparrowVision Access Review Summary</div>
                  <div className="mt-1 text-gray-700">
                    🛠️ Tools Reviewed: 7<br />
                    👤 Users Analyzed: 124<br />
                    ❌ Exits Flagged: 5<br />
                    ✅ Users Removed: 3<br /><br />
                    📎 <span className="text-blue-600 underline">Download Report (PDF)</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => setShowSlackModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveSlackSettings}
                  className="px-4 py-2 text-sm font-medium text-white bg-purple-500 rounded-lg hover:bg-purple-600 transition-colors flex items-center"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Settings
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
