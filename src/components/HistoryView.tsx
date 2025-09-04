import React, { useState } from 'react';
import { Calendar, Download, Eye, Filter } from 'lucide-react';

interface HistoryRecord {
  id: string;
  date: string;
  tool: string;
  action: 'SCAN' | 'REMOVE' | 'EMAIL_SENT';
  userEmail: string;
  performedBy: string;
  details: string;
}

interface HistoryViewProps {
  records: HistoryRecord[];
}

export default function HistoryView({ records }: HistoryViewProps) {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedTool, setSelectedTool] = useState('');
  const [selectedAction, setSelectedAction] = useState('');

  const years = Array.from(new Set(records.map(record => new Date(record.date).getFullYear().toString()))).sort().reverse();
  const tools = Array.from(new Set(records.map(record => record.tool))).sort();
  const actions = ['SCAN', 'REMOVE', 'EMAIL_SENT'];

  const filteredRecords = records.filter(record => {
    const recordYear = new Date(record.date).getFullYear().toString();
    return (
      recordYear === selectedYear &&
      (selectedTool === '' || record.tool === selectedTool) &&
      (selectedAction === '' || record.action === selectedAction)
    );
  });

  const getActionColor = (action: string) => {
    switch (action) {
      case 'SCAN': return 'bg-blue-100 text-blue-800';
      case 'REMOVE': return 'bg-red-100 text-red-800';
      case 'EMAIL_SENT': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleExportHistory = () => {
    const csv = [
      ['Date', 'Tool', 'Action', 'User Email', 'Performed By', 'Details'],
      ...filteredRecords.map(record => [
        new Date(record.date).toLocaleString(),
        record.tool,
        record.action,
        record.userEmail,
        record.performedBy,
        record.details
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `access_review_history_${selectedYear}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-medium text-gray-900">Access Review History</h3>
        <button
          onClick={handleExportHistory}
          className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-md font-medium flex items-center space-x-2 transition-colors"
        >
          <Download className="h-4 w-4" />
          <span>Export History</span>
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          >
            {years.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tool</label>
          <select
            value={selectedTool}
            onChange={(e) => setSelectedTool(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          >
            <option value="">All Tools</option>
            {tools.map(tool => (
              <option key={tool} value={tool}>{tool}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Action</label>
          <select
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          >
            <option value="">All Actions</option>
            {actions.map(action => (
              <option key={action} value={action}>{action.replace('_', ' ')}</option>
            ))}
          </select>
        </div>
        <div className="flex items-end">
          <div className="text-sm text-gray-600">
            <Filter className="h-4 w-4 inline mr-1" />
            {filteredRecords.length} records found
          </div>
        </div>
      </div>

      {/* History Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tool</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Performed By</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredRecords.map((record) => (
              <tr key={record.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {new Date(record.date).toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {record.tool}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getActionColor(record.action)}`}>
                    {record.action.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {record.userEmail}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {record.performedBy}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                  {record.details}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredRecords.length === 0 && (
        <div className="text-center py-8">
          <Calendar className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No history records</h3>
          <p className="mt-1 text-sm text-gray-500">No records found for the selected filters.</p>
        </div>
      )}
    </div>
  );
}