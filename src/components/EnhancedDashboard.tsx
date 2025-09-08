import React, { useState, useEffect } from 'react';
import { 
  Users, AlertTriangle, CheckCircle, Shield, TrendingUp, 
  Clock, FileText, BarChart3, Activity, Lock, Eye, 
  Download, Filter, Calendar, AlertCircle, CheckSquare 
} from 'lucide-react';
import AuthService from '../services/auth';
import AuditService from '../services/audit';
import PolicyService from '../services/policy';

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  exitedUsers: number;
  flaggedAccounts: number;
  nonOrgUsers: number;
  totalTools: number;
  connectedTools: number;
  pendingReviews: number;
  policyViolations: number;
  auditEvents: number;
  riskScore: number;
}

interface RecentActivity {
  id: string;
  type: 'LOGIN' | 'ACCESS_REVIEW' | 'POLICY_VIOLATION' | 'TOOL_UPDATE' | 'USER_ACTION';
  description: string;
  timestamp: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  user: string;
}

interface RiskIndicator {
  level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  score: number;
  factors: string[];
}

export default function EnhancedDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeUsers: 0,
    exitedUsers: 0,
    flaggedAccounts: 0,
    nonOrgUsers: 0,
    totalTools: 0,
    connectedTools: 0,
    pendingReviews: 0,
    policyViolations: 0,
    auditEvents: 0,
    riskScore: 0,
  });

  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [riskIndicator, setRiskIndicator] = useState<RiskIndicator>({
    level: 'LOW',
    score: 0,
    factors: [],
  });

  const [selectedTimeRange, setSelectedTimeRange] = useState('7d');
  const [isLoading, setIsLoading] = useState(true);

  const authService = AuthService; // default export is an instance
  const auditService = AuditService; // default export is an instance
  const policyService = PolicyService; // default export is an instance

  useEffect(() => {
    loadDashboardData();
  }, [selectedTimeRange]);

  const loadDashboardData = async () => {
    setIsLoading(true);
    
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Load audit statistics
      const auditStats = auditService.getAuditStatistics();
      const violations = policyService.getViolations();
      const openViolations = violations.filter(v => v.status === 'OPEN');

      // Calculate risk score
      const riskScore = calculateRiskScore(auditStats, openViolations);
      const riskLevel = getRiskLevel(riskScore);

      setStats({
        totalUsers: 156,
        activeUsers: 142,
        exitedUsers: 14,
        flaggedAccounts: 8,
        nonOrgUsers: 12,
        totalTools: 45,
        connectedTools: 38,
        pendingReviews: 23,
        policyViolations: openViolations.length,
        auditEvents: auditStats.totalEvents,
        riskScore,
      });

      setRiskIndicator({
        level: riskLevel,
        score: riskScore,
        factors: getRiskFactors(auditStats, openViolations),
      });

      // Load recent activity
      const recentEvents = auditService.getAuditEvents({ limit: 10 });
      const activities: RecentActivity[] = recentEvents.map(event => ({
        id: event.id,
        type: mapEventToActivityType(event.action),
        description: event.details,
        timestamp: event.timestamp,
        severity: event.severity,
        user: event.userEmail,
      }));

      setRecentActivity(activities);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateRiskScore = (auditStats: any, violations: any[]): number => {
    let score = 0;

    // Base score from audit events
    const highSeverityEvents = Object.entries(auditStats.eventsBySeverity)
      .reduce((acc, [severity, count]) => {
        if (severity === 'HIGH') acc += (count as number) * 3;
        if (severity === 'CRITICAL') acc += (count as number) * 5;
        return acc;
      }, 0);

    score += highSeverityEvents;

    // Add violation scores
    const violationScores = violations.reduce((acc, violation) => {
      if (violation.severity === 'HIGH') acc += 3;
      if (violation.severity === 'CRITICAL') acc += 5;
      return acc;
    }, 0);

    score += violationScores;

    // Normalize to 0-100 scale
    return Math.min(Math.round((score / 50) * 100), 100);
  };

  const getRiskLevel = (score: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' => {
    if (score >= 80) return 'CRITICAL';
    if (score >= 60) return 'HIGH';
    if (score >= 30) return 'MEDIUM';
    return 'LOW';
  };

  const getRiskFactors = (auditStats: any, violations: any[]): string[] => {
    const factors: string[] = [];

    if (auditStats.eventsBySeverity.CRITICAL > 0) {
      factors.push(`${auditStats.eventsBySeverity.CRITICAL} critical security events`);
    }
    if (violations.filter(v => v.severity === 'CRITICAL').length > 0) {
      factors.push(`${violations.filter(v => v.severity === 'CRITICAL').length} critical policy violations`);
    }
    if (auditStats.eventsByOutcome.FAILURE > 10) {
      factors.push('High number of failed operations');
    }
    if (stats.nonOrgUsers > 10) {
      factors.push('Multiple external users with access');
    }

    return factors;
  };

  const mapEventToActivityType = (action: string): RecentActivity['type'] => {
    if (action.includes('LOGIN')) return 'LOGIN';
    if (action.includes('ACCESS_REVIEW')) return 'ACCESS_REVIEW';
    if (action.includes('POLICY_VIOLATION')) return 'POLICY_VIOLATION';
    if (action.includes('TOOL')) return 'TOOL_UPDATE';
    return 'USER_ACTION';
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'LOW': return 'text-green-600 bg-green-100';
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-100';
      case 'HIGH': return 'text-orange-600 bg-orange-100';
      case 'CRITICAL': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'LOW': return 'text-green-600';
      case 'MEDIUM': return 'text-yellow-600';
      case 'HIGH': return 'text-orange-600';
      case 'CRITICAL': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getActivityIcon = (type: RecentActivity['type']) => {
    switch (type) {
      case 'LOGIN': return <Lock className="h-4 w-4" />;
      case 'ACCESS_REVIEW': return <Eye className="h-4 w-4" />;
      case 'POLICY_VIOLATION': return <AlertCircle className="h-4 w-4" />;
      case 'TOOL_UPDATE': return <CheckSquare className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">IGA Dashboard</h2>
          <p className="text-gray-600 mt-1">Identity Governance and Administration Overview</p>
        </div>
        <div className="flex items-center space-x-4 mt-4 lg:mt-0">
          <select
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="24h">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          {authService.hasPermission('audit:export') && (
            <button className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-md font-medium flex items-center space-x-2">
              <Download className="h-4 w-4" />
              <span>Export Report</span>
            </button>
          )}
        </div>
      </div>

      {/* Risk Indicator */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Security Risk Assessment</h3>
            <p className="text-sm text-gray-600 mt-1">Current risk level based on recent activities</p>
          </div>
          <div className="text-right">
            <div className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getRiskColor(riskIndicator.level)}`}>
              {riskIndicator.level} RISK
            </div>
            <div className="text-2xl font-bold text-gray-900 mt-1">{riskIndicator.score}/100</div>
          </div>
        </div>
        
        {riskIndicator.factors.length > 0 && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Risk Factors:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              {riskIndicator.factors.map((factor, index) => (
                <li key={index} className="flex items-center">
                  <AlertTriangle className="h-4 w-4 text-orange-500 mr-2" />
                  {factor}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-blue-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
              <p className="text-xs text-gray-500">{stats.activeUsers} active</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <AlertTriangle className="h-8 w-8 text-red-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Exited Users</p>
              <p className="text-2xl font-bold text-red-600">{stats.exitedUsers}</p>
              <p className="text-xs text-gray-500">{stats.flaggedAccounts} flagged</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <Shield className="h-8 w-8 text-green-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Connected Tools</p>
              <p className="text-2xl font-bold text-green-600">{stats.connectedTools}</p>
              <p className="text-xs text-gray-500">of {stats.totalTools} total</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <FileText className="h-8 w-8 text-purple-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Policy Violations</p>
              <p className="text-2xl font-bold text-purple-600">{stats.policyViolations}</p>
              <p className="text-xs text-gray-500">open violations</p>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Access Reviews</h3>
            <Clock className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Pending Reviews</span>
              <span className="text-sm font-medium text-orange-600">{stats.pendingReviews}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">External Users</span>
              <span className="text-sm font-medium text-red-600">{stats.nonOrgUsers}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Audit Events</span>
              <span className="text-sm font-medium text-blue-600">{stats.auditEvents}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Compliance Status</h3>
            <CheckCircle className="h-5 w-5 text-green-500" />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">SOX Compliance</span>
              <span className="text-sm font-medium text-green-600">98%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">GDPR Compliance</span>
              <span className="text-sm font-medium text-green-600">95%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">ISO 27001</span>
              <span className="text-sm font-medium text-yellow-600">87%</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
            <Activity className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-3 max-h-48 overflow-y-auto">
            {recentActivity.slice(0, 5).map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3">
                <div className={`mt-1 ${getSeverityColor(activity.severity)}`}>
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 truncate">{activity.description}</p>
                  <p className="text-xs text-gray-500">
                    {activity.user} • {new Date(activity.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      {authService.hasAnyPermission(['access:create', 'access:read', 'tool:read']) && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {authService.hasPermission('access:create') && (
              <button className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-3 rounded-md font-medium flex items-center justify-center space-x-2">
                <Eye className="h-4 w-4" />
                <span>Start Access Review</span>
              </button>
            )}
            {authService.hasPermission('audit:read') && (
              <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-3 rounded-md font-medium flex items-center justify-center space-x-2">
                <BarChart3 className="h-4 w-4" />
                <span>View Audit Logs</span>
              </button>
            )}
            {authService.hasPermission('policy:read') && (
              <button className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-3 rounded-md font-medium flex items-center justify-center space-x-2">
                <Shield className="h-4 w-4" />
                <span>Policy Violations</span>
              </button>
            )}
            {authService.hasPermission('tool:read') && (
              <button className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-3 rounded-md font-medium flex items-center justify-center space-x-2">
                <CheckSquare className="h-4 w-4" />
                <span>Tool Status</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
