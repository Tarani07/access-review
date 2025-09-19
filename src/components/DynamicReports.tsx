import React, { useState, useEffect } from 'react';
import {
  dynamicReportsService,
  DynamicReport,
  ReportResult,
  ReportTemplate
} from '../services/dynamicReports';
import DynamicReportBuilder from './DynamicReportBuilder';
import authService from '../services/auth';

export default function DynamicReports() {
  const [reports, setReports] = useState<DynamicReport[]>([]);
  const [reportResults, setReportResults] = useState<{ [key: string]: ReportResult[] }>({});
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({});
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingReport, setEditingReport] = useState<DynamicReport | undefined>();
  const [selectedReport, setSelectedReport] = useState<DynamicReport | null>(null);
  const [selectedResult, setSelectedResult] = useState<ReportResult | null>(null);
  const [view, setView] = useState<'list' | 'result'>('list');
  const [filterType, setFilterType] = useState<'all' | DynamicReport['type']>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = () => {
    const allReports = dynamicReportsService.getReports();
    setReports(allReports);
  };

  const handleCreateReport = () => {
    setEditingReport(undefined);
    setShowBuilder(true);
  };

  const handleEditReport = (report: DynamicReport) => {
    setEditingReport(report);
    setShowBuilder(true);
  };

  const handleBuilderClose = () => {
    setShowBuilder(false);
    setEditingReport(undefined);
    loadReports(); // Refresh the list
  };

  const generateReport = async (reportId: string) => {
    setLoading(prev => ({ ...prev, [reportId]: true }));
    
    try {
      const result = await dynamicReportsService.generateReport(reportId);
      setReportResults(prev => ({
        ...prev,
        [reportId]: [result, ...(prev[reportId] || [])]
      }));
      
      // Show the result
      setSelectedReport(reports.find(r => r.id === reportId) || null);
      setSelectedResult(result);
      setView('result');
    } catch (error) {
      console.error('Report generation failed:', error);
      alert('Failed to generate report. Please try again.');
    } finally {
      setLoading(prev => ({ ...prev, [reportId]: false }));
    }
  };

  const deleteReport = (reportId: string) => {
    if (confirm('Are you sure you want to delete this report?')) {
      dynamicReportsService.deleteReport(reportId);
      loadReports();
    }
  };

  const exportResult = (result: ReportResult, format: 'csv' | 'json' | 'excel') => {
    dynamicReportsService.exportReport(result, format);
  };

  const toggleReportStatus = (reportId: string) => {
    const report = reports.find(r => r.id === reportId);
    if (report) {
      const newStatus = report.status === 'active' ? 'inactive' : 'active';
      dynamicReportsService.updateReport(reportId, { status: newStatus });
      loadReports();
    }
  };

  // Filter reports based on search and type
  const filteredReports = reports.filter(report => {
    const matchesSearch = report.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || report.type === filterType;
    return matchesSearch && matchesType;
  });

  // Get report type badge color
  const getTypeBadgeColor = (type: DynamicReport['type']) => {
    const colors = {
      user_access: 'bg-blue-100 text-blue-800',
      compliance: 'bg-red-100 text-red-800',
      audit: 'bg-yellow-100 text-yellow-800',
      risk_assessment: 'bg-orange-100 text-orange-800',
      activity: 'bg-green-100 text-green-800',
      custom: 'bg-purple-100 text-purple-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  // Render Chart Component (Simple visualization)
  const renderChart = (chartConfig: any, data: any[]) => {
    if (!data || data.length === 0) return <div>No data for chart</div>;

    if (chartConfig.type === 'pie' || chartConfig.type === 'donut') {
      return (
        <div className="space-y-2">
          <h4 className="font-medium">{chartConfig.title}</h4>
          {data.slice(0, 5).map((item, index) => (
            <div key={index} className="flex justify-between items-center">
              <span className="text-sm">{item.label}</span>
              <span className="text-sm font-medium">{item.value}</span>
            </div>
          ))}
        </div>
      );
    }

    if (chartConfig.type === 'bar') {
      const maxValue = Math.max(...data.map(d => d[chartConfig.yAxis] || 0));
      return (
        <div className="space-y-2">
          <h4 className="font-medium">{chartConfig.title}</h4>
          {data.slice(0, 10).map((item, index) => (
            <div key={index} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>{item.label || item[chartConfig.xAxis]}</span>
                <span>{item[chartConfig.yAxis] || 0}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{
                    width: `${((item[chartConfig.yAxis] || 0) / maxValue) * 100}%`
                  }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    return <div>Chart type not supported in preview</div>;
  };

  if (view === 'result' && selectedResult && selectedReport) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <button
              onClick={() => setView('list')}
              className="text-blue-600 hover:text-blue-800 mb-2"
            >
              ← Back to Reports
            </button>
            <h1 className="text-2xl font-bold text-gray-900">{selectedReport.name}</h1>
            <p className="text-gray-600">{selectedReport.description}</p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => exportResult(selectedResult, 'csv')}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
            >
              Export CSV
            </button>
            <button
              onClick={() => exportResult(selectedResult, 'json')}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Export JSON
            </button>
          </div>
        </div>

        {/* Report Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-2xl font-bold text-gray-900">{selectedResult.summary.totalRecords}</div>
            <div className="text-gray-600">Total Records</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-2xl font-bold text-gray-900">{selectedResult.insights.length}</div>
            <div className="text-gray-600">Insights</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-2xl font-bold text-gray-900">{selectedResult.recommendations.length}</div>
            <div className="text-gray-600">Recommendations</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm text-gray-900">{formatDate(selectedResult.summary.generatedAt)}</div>
            <div className="text-gray-600">Generated</div>
          </div>
        </div>

        {/* Charts */}
        {selectedResult.charts.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Visualizations</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {selectedResult.charts.map((chart, index) => (
                <div key={index} className="bg-white p-6 rounded-lg shadow">
                  {renderChart(chart.config, chart.data)}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Insights */}
        {selectedResult.insights.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Key Insights</h2>
            <div className="bg-blue-50 p-6 rounded-lg">
              <ul className="space-y-2">
                {selectedResult.insights.map((insight, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-blue-500 mr-2">•</span>
                    <span className="text-blue-800">{insight}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Recommendations */}
        {selectedResult.recommendations.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Recommendations</h2>
            <div className="bg-yellow-50 p-6 rounded-lg">
              <ul className="space-y-2">
                {selectedResult.recommendations.map((recommendation, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-yellow-500 mr-2">→</span>
                    <span className="text-yellow-800">{recommendation}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Data Table */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Report Data</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {selectedResult.data.length > 0 && Object.keys(selectedResult.data[0]).map(key => (
                    <th key={key} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {selectedResult.data.slice(0, 100).map((row, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    {Object.values(row).map((value: any, cellIndex) => (
                      <td key={cellIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {Array.isArray(value) ? value.join(', ') : String(value)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {selectedResult.data.length > 100 && (
            <div className="px-6 py-3 bg-gray-50 text-sm text-gray-500">
              Showing first 100 rows of {selectedResult.data.length} total records
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dynamic Reports</h1>
          <p className="text-gray-600">Create and manage custom reports with advanced filtering and visualizations</p>
        </div>
        <button
          onClick={handleCreateReport}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Create New Report
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search reports..."
            className="w-full border border-gray-300 rounded-md px-4 py-2"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div>
          <select
            className="border border-gray-300 rounded-md px-4 py-2"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
          >
            <option value="all">All Types</option>
            <option value="user_access">User Access</option>
            <option value="compliance">Compliance</option>
            <option value="audit">Audit</option>
            <option value="risk_assessment">Risk Assessment</option>
            <option value="activity">Activity</option>
            <option value="custom">Custom</option>
          </select>
        </div>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredReports.map(report => {
          const results = reportResults[report.id] || [];
          const isGenerating = loading[report.id];

          return (
            <div key={report.id} className="bg-white rounded-lg shadow border border-gray-200">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">{report.name}</h3>
                    <p className="text-sm text-gray-600 mb-3">{report.description}</p>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded text-xs ${getTypeBadgeColor(report.type)}`}>
                        {report.type.replace('_', ' ').toUpperCase()}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs ${
                        report.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {report.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => handleEditReport(report)}
                      className="text-gray-400 hover:text-gray-600"
                      title="Edit report"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => deleteReport(report.id)}
                      className="text-gray-400 hover:text-red-600"
                      title="Delete report"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="space-y-2 text-sm text-gray-600">
                  <div>Filters: {report.filters.length}</div>
                  <div>Columns: {report.columns.length}</div>
                  <div>Charts: {report.charts.length}</div>
                  {report.lastGenerated && (
                    <div>Last Generated: {formatDate(report.lastGenerated)}</div>
                  )}
                </div>

                <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => toggleReportStatus(report.id)}
                    className={`text-sm ${
                      report.status === 'active' 
                        ? 'text-red-600 hover:text-red-800' 
                        : 'text-green-600 hover:text-green-800'
                    }`}
                  >
                    {report.status === 'active' ? 'Deactivate' : 'Activate'}
                  </button>
                  
                  <button
                    onClick={() => generateReport(report.id)}
                    disabled={isGenerating || report.status !== 'active'}
                    className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isGenerating ? 'Generating...' : 'Run Report'}
                  </button>
                </div>

                {/* Recent Results */}
                {results.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Recent Results</h4>
                    <div className="space-y-2">
                      {results.slice(0, 3).map(result => (
                        <div key={result.id} className="flex justify-between items-center text-sm">
                          <span className="text-gray-600">
                            {formatDate(result.summary.generatedAt)}
                          </span>
                          <button
                            onClick={() => {
                              setSelectedReport(report);
                              setSelectedResult(result);
                              setView('result');
                            }}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            View
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredReports.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-lg">No reports found</div>
          <p className="text-gray-500 mt-2">
            {searchTerm || filterType !== 'all' 
              ? 'Try adjusting your search or filter criteria'
              : 'Create your first dynamic report to get started'
            }
          </p>
        </div>
      )}

      {/* Report Builder Modal */}
      <DynamicReportBuilder
        isOpen={showBuilder}
        onClose={handleBuilderClose}
        existingReport={editingReport}
      />
    </div>
  );
}
