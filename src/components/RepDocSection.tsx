import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Download, 
  Send, 
  Calendar, 
  Clock,
  CheckCircle,
  AlertCircle,
  Eye,
  Mail,
  Shield,
  Award,
  Printer,
  Share,
  Archive
} from 'lucide-react';

interface Report {
  id: string;
  title: string;
  type: 'ACCESS_REVIEW' | 'COMPLIANCE' | 'AUDIT' | 'CERTIFICATION';
  reviewId?: string;
  status: 'GENERATED' | 'CERTIFIED' | 'SENT' | 'ARCHIVED';
  generatedAt: string;
  generatedBy: string;
  certifiedAt?: string;
  certifiedBy?: string;
  sentAt?: string;
  sentTo?: string[];
  filePath?: string;
  toolsReviewed: string[];
  usersReviewed: number;
  removals: number;
  flags: number;
  complianceFramework?: string;
}

interface Certification {
  id: string;
  reportId: string;
  framework: string;
  certifiedBy: string;
  certifiedAt: string;
  validUntil: string;
  certificateNumber: string;
  status: 'VALID' | 'EXPIRED' | 'REVOKED';
}

export default function RepDocSection() {
  const [reports, setReports] = useState<Report[]>([]);
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [showCertifyModal, setShowCertifyModal] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [emailRecipients, setEmailRecipients] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailMessage, setEmailMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [newReport, setNewReport] = useState({
    type: 'ACCESS_REVIEW' as Report['type'],
    title: '',
    toolFilter: 'ALL',
    selectedTools: [] as string[]
  });

  // Available tools for selection
  const availableTools = ['GitHub', 'Slack', 'AWS', 'Jira', 'Office365', 'Salesforce', 'HubSpot', 'BambooHR'];

  useEffect(() => {
    loadReportsAndCertifications();
  }, []);

  const loadReportsAndCertifications = async () => {
    setIsLoading(true);
    
    // Mock reports data
    const mockReports: Report[] = [
      {
        id: '1',
        title: 'Q4 2024 Complete Access Review Report',
        type: 'ACCESS_REVIEW',
        reviewId: 'review_1',
        status: 'CERTIFIED',
        generatedAt: '2024-01-15T16:30:00Z',
        generatedBy: 'admin@surveysparrow.com',
        certifiedAt: '2024-01-15T17:00:00Z',
        certifiedBy: 'security@surveysparrow.com',
        sentAt: '2024-01-15T17:30:00Z',
        sentTo: ['it-admin@surveysparrow.com', 'compliance@surveysparrow.com'],
        filePath: '/reports/q4-2024-access-review.pdf',
        toolsReviewed: ['GitHub', 'Slack', 'AWS', 'Jira', 'Office365'],
        usersReviewed: 156,
        removals: 23,
        flags: 8,
        complianceFramework: 'ISO 27001'
      },
      {
        id: '2',
        title: 'GitHub Access Audit Report',
        type: 'AUDIT',
        reviewId: 'review_2',
        status: 'GENERATED',
        generatedAt: '2024-01-14T14:20:00Z',
        generatedBy: 'security@surveysparrow.com',
        toolsReviewed: ['GitHub'],
        usersReviewed: 45,
        removals: 2,
        flags: 3,
        complianceFramework: 'SOX'
      },
      {
        id: '3',
        title: 'Monthly Compliance Report - December 2023',
        type: 'COMPLIANCE',
        status: 'SENT',
        generatedAt: '2024-01-01T10:00:00Z',
        generatedBy: 'compliance@surveysparrow.com',
        certifiedAt: '2024-01-01T11:00:00Z',
        certifiedBy: 'ciso@surveysparrow.com',
        sentAt: '2024-01-01T12:00:00Z',
        sentTo: ['board@surveysparrow.com', 'audit@surveysparrow.com'],
        toolsReviewed: ['All Tools'],
        usersReviewed: 234,
        removals: 15,
        flags: 4,
        complianceFramework: 'SOX, GDPR'
      }
    ];

    // Mock certifications data
    const mockCertifications: Certification[] = [
      {
        id: '1',
        reportId: '1',
        framework: 'ISO 27001',
        certifiedBy: 'security@surveysparrow.com',
        certifiedAt: '2024-01-15T17:00:00Z',
        validUntil: '2024-04-15T17:00:00Z',
        certificateNumber: 'SS-ISO27001-2024-Q4-001',
        status: 'VALID'
      },
      {
        id: '2',
        reportId: '3',
        framework: 'SOX Compliance',
        certifiedBy: 'ciso@surveysparrow.com',
        certifiedAt: '2024-01-01T11:00:00Z',
        validUntil: '2024-04-01T11:00:00Z',
        certificateNumber: 'SS-SOX-2024-Q1-001',
        status: 'VALID'
      }
    ];

    setReports(mockReports);
    setCertifications(mockCertifications);
    setIsLoading(false);
  };

  const handleGenerateReport = async () => {
    if (!newReport.title.trim()) {
      alert('Please provide a title for the report');
      return;
    }

    if (newReport.toolFilter === 'SELECTED' && newReport.selectedTools.length === 0) {
      alert('Please select at least one tool for the report');
      return;
    }

    const reportToolsReviewed = newReport.toolFilter === 'ALL' 
      ? availableTools 
      : newReport.selectedTools;

    const mockReport: Report = {
      id: Date.now().toString(),
      title: newReport.title,
      type: newReport.type,
      status: 'GENERATED',
      generatedAt: new Date().toISOString(),
      generatedBy: 'admin@surveysparrow.com',
      toolsReviewed: reportToolsReviewed,
      usersReviewed: Math.floor(Math.random() * 200) + 50,
      removals: Math.floor(Math.random() * 20) + 1,
      flags: Math.floor(Math.random() * 15) + 1,
      complianceFramework: 'ISO 27001'
    };

    setReports(prev => [mockReport, ...prev]);
    setShowGenerateModal(false);
    setNewReport({
      type: 'ACCESS_REVIEW',
      title: '',
      toolFilter: 'ALL',
      selectedTools: []
    });

    console.log('Report generated:', mockReport);
  };

  const handleToolSelection = (tool: string) => {
    if (newReport.selectedTools.includes(tool)) {
      setNewReport(prev => ({
        ...prev,
        selectedTools: prev.selectedTools.filter(t => t !== tool)
      }));
    } else {
      setNewReport(prev => ({
        ...prev,
        selectedTools: [...prev.selectedTools, tool]
      }));
    }
  };

  const generateCertification = async (reportId: string, framework: string) => {
    const report = reports.find(r => r.id === reportId);
    if (!report) return;

    const newCertification: Certification = {
      id: Date.now().toString(),
      reportId: reportId,
      framework: framework,
      certifiedBy: 'admin@surveysparrow.com',
      certifiedAt: new Date().toISOString(),
      validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days validity
      certificateNumber: `SS-${framework.toUpperCase().replace(' ', '')}-${new Date().getFullYear()}-${Date.now()}`,
      status: 'VALID'
    };

    setCertifications(prev => [...prev, newCertification]);
    
    setReports(prev => prev.map(r =>
      r.id === reportId
        ? {
            ...r,
            status: 'CERTIFIED',
            certifiedAt: new Date().toISOString(),
            certifiedBy: 'admin@surveysparrow.com'
          }
        : r
    ));

    setShowCertifyModal(false);
  };

  const sendReport = async (reportId: string) => {
    const recipients = emailRecipients.split(',').map(email => email.trim());
    
    setReports(prev => prev.map(r =>
      r.id === reportId
        ? {
            ...r,
            status: 'SENT',
            sentAt: new Date().toISOString(),
            sentTo: recipients
          }
        : r
    ));

    // Mock email sending
    console.log('Sending report via email...', {
      to: recipients,
      subject: emailSubject,
      message: emailMessage,
      reportId
    });

    setShowSendModal(false);
    setEmailRecipients('');
    setEmailSubject('');
    setEmailMessage('');
  };

  const downloadReport = (report: Report) => {
    // Mock download functionality
    const reportContent = {
      title: report.title,
      generatedAt: report.generatedAt,
      generatedBy: report.generatedBy,
      summary: {
        toolsReviewed: report.toolsReviewed,
        usersReviewed: report.usersReviewed,
        removals: report.removals,
        flags: report.flags
      },
      certification: certifications.find(c => c.reportId === report.id),
      complianceFramework: report.complianceFramework
    };

    const blob = new Blob([JSON.stringify(reportContent, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${report.title.replace(/\s+/g, '-').toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStatusColor = (status: Report['status']) => {
    switch (status) {
      case 'GENERATED': return 'bg-blue-100 text-blue-800';
      case 'CERTIFIED': return 'bg-green-100 text-green-800';
      case 'SENT': return 'bg-purple-100 text-purple-800';
      case 'ARCHIVED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: Report['type']) => {
    switch (type) {
      case 'ACCESS_REVIEW': return 'bg-emerald-100 text-emerald-800';
      case 'COMPLIANCE': return 'bg-orange-100 text-orange-800';
      case 'AUDIT': return 'bg-red-100 text-red-800';
      case 'CERTIFICATION': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
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
          <h1 className="text-3xl font-bold text-gray-900">Rep-Doc</h1>
          <p className="text-gray-600 mt-1">Reports & Documentation Management</p>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => setShowGenerateModal(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center"
          >
            <FileText className="h-4 w-4 mr-2" />
            Generate Report
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="text-2xl font-bold text-blue-700">{reports.length}</div>
          <div className="text-sm text-blue-600">Total Reports</div>
        </div>
        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <div className="text-2xl font-bold text-green-700">{reports.filter(r => r.status === 'CERTIFIED').length}</div>
          <div className="text-sm text-green-600">Certified</div>
        </div>
        <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
          <div className="text-2xl font-bold text-purple-700">{reports.filter(r => r.status === 'SENT').length}</div>
          <div className="text-sm text-purple-600">Sent</div>
        </div>
        <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
          <div className="text-2xl font-bold text-yellow-700">{certifications.filter(c => c.status === 'VALID').length}</div>
          <div className="text-sm text-yellow-600">Active Certificates</div>
        </div>
      </div>

      {/* Reports List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Generated Reports</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Report
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Summary
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
              {reports.map((report) => (
                <tr key={report.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{report.title}</div>
                      <div className="text-sm text-gray-500">
                        Generated {new Date(report.generatedAt).toLocaleString()} by {report.generatedBy}
                      </div>
                      {report.complianceFramework && (
                        <div className="text-xs text-blue-600 mt-1">
                          <Shield className="h-3 w-3 inline mr-1" />
                          {report.complianceFramework}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(report.type)}`}>
                      {report.type.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      <div>Users: {report.usersReviewed}</div>
                      <div>Tools: {report.toolsReviewed.length}</div>
                      <div className="text-red-600">Removals: {report.removals}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(report.status)}`}>
                      {report.status}
                    </span>
                    {report.certifiedAt && (
                      <div className="text-xs text-green-600 mt-1">
                        <Award className="h-3 w-3 inline mr-1" />
                        Certified
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setSelectedReport(report)}
                        className="text-blue-600 hover:text-blue-900"
                        title="View report"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => downloadReport(report)}
                        className="text-emerald-600 hover:text-emerald-900"
                        title="Download"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                      {report.status === 'GENERATED' && (
                        <button
                          onClick={() => {
                            setSelectedReport(report);
                            setShowCertifyModal(true);
                          }}
                          className="text-yellow-600 hover:text-yellow-900"
                          title="Certify"
                        >
                          <Award className="h-4 w-4" />
                        </button>
                      )}
                      {(report.status === 'CERTIFIED' || report.status === 'GENERATED') && (
                        <button
                          onClick={() => {
                            setSelectedReport(report);
                            setEmailSubject(`${report.title} - Access Review Report`);
                            setEmailMessage(`Please find attached the access review report: ${report.title}\n\nSummary:\n- Users Reviewed: ${report.usersReviewed}\n- Tools Reviewed: ${report.toolsReviewed.join(', ')}\n- Access Removals: ${report.removals}\n- Flagged Items: ${report.flags}\n\nThis report has been generated as part of our regular access governance process.`);
                            setShowSendModal(true);
                          }}
                          className="text-purple-600 hover:text-purple-900"
                          title="Send via email"
                        >
                          <Send className="h-4 w-4" />
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

      {/* Active Certifications */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <Award className="h-5 w-5 mr-2 text-yellow-600" />
            Active Certifications
          </h2>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {certifications.map((cert) => (
              <div key={cert.id} className="border border-gray-200 rounded-lg p-4 bg-gradient-to-r from-yellow-50 to-orange-50">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-900">{cert.framework}</h3>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    cert.status === 'VALID' ? 'bg-green-100 text-green-800' :
                    cert.status === 'EXPIRED' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {cert.status}
                  </span>
                </div>
                
                <div className="space-y-1 text-sm text-gray-600">
                  <div>Certificate #: {cert.certificateNumber}</div>
                  <div>Certified by: {cert.certifiedBy}</div>
                  <div>Valid until: {new Date(cert.validUntil).toLocaleDateString()}</div>
                </div>
                
                <div className="mt-3 flex items-center space-x-2">
                  <button className="text-blue-600 hover:text-blue-900 text-sm">
                    <Printer className="h-4 w-4 inline mr-1" />
                    Print
                  </button>
                  <button className="text-emerald-600 hover:text-emerald-900 text-sm">
                    <Share className="h-4 w-4 inline mr-1" />
                    Share
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Certify Modal */}
      {showCertifyModal && selectedReport && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Certify Report</h3>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <h4 className="font-medium text-gray-900">{selectedReport.title}</h4>
                <p className="text-sm text-gray-600 mt-1">
                  This will generate an official certification for the report.
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Compliance Framework
                </label>
                <select
                  defaultValue={selectedReport.complianceFramework || 'ISO 27001'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="ISO 27001">ISO 27001</option>
                  <option value="SOX">SOX Compliance</option>
                  <option value="GDPR">GDPR</option>
                  <option value="HIPAA">HIPAA</option>
                  <option value="PCI DSS">PCI DSS</option>
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => setShowCertifyModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => generateCertification(selectedReport.id, selectedReport.complianceFramework || 'ISO 27001')}
                  className="px-4 py-2 text-sm font-medium text-white bg-yellow-500 rounded-lg hover:bg-yellow-600 transition-colors flex items-center"
                >
                  <Award className="h-4 w-4 mr-2" />
                  Generate Certificate
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Send Email Modal */}
      {showSendModal && selectedReport && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Send Report via Email</h3>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Recipients (comma-separated)
                </label>
                <input
                  type="email"
                  multiple
                  value={emailRecipients}
                  onChange={(e) => setEmailRecipients(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="it-admin@surveysparrow.com, compliance@surveysparrow.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                <textarea
                  rows={6}
                  value={emailMessage}
                  onChange={(e) => setEmailMessage(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => setShowSendModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => sendReport(selectedReport.id)}
                  disabled={!emailRecipients || !emailSubject}
                  className="px-4 py-2 text-sm font-medium text-white bg-purple-500 rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Send Report
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Generate Report Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Generate New Report</h3>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Report Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Report Title</label>
                <input
                  type="text"
                  value={newReport.title}
                  onChange={(e) => setNewReport(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="e.g., Q1 2024 Access Review Report"
                />
              </div>

              {/* Report Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
                <select
                  value={newReport.type}
                  onChange={(e) => setNewReport(prev => ({ ...prev, type: e.target.value as Report['type'] }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="ACCESS_REVIEW">Access Review</option>
                  <option value="COMPLIANCE">Compliance Report</option>
                  <option value="AUDIT">Security Audit</option>
                  <option value="CERTIFICATION">Certification</option>
                </select>
              </div>

              {/* Tool Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tools to Include</label>
                <div className="space-y-3">
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="ALL"
                        checked={newReport.toolFilter === 'ALL'}
                        onChange={(e) => setNewReport(prev => ({ ...prev, toolFilter: e.target.value, selectedTools: [] }))}
                        className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300"
                      />
                      <span className="ml-2 text-sm text-gray-700">All Tools</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="SELECTED"
                        checked={newReport.toolFilter === 'SELECTED'}
                        onChange={(e) => setNewReport(prev => ({ ...prev, toolFilter: e.target.value }))}
                        className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300"
                      />
                      <span className="ml-2 text-sm text-gray-700">Selected Tools</span>
                    </label>
                  </div>

                  {newReport.toolFilter === 'SELECTED' && (
                    <div className="grid grid-cols-2 gap-2 mt-3">
                      {availableTools.map(tool => (
                        <label key={tool} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={newReport.selectedTools.includes(tool)}
                            onChange={() => handleToolSelection(tool)}
                            className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                          />
                          <span className="ml-2 text-sm text-gray-700">{tool}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => setShowGenerateModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleGenerateReport}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors flex items-center"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Generate Report
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
