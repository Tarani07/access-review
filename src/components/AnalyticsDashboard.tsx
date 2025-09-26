import React, { useState, useEffect } from 'react';
import {
  Users,
  Shield,
  AlertTriangle,
  Activity,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Settings,
  Download,
  Calendar,
  ChevronDown
} from 'lucide-react';

interface MetricCard {
  title: string;
  value: string;
  change: number;
  changeText: string;
  icon: React.ComponentType<any>;
  color: string;
  trend: 'up' | 'down';
}

interface ChartData {
  name: string;
  value: number;
  color: string;
  percentage: number;
}

interface DeviceData {
  name: string;
  count: number;
  dayChange: number;
  weekChange: number;
  color: string;
}

export default function AnalyticsDashboard() {
  const [timeRange, setTimeRange] = useState('Today: May 31');
  const [isLoading, setIsLoading] = useState(true);

  // Simulate data loading
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  // Mock data - in production, this would come from API
  const metrics: MetricCard[] = [
    {
      title: 'Total Users',
      value: '2.4k',
      change: 12.5,
      changeText: 'New Users Today',
      icon: Users,
      color: 'text-blue-500',
      trend: 'up'
    },
    {
      title: 'Risk Score',
      value: '23.8',
      change: -8.2,
      changeText: 'Risk Reduction Weekly',
      icon: Shield,
      color: 'text-emerald-500',
      trend: 'down'
    },
    {
      title: 'Active Reviews',
      value: '147',
      change: 24.1,
      changeText: 'Reviews This Month',
      icon: Eye,
      color: 'text-purple-500',
      trend: 'up'
    },
    {
      title: 'High Risk Users',
      value: '89',
      change: -15.3,
      changeText: 'Risk Users Weekly',
      icon: AlertTriangle,
      color: 'text-red-500',
      trend: 'down'
    }
  ];

  const accessByTool: ChartData[] = [
    { name: 'JumpCloud', value: 847, color: '#3b82f6', percentage: 35 },
    { name: 'Slack', value: 623, color: '#10b981', percentage: 26 },
    { name: 'GitHub', value: 421, color: '#8b5cf6', percentage: 17 },
    { name: 'HubSpot', value: 318, color: '#f59e0b', percentage: 13 },
    { name: 'Zendesk', value: 215, color: '#ef4444', percentage: 9 }
  ];

  const riskCategories: DeviceData[] = [
    { name: 'Low Risk', count: 1847, dayChange: -2, weekChange: -1, color: '#10b981' },
    { name: 'Medium Risk', count: 423, dayChange: -5, weekChange: -3, color: '#f59e0b' },
    { name: 'High Risk', count: 89, dayChange: -12, weekChange: -15, color: '#ef4444' }
  ];

  const getMaxValue = () => Math.max(...accessByTool.map(item => item.percentage));

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white font-['Inter',sans-serif] p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <button className="lg:hidden p-2 rounded-lg hover:bg-gray-800">
            <div className="w-6 h-6 flex flex-col justify-center space-y-1">
              <div className="w-6 h-0.5 bg-white"></div>
              <div className="w-6 h-0.5 bg-white"></div>
              <div className="w-6 h-0.5 bg-white"></div>
            </div>
          </button>
          
          <div>
            <h1 className="text-3xl font-bold">Analytics</h1>
            <div className="flex items-center space-x-2 text-gray-400 text-sm mt-1">
              <span>Dashboard</span>
              <span>/</span>
              <span>Analytics</span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="relative">
            <button className="bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg flex items-center space-x-2 text-sm transition-colors">
              <Calendar className="h-4 w-4" />
              <span>{timeRange}</span>
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>
          
          <button className="bg-emerald-500 hover:bg-emerald-600 px-4 py-2 rounded-lg flex items-center space-x-2 text-sm font-medium transition-colors">
            <Download className="h-4 w-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {metrics.map((metric, index) => (
          <div key={index} className="bg-gray-800 rounded-2xl p-6 border border-gray-700 hover:border-gray-600 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg bg-gray-700 ${metric.color}`}>
                  <metric.icon className="h-5 w-5" />
                </div>
                <span className="text-gray-400 text-sm font-medium">{metric.title}</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="text-3xl font-bold">{metric.value}</div>
              <div className="flex items-center space-x-2">
                {metric.trend === 'up' ? (
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-emerald-500" />
                )}
                <span className="text-emerald-500 text-sm font-medium">
                  {Math.abs(metric.change)}%
                </span>
                <span className="text-gray-400 text-sm">{metric.changeText}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Access By Tool */}
        <div className="xl:col-span-2 bg-gray-800 rounded-2xl p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Access By Integration</h2>
            <div className="flex space-x-4 text-sm text-gray-400">
              {accessByTool.map((item, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  ></div>
                  <span>{item.name}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            {accessByTool.map((item, index) => (
              <div key={index} className="flex items-center space-x-4">
                <div className="w-16 text-right text-sm text-gray-400">
                  {item.percentage}%
                </div>
                <div className="flex-1 bg-gray-700 rounded-full h-12 relative overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-1000 ease-out flex items-center justify-end pr-4"
                    style={{
                      backgroundColor: item.color,
                      width: `${(item.percentage / getMaxValue()) * 100}%`
                    }}
                  >
                    <span className="text-white text-sm font-medium">
                      {item.value.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Risk Distribution */}
        <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Risk Distribution</h2>
            <button className="text-gray-400 hover:text-white text-sm flex items-center space-x-1">
              <span>All</span>
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>

          {/* Donut Chart Center */}
          <div className="flex items-center justify-center mb-8">
            <div className="relative">
              <svg width="120" height="120" className="transform -rotate-90">
                <circle
                  cx="60"
                  cy="60"
                  r="45"
                  stroke="currentColor"
                  strokeWidth="10"
                  fill="none"
                  className="text-gray-700"
                />
                <circle
                  cx="60"
                  cy="60"
                  r="45"
                  stroke="#10b981"
                  strokeWidth="10"
                  fill="none"
                  strokeDasharray={`${(1847 / 2359) * 283} 283`}
                  className="transition-all duration-1000"
                />
                <circle
                  cx="60"
                  cy="60"
                  r="45"
                  stroke="#f59e0b"
                  strokeWidth="10"
                  fill="none"
                  strokeDasharray={`${(423 / 2359) * 283} 283`}
                  strokeDashoffset={`-${(1847 / 2359) * 283}`}
                  className="transition-all duration-1000"
                />
                <circle
                  cx="60"
                  cy="60"
                  r="45"
                  stroke="#ef4444"
                  strokeWidth="10"
                  fill="none"
                  strokeDasharray={`${(89 / 2359) * 283} 283`}
                  strokeDashoffset={`-${((1847 + 423) / 2359) * 283}`}
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-2xl font-bold">30</div>
                  <div className="text-gray-400 text-sm">Days</div>
                </div>
              </div>
            </div>
          </div>

          {/* Risk Table */}
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4 text-sm text-gray-400 font-medium border-b border-gray-700 pb-2">
              <span></span>
              <span className="text-center">Day</span>
              <span className="text-center">Week</span>
            </div>
            
            {riskCategories.map((category, index) => (
              <div key={index} className="grid grid-cols-3 gap-4 items-center py-2">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: category.color }}
                  ></div>
                  <div>
                    <div className="font-medium text-sm">{category.name}</div>
                    <div className="text-gray-400 text-xs">{category.count.toLocaleString()}</div>
                  </div>
                </div>
                <div className="text-center">
                  <span className={`text-sm ${category.dayChange < 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                    {category.dayChange}
                  </span>
                </div>
                <div className="text-center">
                  <span className={`text-sm ${category.weekChange < 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                    {category.weekChange}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Additional Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mt-8">
        <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
          <div className="flex items-center space-x-3 mb-3">
            <Activity className="h-5 w-5 text-emerald-500" />
            <span className="text-gray-400 text-sm">Active Integrations</span>
          </div>
          <div className="text-2xl font-bold">24</div>
          <div className="text-emerald-500 text-sm">+3 this week</div>
        </div>

        <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
          <div className="flex items-center space-x-3 mb-3">
            <CheckCircle className="h-5 w-5 text-blue-500" />
            <span className="text-gray-400 text-sm">Completed Reviews</span>
          </div>
          <div className="text-2xl font-bold">156</div>
          <div className="text-blue-500 text-sm">94% completion rate</div>
        </div>

        <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
          <div className="flex items-center space-x-3 mb-3">
            <Clock className="h-5 w-5 text-yellow-500" />
            <span className="text-gray-400 text-sm">Avg Review Time</span>
          </div>
          <div className="text-2xl font-bold">4.2h</div>
          <div className="text-yellow-500 text-sm">-1.3h improvement</div>
        </div>

        <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
          <div className="flex items-center space-x-3 mb-3">
            <XCircle className="h-5 w-5 text-red-500" />
            <span className="text-gray-400 text-sm">Access Violations</span>
          </div>
          <div className="text-2xl font-bold">3</div>
          <div className="text-red-500 text-sm">-12 from last month</div>
        </div>
      </div>
    </div>
  );
}
