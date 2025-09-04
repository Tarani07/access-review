import React, { useState, useEffect } from 'react';
import { Shield, AlertTriangle, Lock } from 'lucide-react';

interface AccessControlGateProps {
  children: React.ReactNode;
  currentUser: string;
}

export default function AccessControlGate({ children, currentUser }: AccessControlGateProps) {
  const [hasAccess, setHasAccess] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  // Authorized IT admin emails
  const authorizedEmails = [
    'admin@surveysparrow.com',
    'it@surveysparrow.com',
    'security@surveysparrow.com',
    'admin', // For demo purposes
    // Add more authorized emails here
  ];

  useEffect(() => {
    // Simulate access check
    const checkAccess = async () => {
      setIsChecking(true);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const userHasAccess = authorizedEmails.includes(currentUser.toLowerCase());
      setHasAccess(userHasAccess);
      setIsChecking(false);
    };

    checkAccess();
  }, [currentUser]);

  if (isChecking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying access permissions...</p>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-red-100 mb-6">
            <Lock className="h-8 w-8 text-red-600" />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Restricted</h2>
          
          <div className="space-y-4 text-left">
            <div className="flex items-start space-x-3 p-3 bg-red-50 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-800">Unauthorized Access</p>
                <p className="text-sm text-red-700">
                  You don't have permission to access the Access Review Tool.
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
              <Shield className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-blue-800">IT Admin Access Required</p>
                <p className="text-sm text-blue-700">
                  This tool is restricted to authorized IT administrators only.
                </p>
              </div>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">
              <strong>Current User:</strong> {currentUser}
            </p>
            <p className="text-xs text-gray-500">
              Contact your IT administrator if you believe you should have access.
            </p>
          </div>
          
          <button
            onClick={() => window.location.reload()}
            className="mt-6 w-full bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-md font-medium transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}