import React, { useState, useRef } from 'react';
import { Upload, Download, FileText, Users, AlertTriangle, CheckCircle, X, RefreshCw, Eye, EyeOff, Trash2, Plus } from 'lucide-react';

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
}

interface ComparisonResult {
  matched: UserData[];
  unmatched: UserData[];
  duplicates: UserData[];
  flagged: UserData[];
}

interface CSVComparisonProps {
  toolName: string;
  onComparisonComplete: (results: ComparisonResult) => void;
  onClose: () => void;
}

export default function CSVComparison({ toolName, onComparisonComplete, onClose }: CSVComparisonProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [userListFile, setUserListFile] = useState<File | null>(null);
  const [exitUsersFile, setExitUsersFile] = useState<File | null>(null);
  const [userListData, setUserListData] = useState<UserData[]>([]);
  const [exitUsersData, setExitUsersData] = useState<UserData[]>([]);
  const [comparisonResults, setComparisonResults] = useState<ComparisonResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseCSV = (csvText: string): UserData[] => {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const data: UserData[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      if (values.length !== headers.length) continue;

      const user: UserData = {
        id: `user-${Date.now()}-${i}`,
        email: values[headers.indexOf('email')] || values[0] || '',
      };

      // Map other fields if they exist
      if (headers.includes('name')) user.name = values[headers.indexOf('name')];
      if (headers.includes('role')) user.role = values[headers.indexOf('role')];
      if (headers.includes('department')) user.department = values[headers.indexOf('department')];
      if (headers.includes('status')) user.status = values[headers.indexOf('status')];
      if (headers.includes('lastlogin')) user.lastLogin = values[headers.indexOf('lastlogin')];
      if (headers.includes('permissions')) user.permissions = values[headers.indexOf('permissions')]?.split(';') || [];
      if (headers.includes('manager')) user.manager = values[headers.indexOf('manager')];
      if (headers.includes('joindate')) user.joinDate = values[headers.indexOf('joindate')];

      if (user.email) {
        data.push(user);
      }
    }

    return data;
  };

  const handleFileUpload = (file: File, type: 'userList' | 'exitUsers') => {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setError('Please upload a CSV file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const csvText = e.target?.result as string;
        const parsedData = parseCSV(csvText);
        
        if (parsedData.length === 0) {
          setError('No valid user data found in CSV file');
          return;
        }

        if (type === 'userList') {
          setUserListFile(file);
          setUserListData(parsedData);
        } else {
          setExitUsersFile(file);
          setExitUsersData(parsedData);
        }
        
        setError(null);
      } catch (err) {
        setError('Error parsing CSV file');
      }
    };
    reader.readAsText(file);
  };

  const performComparison = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      // Use backend API for comparison analysis
      const response = await fetch(`${API_CONFIG.baseURL}/api/csv/compare`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken') || 'demo-token'}`
        },
        body: JSON.stringify({
          userList: userListData,
          exitUsers: exitUsersData,
          toolName: toolName
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Analysis failed: ${response.status}`);
      }

      const data = await response.json();
      const results: ComparisonResult = {
        matched: data.results.matched || [],
        unmatched: data.results.unmatched || [],
        duplicates: data.results.duplicates || [],
        flagged: data.results.flagged || []
      };

      setComparisonResults(results);
      setCurrentStep(3);
    } catch (err) {
      setError(`Error performing comparison: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const exportResults = (type: 'matched' | 'unmatched' | 'duplicates' | 'flagged' | 'all') => {
    let dataToExport: UserData[] = [];
    let filename = '';

    switch (type) {
      case 'matched':
        dataToExport = comparisonResults?.matched || [];
        filename = `${toolName}_matched_users.csv`;
        break;
      case 'unmatched':
        dataToExport = comparisonResults?.unmatched || [];
        filename = `${toolName}_unmatched_users.csv`;
        break;
      case 'duplicates':
        dataToExport = comparisonResults?.duplicates || [];
        filename = `${toolName}_duplicate_users.csv`;
        break;
      case 'flagged':
        dataToExport = comparisonResults?.flagged || [];
        filename = `${toolName}_flagged_users.csv`;
        break;
      case 'all':
        dataToExport = userListData;
        filename = `${toolName}_all_users.csv`;
        break;
    }

    const csv = [
      ['Email', 'Name', 'Role', 'Department', 'Status', 'Last Login', 'Permissions', 'Manager', 'Join Date'],
      ...dataToExport.map(user => [
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
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const resetComparison = () => {
    setCurrentStep(1);
    setUserListFile(null);
    setExitUsersFile(null);
    setUserListData([]);
    setExitUsersData([]);
    setComparisonResults(null);
    setError(null);
    setShowPreview(false);
  };

  const completeComparison = () => {
    if (comparisonResults) {
      onComparisonComplete(comparisonResults);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            CSV User Comparison - {toolName}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          {/* Progress Steps */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center space-x-4">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                currentStep >= 1 ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                1
              </div>
              <div className={`w-16 h-1 ${currentStep >= 2 ? 'bg-emerald-500' : 'bg-gray-200'}`}></div>
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                currentStep >= 2 ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                2
              </div>
              <div className={`w-16 h-1 ${currentStep >= 3 ? 'bg-emerald-500' : 'bg-gray-200'}`}></div>
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                currentStep >= 3 ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                3
              </div>
            </div>
          </div>

          {/* Step 1: File Upload */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Upload CSV Files</h3>
                <p className="text-gray-600">Upload your user list and exit users CSV files for comparison</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* User List Upload */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">Current User List</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Upload CSV with current users from {toolName}
                  </p>
                  
                  {userListFile ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-center space-x-2 text-green-600">
                        <CheckCircle className="h-5 w-5" />
                        <span className="font-medium">{userListFile.name}</span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {userListData.length} users loaded
                      </p>
                      <button
                        onClick={() => setUserListFile(null)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Remove file
                      </button>
                    </div>
                  ) : (
                    <label className="cursor-pointer bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-md font-medium flex items-center justify-center space-x-2 transition-colors">
                      <Upload className="h-4 w-4" />
                      <span>Choose File</span>
                      <input
                        type="file"
                        accept=".csv"
                        onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'userList')}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

                {/* Exit Users Upload */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <AlertTriangle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">Exit Users List</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Upload CSV with users who have exited the organization
                  </p>
                  
                  {exitUsersFile ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-center space-x-2 text-green-600">
                        <CheckCircle className="h-5 w-5" />
                        <span className="font-medium">{exitUsersFile.name}</span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {exitUsersData.length} users loaded
                      </p>
                      <button
                        onClick={() => setExitUsersFile(null)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Remove file
                      </button>
                    </div>
                  ) : (
                    <label className="cursor-pointer bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-md font-medium flex items-center justify-center space-x-2 transition-colors">
                      <Upload className="h-4 w-4" />
                      <span>Choose File</span>
                      <input
                        type="file"
                        accept=".csv"
                        onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'exitUsers')}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                    <span className="text-red-700">{error}</span>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setCurrentStep(2)}
                  disabled={!userListFile || !exitUsersFile}
                  className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-md font-medium transition-colors"
                >
                  Next: Preview Data
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Data Preview */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Data Preview</h3>
                <p className="text-gray-600">Review the uploaded data before comparison</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center space-x-2">
                    <Users className="h-5 w-5" />
                    <span>User List ({userListData.length} users)</span>
                  </h4>
                  <div className="max-h-40 overflow-y-auto space-y-2">
                    {userListData.slice(0, 10).map((user, index) => (
                      <div key={index} className="text-sm text-gray-600 bg-white p-2 rounded border">
                        <div className="font-medium">{user.email}</div>
                        {user.name && <div className="text-xs text-gray-500">{user.name}</div>}
                        {user.role && <div className="text-xs text-gray-500">{user.role}</div>}
                      </div>
                    ))}
                    {userListData.length > 10 && (
                      <div className="text-xs text-gray-500 text-center">
                        ... and {userListData.length - 10} more users
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center space-x-2">
                    <AlertTriangle className="h-5 w-5" />
                    <span>Exit Users ({exitUsersData.length} users)</span>
                  </h4>
                  <div className="max-h-40 overflow-y-auto space-y-2">
                    {exitUsersData.slice(0, 10).map((user, index) => (
                      <div key={index} className="text-sm text-gray-600 bg-white p-2 rounded border">
                        <div className="font-medium">{user.email}</div>
                        {user.name && <div className="text-xs text-gray-500">{user.name}</div>}
                      </div>
                    ))}
                    {exitUsersData.length > 10 && (
                      <div className="text-xs text-gray-500 text-center">
                        ... and {exitUsersData.length - 10} more users
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <button
                  onClick={() => setCurrentStep(1)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={performComparison}
                  disabled={isProcessing}
                  className="bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-md font-medium flex items-center space-x-2 transition-colors"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4" />
                      <span>Start Comparison</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Comparison Results */}
          {currentStep === 3 && comparisonResults && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Comparison Results</h3>
                <p className="text-gray-600">Analysis complete! Review the findings below</p>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">{comparisonResults.matched.length}</div>
                  <div className="text-sm text-green-700">Matched Users</div>
                  <div className="text-xs text-green-600">In both lists</div>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">{comparisonResults.unmatched.length}</div>
                  <div className="text-sm text-blue-700">Unmatched Users</div>
                  <div className="text-xs text-blue-600">Need review</div>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-yellow-600">{comparisonResults.duplicates.length}</div>
                  <div className="text-sm text-yellow-700">Duplicates</div>
                  <div className="text-xs text-yellow-600">In user list</div>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-red-600">{comparisonResults.flagged.length}</div>
                  <div className="text-sm text-red-700">Flagged Users</div>
                  <div className="text-xs text-red-600">Admin/Non-org</div>
                </div>
              </div>

              {/* Export Options */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">Export Results</h4>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  <button
                    onClick={() => exportResults('matched')}
                    className="bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded text-sm font-medium transition-colors"
                  >
                    Export Matched
                  </button>
                  <button
                    onClick={() => exportResults('unmatched')}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded text-sm font-medium transition-colors"
                  >
                    Export Unmatched
                  </button>
                  <button
                    onClick={() => exportResults('duplicates')}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-2 rounded text-sm font-medium transition-colors"
                  >
                    Export Duplicates
                  </button>
                  <button
                    onClick={() => exportResults('flagged')}
                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded text-sm font-medium transition-colors"
                  >
                    Export Flagged
                  </button>
                  <button
                    onClick={() => exportResults('all')}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-2 rounded text-sm font-medium transition-colors"
                  >
                    Export All
                  </button>
                </div>
              </div>

              <div className="flex justify-between">
                <button
                  onClick={resetComparison}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium transition-colors"
                >
                  Start Over
                </button>
                <div className="space-x-3">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium transition-colors"
                  >
                    Close
                  </button>
                  <button
                    onClick={completeComparison}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2 rounded-md font-medium transition-colors"
                  >
                    Complete Analysis
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
