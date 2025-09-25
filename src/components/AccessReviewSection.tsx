import React, { useState, useEffect } from 'react';
import { 
  Eye, 
  User, 
  Settings, 
  Download, 
  FileText, 
  CheckCircle, 
  AlertTriangle,
  RefreshCw,
  Search,
  Filter,
  Users,
  Calendar,
  Clock,
  Mail,
  Send
} from 'lucide-react';

interface ReviewItem {
  id: string;
  userEmail: string;
  userName: string;
  toolName: string;
  role: string;
  permissions: string[];
  status: 'ACTIVE' | 'INACTIVE' | 'FLAGGED';
  lastAccess?: string;
  shouldRemove: boolean;
  reviewedBy?: string;
  reviewedAt?: string;
  notes?: string;
}

interface AccessReview {
  id: string;
  title: string;
  type: 'USER_WISE' | 'TOOL_WISE' | 'COMPLETE';
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  createdBy: string;
  createdAt: string;
  targetUser?: string;
  targetTool?: string;
  totalItems: number;
  reviewedItems: number;
  flaggedItems: number;
  removedItems: number;
  completedAt?: string;
  reportGenerated: boolean;
}

export default function AccessReviewSection() {
  const [activeReviews, setActiveReviews] = useState<AccessReview[]>([]);
  const [selectedReview, setSelectedReview] = useState<AccessReview | null>(null);
  const [reviewItems, setReviewItems] = useState<ReviewItem[]>([]);
  const [reviewMode, setReviewMode] = useState<'USER_WISE' | 'TOOL_WISE' | 'COMPLETE'>('USER_WISE');
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedTool, setSelectedTool] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadActiveReviews();
  }, []);

  const loadActiveReviews = async () => {
    // Mock data for active reviews
    const mockReviews: AccessReview[] = [
      {
        id: '1',
        title: 'Q4 2024 Complete Access Review',
        type: 'COMPLETE',
        status: 'IN_PROGRESS',
        createdBy: 'admin@surveysparrow.com',
        createdAt: '2024-01-15T10:00:00Z',
        totalItems: 156,
        reviewedItems: 89,
        flaggedItems: 12,
        removedItems: 8,
        reportGenerated: false
      },
      {
        id: '2',
        title: 'GitHub Access Review',
        type: 'TOOL_WISE',
        status: 'COMPLETED',
        createdBy: 'security@surveysparrow.com',
        createdAt: '2024-01-10T14:30:00Z',
        targetTool: 'GitHub',
        totalItems: 45,
        reviewedItems: 45,
        flaggedItems: 3,
        removedItems: 2,
        completedAt: '2024-01-12T16:45:00Z',
        reportGenerated: true
      },
      {
        id: '3',
        title: 'John Doe Access Review',
        type: 'USER_WISE',
        status: 'PENDING',
        createdBy: 'admin@surveysparrow.com',
        createdAt: '2024-01-14T09:15:00Z',
        targetUser: 'john.doe@surveysparrow.com',
        totalItems: 8,
        reviewedItems: 0,
        flaggedItems: 0,
        removedItems: 0,
        reportGenerated: false
      }
    ];
    
    setActiveReviews(mockReviews);
  };

  const loadReviewItems = async (reviewId: string) => {
    setIsLoading(true);
    // Mock review items
    const mockItems: ReviewItem[] = [
      {
        id: '1',
        userEmail: 'john.doe@surveysparrow.com',
        userName: 'John Doe',
        toolName: 'GitHub',
        role: 'Developer',
        permissions: ['read', 'write', 'push'],
        status: 'ACTIVE',
        lastAccess: '2024-01-14T15:30:00Z',
        shouldRemove: false
      },
      {
        id: '2',
        userEmail: 'jane.smith@surveysparrow.com',
        userName: 'Jane Smith',
        toolName: 'AWS',
        role: 'Admin',
        permissions: ['full-access', 'billing'],
        status: 'ACTIVE',
        lastAccess: '2024-01-14T12:20:00Z',
        shouldRemove: false
      },
      {
        id: '3',
        userEmail: 'bob.wilson@surveysparrow.com',
        userName: 'Bob Wilson',
        toolName: 'Slack',
        role: 'Member',
        permissions: ['message'],
        status: 'FLAGGED',
        lastAccess: '2024-01-01T10:00:00Z',
        shouldRemove: true,
        reviewedBy: 'admin@surveysparrow.com',
        reviewedAt: '2024-01-15T11:00:00Z',
        notes: 'User has been inactive for 45+ days'
      }
    ];
    
    setReviewItems(mockItems);
    setIsLoading(false);
  };

  const handleCreateReview = async () => {
    const newReview: AccessReview = {
      id: Date.now().toString(),
      title: reviewMode === 'USER_WISE' ? `${selectedUser} Access Review` :
             reviewMode === 'TOOL_WISE' ? `${selectedTool} Access Review` :
             `Complete Access Review - ${new Date().toLocaleDateString()}`,
      type: reviewMode,
      status: 'PENDING',
      createdBy: 'admin@surveysparrow.com',
      createdAt: new Date().toISOString(),
      targetUser: reviewMode === 'USER_WISE' ? selectedUser : undefined,
      targetTool: reviewMode === 'TOOL_WISE' ? selectedTool : undefined,
      totalItems: reviewMode === 'COMPLETE' ? 156 : reviewMode === 'TOOL_WISE' ? 45 : 8,
      reviewedItems: 0,
      flaggedItems: 0,
      removedItems: 0,
      reportGenerated: false
    };

    setActiveReviews(prev => [newReview, ...prev]);
    setShowCreateModal(false);
    setSelectedUser('');
    setSelectedTool('');
  };

  const handleReviewItem = async (itemId: string, action: 'approve' | 'flag' | 'remove', notes?: string) => {
    setReviewItems(prev => prev.map(item => 
      item.id === itemId 
        ? { 
            ...item, 
            status: action === 'approve' ? 'ACTIVE' : action === 'flag' ? 'FLAGGED' : 'INACTIVE',
            shouldRemove: action === 'remove',
            reviewedBy: 'admin@surveysparrow.com',
            reviewedAt: new Date().toISOString(),
            notes: notes || item.notes
          }
        : item
    ));

    // Update review progress
    if (selectedReview) {
      const reviewedCount = reviewItems.filter(item => item.reviewedBy).length + 1;
      const flaggedCount = reviewItems.filter(item => item.status === 'FLAGGED' || action === 'flag').length;
      const removedCount = reviewItems.filter(item => item.shouldRemove || action === 'remove').length;

      setActiveReviews(prev => prev.map(review =>
        review.id === selectedReview.id
          ? {
              ...review,
              reviewedItems: reviewedCount,
              flaggedItems: flaggedCount,
              removedItems: removedCount,
              status: reviewedCount === review.totalItems ? 'COMPLETED' : 'IN_PROGRESS'
            }
          : review
      ));
    }
  };

  const handleCompleteReview = async (reviewId: string) => {
    const review = activeReviews.find(r => r.id === reviewId);
    if (!review) return;

    setActiveReviews(prev => prev.map(r =>
      r.id === reviewId
        ? {
            ...r,
            status: 'COMPLETED',
            completedAt: new Date().toISOString(),
            reportGenerated: true
          }
        : r
    ));

    // Generate report (mock)
    console.log('Generating access review report...');
  };

  const exportReport = (review: AccessReview) => {
    // Mock export functionality
    const reportData = {
      review: review,
      items: reviewItems,
      summary: {
        totalReviewed: review.reviewedItems,
        flaggedUsers: review.flaggedItems,
        removedAccess: review.removedItems,
        completedBy: review.createdBy,
        completedAt: review.completedAt
      }
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `access-review-${review.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredItems = reviewItems.filter(item =>
    item.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.toolName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Access Review</h1>
          <p className="text-gray-600 mt-1">Review and certify user access across all tools</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center"
        >
          <Eye className="h-4 w-4 mr-2" />
          Start New Review
        </button>
      </div>

      {/* Review Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="text-2xl font-bold text-blue-700">{activeReviews.length}</div>
          <div className="text-sm text-blue-600">Total Reviews</div>
        </div>
        <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
          <div className="text-2xl font-bold text-yellow-700">{activeReviews.filter(r => r.status === 'IN_PROGRESS').length}</div>
          <div className="text-sm text-yellow-600">In Progress</div>
        </div>
        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <div className="text-2xl font-bold text-green-700">{activeReviews.filter(r => r.status === 'COMPLETED').length}</div>
          <div className="text-sm text-green-600">Completed</div>
        </div>
        <div className="bg-red-50 rounded-lg p-4 border border-red-200">
          <div className="text-2xl font-bold text-red-700">{activeReviews.reduce((sum, r) => sum + r.flaggedItems, 0)}</div>
          <div className="text-sm text-red-600">Flagged Items</div>
        </div>
      </div>

      {/* Active Reviews */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Active Reviews</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Review
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Progress
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
              {activeReviews.map((review) => (
                <tr key={review.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{review.title}</div>
                      <div className="text-sm text-gray-500">
                        Created {new Date(review.createdAt).toLocaleDateString()} by {review.createdBy}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      review.type === 'COMPLETE' ? 'bg-purple-100 text-purple-800' :
                      review.type === 'USER_WISE' ? 'bg-blue-100 text-blue-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {review.type.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                        <div 
                          className="bg-emerald-500 h-2 rounded-full"
                          style={{ width: `${(review.reviewedItems / review.totalItems) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600">
                        {review.reviewedItems}/{review.totalItems}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      review.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                      review.status === 'IN_PROGRESS' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {review.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setSelectedReview(review);
                          loadReviewItems(review.id);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                        title="Review items"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      {review.reportGenerated && (
                        <button
                          onClick={() => exportReport(review)}
                          className="text-emerald-600 hover:text-emerald-900"
                          title="Download report"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                      )}
                      {review.status === 'IN_PROGRESS' && (
                        <button
                          onClick={() => handleCompleteReview(review.id)}
                          className="text-green-600 hover:text-green-900"
                          title="Complete review"
                        >
                          <CheckCircle className="h-4 w-4" />
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

      {/* Review Details Modal */}
      {selectedReview && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{selectedReview.title}</h3>
                <p className="text-sm text-gray-600">Review Items</p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="relative max-w-xs">
                  <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search items..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                  />
                </div>
                <button
                  onClick={() => setSelectedReview(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
            </div>
            
            <div className="p-6">
              {isLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-500"></div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tool</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Last Access</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredItems.map((item) => (
                        <tr key={item.id}>
                          <td className="px-4 py-3">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{item.userName}</div>
                              <div className="text-sm text-gray-500">{item.userEmail}</div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">{item.toolName}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{item.role}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {item.lastAccess ? new Date(item.lastAccess).toLocaleDateString() : 'Never'}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              item.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                              item.status === 'FLAGGED' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {item.status}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {!item.reviewedBy ? (
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleReviewItem(item.id, 'approve')}
                                  className="text-green-600 hover:text-green-900 text-sm"
                                  title="Approve"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleReviewItem(item.id, 'flag', 'Flagged for review')}
                                  className="text-yellow-600 hover:text-yellow-900 text-sm"
                                  title="Flag"
                                >
                                  <AlertTriangle className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleReviewItem(item.id, 'remove', 'Access to be removed')}
                                  className="text-red-600 hover:text-red-900 text-sm"
                                  title="Remove"
                                >
                                  <RefreshCw className="h-4 w-4" />
                                </button>
                              </div>
                            ) : (
                              <div className="text-xs text-gray-500">
                                Reviewed by {item.reviewedBy.split('@')[0]}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Review Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Start New Access Review</h3>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Review Type</label>
                <select
                  value={reviewMode}
                  onChange={(e) => setReviewMode(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="USER_WISE">User-wise Review</option>
                  <option value="TOOL_WISE">Tool-wise Review</option>
                  <option value="COMPLETE">Complete Access Review</option>
                </select>
              </div>

              {reviewMode === 'USER_WISE' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select User</label>
                  <select
                    value={selectedUser}
                    onChange={(e) => setSelectedUser(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">Choose a user...</option>
                    <option value="john.doe@surveysparrow.com">John Doe</option>
                    <option value="jane.smith@surveysparrow.com">Jane Smith</option>
                    <option value="bob.wilson@surveysparrow.com">Bob Wilson</option>
                  </select>
                </div>
              )}

              {reviewMode === 'TOOL_WISE' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Tool</label>
                  <select
                    value={selectedTool}
                    onChange={(e) => setSelectedTool(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">Choose a tool...</option>
                    <option value="GitHub">GitHub</option>
                    <option value="Slack">Slack</option>
                    <option value="AWS">AWS</option>
                    <option value="Jira">Jira</option>
                  </select>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateReview}
                  disabled={(reviewMode === 'USER_WISE' && !selectedUser) || (reviewMode === 'TOOL_WISE' && !selectedTool)}
                  className="px-4 py-2 text-sm font-medium text-white bg-emerald-500 rounded-lg hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Start Review
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
