import React, { useState, useEffect } from 'react';
import {
  dynamicReportsService,
  DynamicReport,
  ReportTemplate,
  ReportFilter,
  ReportColumn,
  ChartConfig,
  ReportResult
} from '../services/dynamicReports';
import authService from '../services/auth';

interface DynamicReportBuilderProps {
  isOpen: boolean;
  onClose: () => void;
  existingReport?: DynamicReport;
}

export default function DynamicReportBuilder({ isOpen, onClose, existingReport }: DynamicReportBuilderProps) {
  const [step, setStep] = useState(1);
  const [reportName, setReportName] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null);
  const [reportType, setReportType] = useState<DynamicReport['type']>('custom');
  const [filters, setFilters] = useState<ReportFilter[]>([]);
  const [columns, setColumns] = useState<ReportColumn[]>([]);
  const [charts, setCharts] = useState<ChartConfig[]>([]);
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const availableTemplates = dynamicReportsService.getTemplates();
      setTemplates(availableTemplates);

      if (existingReport) {
        // Load existing report for editing
        setReportName(existingReport.name);
        setReportDescription(existingReport.description);
        setReportType(existingReport.type);
        setFilters(existingReport.filters);
        setColumns(existingReport.columns);
        setCharts(existingReport.charts);
      } else {
        // Reset for new report
        resetForm();
      }
    }
  }, [isOpen, existingReport]);

  const resetForm = () => {
    setStep(1);
    setReportName('');
    setReportDescription('');
    setSelectedTemplate(null);
    setReportType('custom');
    setFilters([]);
    setColumns([]);
    setCharts([]);
    setPreviewData([]);
    setShowPreview(false);
  };

  const handleTemplateSelect = (template: ReportTemplate) => {
    setSelectedTemplate(template);
    setReportType(template.category === 'compliance' ? 'compliance' : 
                  template.category === 'security' ? 'audit' : 'custom');
    setFilters(template.defaultFilters);
    setColumns(template.defaultColumns);
    setCharts(template.defaultCharts);
  };

  const addFilter = () => {
    setFilters([...filters, {
      field: '',
      operator: 'equals',
      value: '',
      label: ''
    }]);
  };

  const updateFilter = (index: number, field: keyof ReportFilter, value: any) => {
    const updatedFilters = [...filters];
    updatedFilters[index] = { ...updatedFilters[index], [field]: value };
    setFilters(updatedFilters);
  };

  const removeFilter = (index: number) => {
    setFilters(filters.filter((_, i) => i !== index));
  };

  const addColumn = () => {
    setColumns([...columns, {
      key: '',
      label: '',
      type: 'string'
    }]);
  };

  const updateColumn = (index: number, field: keyof ReportColumn, value: any) => {
    const updatedColumns = [...columns];
    updatedColumns[index] = { ...updatedColumns[index], [field]: value };
    setColumns(updatedColumns);
  };

  const removeColumn = (index: number) => {
    setColumns(columns.filter((_, i) => i !== index));
  };

  const addChart = () => {
    setCharts([...charts, {
      type: 'bar',
      xAxis: '',
      yAxis: '',
      title: '',
      showLegend: true
    }]);
  };

  const updateChart = (index: number, field: keyof ChartConfig, value: any) => {
    const updatedCharts = [...charts];
    updatedCharts[index] = { ...updatedCharts[index], [field]: value };
    setCharts(updatedCharts);
  };

  const removeChart = (index: number) => {
    setCharts(charts.filter((_, i) => i !== index));
  };

  const generatePreview = async () => {
    if (!reportName) return;

    setLoading(true);
    try {
      // Create a temporary report for preview
      const tempReport = dynamicReportsService.createReport({
        name: `Preview_${reportName}`,
        description: reportDescription,
        type: reportType,
        template: selectedTemplate || {
          id: 'custom',
          name: 'Custom',
          description: 'Custom report',
          category: 'operational',
          defaultFilters: [],
          defaultColumns: [],
          defaultCharts: []
        },
        filters,
        columns,
        charts,
        createdBy: authService.getCurrentUser()?.email || 'unknown'
      });

      const result = await dynamicReportsService.generateReport(tempReport.id);
      setPreviewData(result.data.slice(0, 10)); // Show only first 10 rows
      setShowPreview(true);

      // Clean up temp report
      dynamicReportsService.deleteReport(tempReport.id);
    } catch (error) {
      console.error('Preview generation failed:', error);
      alert('Failed to generate preview. Please check your configuration.');
    } finally {
      setLoading(false);
    }
  };

  const saveReport = async () => {
    if (!reportName || !reportType) {
      alert('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const reportData = {
        name: reportName,
        description: reportDescription,
        type: reportType,
        template: selectedTemplate || {
          id: 'custom',
          name: 'Custom',
          description: 'Custom report',
          category: 'operational',
          defaultFilters: [],
          defaultColumns: [],
          defaultCharts: []
        },
        filters,
        columns,
        charts,
        createdBy: authService.getCurrentUser()?.email || 'unknown'
      };

      if (existingReport) {
        dynamicReportsService.updateReport(existingReport.id, reportData);
      } else {
        dynamicReportsService.createReport(reportData);
      }

      alert(`Report ${existingReport ? 'updated' : 'created'} successfully!`);
      onClose();
    } catch (error) {
      console.error('Save failed:', error);
      alert('Failed to save report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const availableFields = [
    { key: 'email', label: 'Email', type: 'string' },
    { key: 'tool', label: 'Tool', type: 'string' },
    { key: 'role', label: 'Role', type: 'string' },
    { key: 'status', label: 'Status', type: 'string' },
    { key: 'department', label: 'Department', type: 'string' },
    { key: 'lastLogin', label: 'Last Login', type: 'date' },
    { key: 'permissions', label: 'Permissions', type: 'array' },
    { key: 'timestamp', label: 'Timestamp', type: 'date' },
    { key: 'action', label: 'Action', type: 'string' },
    { key: 'resource', label: 'Resource', type: 'string' },
    { key: 'severity', label: 'Severity', type: 'string' },
    { key: 'riskScore', label: 'Risk Score', type: 'number' },
    { key: 'userEmail', label: 'User Email', type: 'string' },
    { key: 'category', label: 'Category', type: 'string' },
    { key: 'outcome', label: 'Outcome', type: 'string' },
  ];

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-6xl shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-medium text-gray-900">
            {existingReport ? 'Edit' : 'Create'} Dynamic Report
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl"
          >
            ×
          </button>
        </div>

        {/* Step Indicators */}
        <div className="flex mb-8">
          {['Basic Info', 'Filters', 'Columns', 'Charts', 'Preview'].map((stepName, index) => (
            <div key={stepName} className="flex-1">
              <div className="flex items-center">
                <div 
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    step >= index + 1 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
                  }`}
                >
                  {index + 1}
                </div>
                <div className={`flex-1 h-0.5 mx-2 ${index < 4 ? (step > index + 1 ? 'bg-blue-600' : 'bg-gray-300') : ''}`}></div>
              </div>
              <div className="text-xs text-center mt-1">{stepName}</div>
            </div>
          ))}
        </div>

        {/* Step 1: Basic Information */}
        {step === 1 && (
          <div className="space-y-6">
            <h4 className="text-lg font-medium text-gray-900">Report Configuration</h4>
            
            {/* Template Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Choose Template (Optional)
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {templates.map(template => (
                  <div 
                    key={template.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedTemplate?.id === template.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleTemplateSelect(template)}
                  >
                    <h5 className="font-medium text-gray-900">{template.name}</h5>
                    <p className="text-sm text-gray-500 mt-1">{template.description}</p>
                    <span className={`inline-block px-2 py-1 rounded text-xs mt-2 ${
                      template.category === 'compliance' ? 'bg-red-100 text-red-800' :
                      template.category === 'security' ? 'bg-yellow-100 text-yellow-800' :
                      template.category === 'operational' ? 'bg-green-100 text-green-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {template.category}
                    </span>
                  </div>
                ))}
                <div 
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    !selectedTemplate ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedTemplate(null)}
                >
                  <h5 className="font-medium text-gray-900">Custom Report</h5>
                  <p className="text-sm text-gray-500 mt-1">Build from scratch</p>
                  <span className="inline-block px-2 py-1 rounded text-xs mt-2 bg-purple-100 text-purple-800">
                    custom
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Report Name *
                </label>
                <input
                  type="text"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  value={reportName}
                  onChange={(e) => setReportName(e.target.value)}
                  placeholder="Enter report name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Report Type *
                </label>
                <select
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value as DynamicReport['type'])}
                >
                  <option value="custom">Custom</option>
                  <option value="user_access">User Access</option>
                  <option value="compliance">Compliance</option>
                  <option value="audit">Audit</option>
                  <option value="risk_assessment">Risk Assessment</option>
                  <option value="activity">Activity</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                rows={3}
                value={reportDescription}
                onChange={(e) => setReportDescription(e.target.value)}
                placeholder="Describe what this report will show..."
              />
            </div>
          </div>
        )}

        {/* Step 2: Filters */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h4 className="text-lg font-medium text-gray-900">Configure Filters</h4>
              <button
                onClick={addFilter}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Add Filter
              </button>
            </div>

            {filters.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No filters configured. Click "Add Filter" to start.
              </div>
            ) : (
              <div className="space-y-4">
                {filters.map((filter, index) => (
                  <div key={index} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <select
                        className="w-full border border-gray-300 rounded-md p-2"
                        value={filter.field}
                        onChange={(e) => updateFilter(index, 'field', e.target.value)}
                      >
                        <option value="">Select Field</option>
                        {availableFields.map(field => (
                          <option key={field.key} value={field.key}>{field.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex-1">
                      <select
                        className="w-full border border-gray-300 rounded-md p-2"
                        value={filter.operator}
                        onChange={(e) => updateFilter(index, 'operator', e.target.value)}
                      >
                        <option value="equals">Equals</option>
                        <option value="contains">Contains</option>
                        <option value="greater_than">Greater Than</option>
                        <option value="less_than">Less Than</option>
                        <option value="between">Between</option>
                        <option value="in">In List</option>
                      </select>
                    </div>
                    <div className="flex-1">
                      <input
                        type="text"
                        className="w-full border border-gray-300 rounded-md p-2"
                        value={filter.value}
                        onChange={(e) => updateFilter(index, 'value', e.target.value)}
                        placeholder="Filter value"
                      />
                    </div>
                    <div className="flex-1">
                      <input
                        type="text"
                        className="w-full border border-gray-300 rounded-md p-2"
                        value={filter.label}
                        onChange={(e) => updateFilter(index, 'label', e.target.value)}
                        placeholder="Filter label"
                      />
                    </div>
                    <button
                      onClick={() => removeFilter(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 3: Columns */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h4 className="text-lg font-medium text-gray-900">Configure Columns</h4>
              <button
                onClick={addColumn}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Add Column
              </button>
            </div>

            {columns.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No columns configured. Click "Add Column" to start.
              </div>
            ) : (
              <div className="space-y-4">
                {columns.map((column, index) => (
                  <div key={index} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <select
                        className="w-full border border-gray-300 rounded-md p-2"
                        value={column.key}
                        onChange={(e) => updateColumn(index, 'key', e.target.value)}
                      >
                        <option value="">Select Field</option>
                        {availableFields.map(field => (
                          <option key={field.key} value={field.key}>{field.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex-1">
                      <input
                        type="text"
                        className="w-full border border-gray-300 rounded-md p-2"
                        value={column.label}
                        onChange={(e) => updateColumn(index, 'label', e.target.value)}
                        placeholder="Column label"
                      />
                    </div>
                    <div className="flex-1">
                      <select
                        className="w-full border border-gray-300 rounded-md p-2"
                        value={column.type}
                        onChange={(e) => updateColumn(index, 'type', e.target.value)}
                      >
                        <option value="string">Text</option>
                        <option value="number">Number</option>
                        <option value="date">Date</option>
                        <option value="boolean">Boolean</option>
                        <option value="array">Array</option>
                      </select>
                    </div>
                    <div className="flex-1">
                      <select
                        className="w-full border border-gray-300 rounded-md p-2"
                        value={column.aggregation || ''}
                        onChange={(e) => updateColumn(index, 'aggregation', e.target.value || undefined)}
                      >
                        <option value="">No Aggregation</option>
                        <option value="count">Count</option>
                        <option value="sum">Sum</option>
                        <option value="average">Average</option>
                        <option value="min">Minimum</option>
                        <option value="max">Maximum</option>
                      </select>
                    </div>
                    <button
                      onClick={() => removeColumn(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 4: Charts */}
        {step === 4 && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h4 className="text-lg font-medium text-gray-900">Configure Charts</h4>
              <button
                onClick={addChart}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Add Chart
              </button>
            </div>

            {charts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No charts configured. Click "Add Chart" to start.
              </div>
            ) : (
              <div className="space-y-4">
                {charts.map((chart, index) => (
                  <div key={index} className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Chart Type</label>
                      <select
                        className="w-full border border-gray-300 rounded-md p-2"
                        value={chart.type}
                        onChange={(e) => updateChart(index, 'type', e.target.value)}
                      >
                        <option value="bar">Bar Chart</option>
                        <option value="line">Line Chart</option>
                        <option value="pie">Pie Chart</option>
                        <option value="donut">Donut Chart</option>
                        <option value="area">Area Chart</option>
                        <option value="scatter">Scatter Plot</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Chart Title</label>
                      <input
                        type="text"
                        className="w-full border border-gray-300 rounded-md p-2"
                        value={chart.title}
                        onChange={(e) => updateChart(index, 'title', e.target.value)}
                        placeholder="Chart title"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">X-Axis Field</label>
                      <select
                        className="w-full border border-gray-300 rounded-md p-2"
                        value={chart.xAxis}
                        onChange={(e) => updateChart(index, 'xAxis', e.target.value)}
                      >
                        <option value="">Select Field</option>
                        {availableFields.map(field => (
                          <option key={field.key} value={field.key}>{field.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Y-Axis Field</label>
                      <select
                        className="w-full border border-gray-300 rounded-md p-2"
                        value={chart.yAxis}
                        onChange={(e) => updateChart(index, 'yAxis', e.target.value)}
                      >
                        <option value="">Select Field</option>
                        <option value="count">Count</option>
                        {availableFields.filter(field => field.type === 'number').map(field => (
                          <option key={field.key} value={field.key}>{field.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-2 flex justify-between items-center">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          className="mr-2"
                          checked={chart.showLegend}
                          onChange={(e) => updateChart(index, 'showLegend', e.target.checked)}
                        />
                        Show Legend
                      </label>
                      <button
                        onClick={() => removeChart(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Remove Chart
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 5: Preview */}
        {step === 5 && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h4 className="text-lg font-medium text-gray-900">Report Preview</h4>
              <button
                onClick={generatePreview}
                disabled={loading}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? 'Generating...' : 'Generate Preview'}
              </button>
            </div>

            {showPreview && previewData.length > 0 && (
              <div className="bg-white border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        {Object.keys(previewData[0]).map(key => (
                          <th key={key} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {key}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {previewData.map((row, index) => (
                        <tr key={index}>
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
                <div className="px-6 py-3 bg-gray-50 text-sm text-gray-500">
                  Showing first 10 rows of preview data
                </div>
              </div>
            )}

            {showPreview && previewData.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No data available with current filters
              </div>
            )}
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8 pt-6 border-t">
          <div>
            {step > 1 && (
              <button
                onClick={() => setStep(step - 1)}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
              >
                Previous
              </button>
            )}
          </div>
          <div className="space-x-2">
            {step < 5 ? (
              <button
                onClick={() => setStep(step + 1)}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Next
              </button>
            ) : (
              <button
                onClick={saveReport}
                disabled={loading || !reportName}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? 'Saving...' : existingReport ? 'Update Report' : 'Create Report'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
