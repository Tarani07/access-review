import React, { useState, useEffect } from 'react';
import { Lock, User, Eye, EyeOff, Smartphone, AlertCircle, CheckCircle } from 'lucide-react';
import AuthService from '../services/auth';
import SurveySparrowLogo from './SurveySparrowLogo';

interface LoginFormProps {
  onLogin: (credentials: { username: string; password: string; mfaCode?: string; rememberMe?: boolean }) => void;
  isLoading: boolean;
}

export default function LoginForm({ onLogin, isLoading }: LoginFormProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginStep, setLoginStep] = useState<'credentials' | 'success'>('credentials');
  const [error, setError] = useState('');
  const [securityTips, setSecurityTips] = useState<string[]>([]);

  useEffect(() => {
    // Load security tips
    setSecurityTips([
      'Use strong, unique passwords for all accounts',
      'Enable multi-factor authentication when available',
      'Never share your login credentials with others',
      'Log out from shared or public computers',
      'Report suspicious activity immediately'
    ]);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (loginStep === 'credentials') {
      // Validate credentials first
      if (!username || !password) {
        setError('Please enter both username and password');
        return;
      }

      // Simulate credential validation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      onLogin({ username, password, rememberMe });
    }
  };

  const handleBackToCredentials = () => {
    setLoginStep('credentials');
    setMfaCode('');
    setError('');
  };

  const handleResendMfa = () => {
    // Simulate resending MFA code
    setError('');
    // In real app, this would trigger MFA code resend
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center">
            <SurveySparrowLogo width={48} height={48} />
          </div>
          <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
            SparrowVision IGA Portal
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Identity Governance & Administration System
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {loginStep === 'credentials' && (
            <>
              <div className="space-y-4">
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                    Email Address
                  </label>
                  <div className="mt-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="username"
                      name="username"
                      type="email"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="appearance-none relative block w-full pl-10 pr-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 focus:z-10 sm:text-sm"
                      placeholder="admin@surveysparrow.com"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <div className="mt-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="appearance-none relative block w-full pl-10 pr-10 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 focus:z-10 sm:text-sm"
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                    Remember me for 30 days
                  </label>
                </div>
                <div className="text-sm">
                  <a href="#" className="font-medium text-emerald-600 hover:text-emerald-500">
                    Forgot your password?
                  </a>
                </div>
              </div>
            </>
          )}

          {/* MFA step removed */}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                'Sign In'
              )}
            </button>
          </div>
        </form>

        {/* Security Tips */}
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <h4 className="text-sm font-medium text-blue-900 mb-2">Security Tips</h4>
          <ul className="text-xs text-blue-800 space-y-1">
            {securityTips.map((tip, index) => (
              <li key={index} className="flex items-start">
                <CheckCircle className="h-3 w-3 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
                {tip}
              </li>
            ))}
          </ul>
        </div>
        
        <div className="text-center">
          <p className="text-xs text-gray-500">
            Powered by Sparrow IT • Made with Passion @ SurveySparrow
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Demo credentials: admin@surveysparrow.com / password / 123456
          </p>
        </div>
      </div>
    </div>
  );
}