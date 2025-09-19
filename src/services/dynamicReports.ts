// Dynamic Reports Service - Advanced Report Generation and Analytics
import { AuditEvent, ComplianceReport } from './audit';
import { UserData, ExitUserData } from './excelExport';

export interface ReportFilter {
  field: string;
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'between' | 'in';
  value: any;
  label: string;
}

export interface ReportColumn {
  key: string;
  label: string;
  type: 'string' | 'number' | 'date' | 'boolean' | 'array';
  aggregation?: 'count' | 'sum' | 'average' | 'min' | 'max';
  format?: string;
}

export interface ChartConfig {
  type: 'line' | 'bar' | 'pie' | 'donut' | 'area' | 'scatter';
  xAxis: string;
  yAxis: string | string[];
  title: string;
  showLegend?: boolean;
  colors?: string[];
}

export interface DynamicReport {
  id: string;
  name: string;
  description: string;
  type: 'user_access' | 'compliance' | 'audit' | 'risk_assessment' | 'activity' | 'custom';
  template: ReportTemplate;
  filters: ReportFilter[];
  columns: ReportColumn[];
  charts: ChartConfig[];
  schedule?: ReportSchedule;
  createdBy: string;
  createdAt: string;
  lastGenerated?: string;
  status: 'active' | 'inactive' | 'draft';
}

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  category: 'compliance' | 'security' | 'operational' | 'executive';
  defaultFilters: ReportFilter[];
  defaultColumns: ReportColumn[];
  defaultCharts: ChartConfig[];
}

export interface ReportSchedule {
  enabled: boolean;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  time: string; // HH:MM format
  recipients: string[];
  format: 'pdf' | 'excel' | 'csv' | 'email';
}

export interface ReportResult {
  id: string;
  reportId: string;
  data: any[];
  summary: {
    totalRecords: number;
    dateRange: { start: string; end: string };
    generatedAt: string;
    filters: ReportFilter[];
  };
  charts: {
    config: ChartConfig;
    data: any[];
  }[];
  insights: string[];
  recommendations: string[];
}

export class DynamicReportsService {
  private static instance: DynamicReportsService;
  private reports: DynamicReport[] = [];
  private templates: ReportTemplate[] = [];
  private reportResults: ReportResult[] = [];

  private constructor() {
    this.loadReports();
    this.loadTemplates();
    this.initializeDefaultTemplates();
  }

  public static getInstance(): DynamicReportsService {
    if (!DynamicReportsService.instance) {
      DynamicReportsService.instance = new DynamicReportsService();
    }
    return DynamicReportsService.instance;
  }

  // Initialize default report templates
  private initializeDefaultTemplates(): void {
    const defaultTemplates: ReportTemplate[] = [
      {
        id: 'user_access_review',
        name: 'User Access Review',
        description: 'Comprehensive user access report for compliance reviews',
        category: 'compliance',
        defaultFilters: [
          { field: 'status', operator: 'equals', value: 'ACTIVE', label: 'Active Users Only' }
        ],
        defaultColumns: [
          { key: 'email', label: 'Email', type: 'string' },
          { key: 'tool', label: 'Tool', type: 'string' },
          { key: 'role', label: 'Role', type: 'string' },
          { key: 'permissions', label: 'Permissions', type: 'array' },
          { key: 'lastLogin', label: 'Last Login', type: 'date' },
          { key: 'department', label: 'Department', type: 'string' }
        ],
        defaultCharts: [
          {
            type: 'pie',
            xAxis: 'tool',
            yAxis: 'count',
            title: 'Users by Tool Distribution',
            showLegend: true
          },
          {
            type: 'bar',
            xAxis: 'department',
            yAxis: 'count',
            title: 'Users by Department',
            showLegend: false
          }
        ]
      },
      {
        id: 'security_audit',
        name: 'Security Audit Report',
        description: 'Security events and risk assessment report',
        category: 'security',
        defaultFilters: [
          { field: 'severity', operator: 'in', value: ['HIGH', 'CRITICAL'], label: 'High Risk Events' }
        ],
        defaultColumns: [
          { key: 'timestamp', label: 'Date/Time', type: 'date' },
          { key: 'userEmail', label: 'User', type: 'string' },
          { key: 'action', label: 'Action', type: 'string' },
          { key: 'resource', label: 'Resource', type: 'string' },
          { key: 'severity', label: 'Severity', type: 'string' },
          { key: 'riskScore', label: 'Risk Score', type: 'number' }
        ],
        defaultCharts: [
          {
            type: 'line',
            xAxis: 'date',
            yAxis: 'riskScore',
            title: 'Risk Trend Over Time',
            showLegend: true
          },
          {
            type: 'donut',
            xAxis: 'severity',
            yAxis: 'count',
            title: 'Events by Severity',
            showLegend: true
          }
        ]
      },
      {
        id: 'compliance_dashboard',
        name: 'Compliance Dashboard',
        description: 'Executive compliance overview with key metrics',
        category: 'executive',
        defaultFilters: [
          { field: 'category', operator: 'equals', value: 'COMPLIANCE', label: 'Compliance Events' }
        ],
        defaultColumns: [
          { key: 'complianceType', label: 'Compliance Type', type: 'string' },
          { key: 'findings', label: 'Findings', type: 'number', aggregation: 'count' },
          { key: 'violations', label: 'Violations', type: 'number', aggregation: 'count' },
          { key: 'resolved', label: 'Resolved', type: 'number', aggregation: 'count' }
        ],
        defaultCharts: [
          {
            type: 'bar',
            xAxis: 'complianceType',
            yAxis: ['findings', 'violations', 'resolved'],
            title: 'Compliance Status Overview',
            showLegend: true
          }
        ]
      },
      {
        id: 'user_activity_report',
        name: 'User Activity Report',
        description: 'User behavior and activity patterns analysis',
        category: 'operational',
        defaultFilters: [
          { field: 'timestamp', operator: 'greater_than', value: new Date(Date.now() - 30*24*60*60*1000).toISOString(), label: 'Last 30 Days' }
        ],
        defaultColumns: [
          { key: 'userEmail', label: 'User', type: 'string' },
          { key: 'loginCount', label: 'Logins', type: 'number', aggregation: 'count' },
          { key: 'actionsCount', label: 'Actions', type: 'number', aggregation: 'count' },
          { key: 'lastActivity', label: 'Last Activity', type: 'date' },
          { key: 'riskScore', label: 'Risk Score', type: 'number', aggregation: 'average' }
        ],
        defaultCharts: [
          {
            type: 'scatter',
            xAxis: 'loginCount',
            yAxis: 'riskScore',
            title: 'User Risk vs Activity',
            showLegend: false
          }
        ]
      }
    ];

    // Only add templates that don't exist
    defaultTemplates.forEach(template => {
      if (!this.templates.find(t => t.id === template.id)) {
        this.templates.push(template);
      }
    });

    this.saveTemplates();
  }

  // Create a new dynamic report
  public createReport(reportData: Omit<DynamicReport, 'id' | 'createdAt' | 'status'>): DynamicReport {
    const report: DynamicReport = {
      ...reportData,
      id: this.generateId('report'),
      createdAt: new Date().toISOString(),
      status: 'active'
    };

    this.reports.push(report);
    this.saveReports();

    return report;
  }

  // Generate report data
  public async generateReport(reportId: string, dateRange?: { start: string; end: string }): Promise<ReportResult> {
    const report = this.reports.find(r => r.id === reportId);
    if (!report) {
      throw new Error('Report not found');
    }

    // Get data based on report type
    let data: any[] = [];
    let insights: string[] = [];
    let recommendations: string[] = [];

    switch (report.type) {
      case 'user_access':
        data = await this.generateUserAccessData(report.filters, dateRange);
        insights = this.generateUserAccessInsights(data);
        break;
      case 'audit':
        data = await this.generateAuditData(report.filters, dateRange);
        insights = this.generateAuditInsights(data);
        break;
      case 'compliance':
        data = await this.generateComplianceData(report.filters, dateRange);
        insights = this.generateComplianceInsights(data);
        break;
      case 'activity':
        data = await this.generateActivityData(report.filters, dateRange);
        insights = this.generateActivityInsights(data);
        break;
      default:
        data = await this.generateCustomData(report, dateRange);
    }

    // Apply column filtering
    if (report.columns.length > 0) {
      const columnKeys = report.columns.map(col => col.key);
      data = data.map(item => 
        Object.fromEntries(
          Object.entries(item).filter(([key]) => columnKeys.includes(key))
        )
      );
    }

    // Generate chart data
    const charts = report.charts.map(chartConfig => ({
      config: chartConfig,
      data: this.generateChartData(data, chartConfig)
    }));

    const result: ReportResult = {
      id: this.generateId('result'),
      reportId: report.id,
      data,
      summary: {
        totalRecords: data.length,
        dateRange: dateRange || { start: '', end: '' },
        generatedAt: new Date().toISOString(),
        filters: report.filters
      },
      charts,
      insights,
      recommendations: this.generateRecommendations(data, report.type)
    };

    // Update report last generated time
    const reportIndex = this.reports.findIndex(r => r.id === reportId);
    if (reportIndex !== -1) {
      this.reports[reportIndex].lastGenerated = new Date().toISOString();
      this.saveReports();
    }

    // Store result
    this.reportResults.push(result);
    this.saveReportResults();

    return result;
  }

  // Generate user access data
  private async generateUserAccessData(filters: ReportFilter[], dateRange?: { start: string; end: string }): Promise<any[]> {
    // In a real app, this would query the database
    // For now, using mock data based on localStorage
    const users = JSON.parse(localStorage.getItem('iga_users') || '[]');
    return this.applyFilters(users, filters);
  }

  // Generate audit data
  private async generateAuditData(filters: ReportFilter[], dateRange?: { start: string; end: string }): Promise<any[]> {
    const auditEvents = JSON.parse(localStorage.getItem('iga_audit_events') || '[]');
    let filteredData = this.applyFilters(auditEvents, filters);

    if (dateRange) {
      filteredData = filteredData.filter(event => {
        const eventDate = new Date(event.timestamp);
        const startDate = new Date(dateRange.start);
        const endDate = new Date(dateRange.end);
        return eventDate >= startDate && eventDate <= endDate;
      });
    }

    return filteredData;
  }

  // Generate compliance data
  private async generateComplianceData(filters: ReportFilter[], dateRange?: { start: string; end: string }): Promise<any[]> {
    const complianceReports = JSON.parse(localStorage.getItem('iga_compliance_reports') || '[]');
    return this.applyFilters(complianceReports, filters);
  }

  // Generate activity data
  private async generateActivityData(filters: ReportFilter[], dateRange?: { start: string; end: string }): Promise<any[]> {
    const auditLogs = JSON.parse(localStorage.getItem('iga_audit_logs') || '[]');
    
    // Group by user to get activity summary
    const userActivity = auditLogs.reduce((acc: any, log: any) => {
      if (!acc[log.userId]) {
        acc[log.userId] = {
          userEmail: log.userEmail || log.userId,
          userId: log.userId,
          loginCount: 0,
          actionsCount: 0,
          lastActivity: log.timestamp,
          riskScore: 0,
          activities: []
        };
      }

      acc[log.userId].actionsCount++;
      if (log.action === 'LOGIN') acc[log.userId].loginCount++;
      if (new Date(log.timestamp) > new Date(acc[log.userId].lastActivity)) {
        acc[log.userId].lastActivity = log.timestamp;
      }
      acc[log.userId].activities.push(log);
      
      return acc;
    }, {});

    // Calculate risk scores
    Object.values(userActivity).forEach((user: any) => {
      user.riskScore = this.calculateUserRiskScore(user.activities);
    });

    return this.applyFilters(Object.values(userActivity), filters);
  }

  // Generate custom data based on report configuration
  private async generateCustomData(report: DynamicReport, dateRange?: { start: string; end: string }): Promise<any[]> {
    // This is a flexible method that can combine multiple data sources
    const allData = {
      users: JSON.parse(localStorage.getItem('iga_users') || '[]'),
      auditEvents: JSON.parse(localStorage.getItem('iga_audit_events') || '[]'),
      auditLogs: JSON.parse(localStorage.getItem('iga_audit_logs') || '[]'),
      complianceReports: JSON.parse(localStorage.getItem('iga_compliance_reports') || '[]')
    };

    // For custom reports, combine data based on report configuration
    let combinedData: any[] = [];

    // Logic to combine data sources based on report columns
    report.columns.forEach(column => {
      // This would be more sophisticated in a real implementation
      if (column.key.includes('user')) {
        combinedData = [...combinedData, ...allData.users];
      }
      if (column.key.includes('audit') || column.key.includes('action')) {
        combinedData = [...combinedData, ...allData.auditEvents];
      }
    });

    return this.applyFilters(combinedData, report.filters);
  }

  // Apply filters to data
  private applyFilters(data: any[], filters: ReportFilter[]): any[] {
    return data.filter(item => {
      return filters.every(filter => {
        const value = this.getNestedValue(item, filter.field);
        
        switch (filter.operator) {
          case 'equals':
            return value === filter.value;
          case 'contains':
            return String(value).toLowerCase().includes(String(filter.value).toLowerCase());
          case 'greater_than':
            return value > filter.value;
          case 'less_than':
            return value < filter.value;
          case 'between':
            return value >= filter.value[0] && value <= filter.value[1];
          case 'in':
            return Array.isArray(filter.value) ? filter.value.includes(value) : false;
          default:
            return true;
        }
      });
    });
  }

  // Generate chart data based on configuration
  private generateChartData(data: any[], config: ChartConfig): any[] {
    const chartData: any[] = [];

    if (config.type === 'pie' || config.type === 'donut') {
      // Group by xAxis field and count
      const grouped = data.reduce((acc: any, item: any) => {
        const key = this.getNestedValue(item, config.xAxis) || 'Unknown';
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {});

      return Object.entries(grouped).map(([label, value]) => ({
        label,
        value
      }));
    }

    if (config.type === 'bar' || config.type === 'line') {
      const yFields = Array.isArray(config.yAxis) ? config.yAxis : [config.yAxis];
      
      // Group by xAxis field
      const grouped = data.reduce((acc: any, item: any) => {
        const key = this.getNestedValue(item, config.xAxis) || 'Unknown';
        if (!acc[key]) {
          acc[key] = { label: key };
          yFields.forEach(field => acc[key][field] = 0);
        }

        yFields.forEach(field => {
          if (field === 'count') {
            acc[key][field]++;
          } else {
            const value = this.getNestedValue(item, field) || 0;
            acc[key][field] += typeof value === 'number' ? value : 1;
          }
        });

        return acc;
      }, {});

      return Object.values(grouped);
    }

    if (config.type === 'scatter') {
      return data.map(item => ({
        x: this.getNestedValue(item, config.xAxis) || 0,
        y: this.getNestedValue(item, config.yAxis) || 0,
        label: this.getNestedValue(item, 'email') || this.getNestedValue(item, 'id') || 'Unknown'
      }));
    }

    return chartData;
  }

  // Generate insights based on data analysis
  private generateUserAccessInsights(data: any[]): string[] {
    const insights: string[] = [];
    
    if (data.length > 0) {
      // Analyze user distribution
      const toolCounts = data.reduce((acc: any, user: any) => {
        acc[user.tool] = (acc[user.tool] || 0) + 1;
        return acc;
      }, {});
      
      const mostUsedTool = Object.entries(toolCounts).sort(([,a], [,b]) => (b as number) - (a as number))[0];
      insights.push(`Most used tool: ${mostUsedTool[0]} with ${mostUsedTool[1]} users`);

      // Analyze inactive users
      const inactiveUsers = data.filter(user => 
        !user.lastLogin || new Date(user.lastLogin) < new Date(Date.now() - 90*24*60*60*1000)
      );
      if (inactiveUsers.length > 0) {
        insights.push(`${inactiveUsers.length} users haven't logged in for 90+ days`);
      }

      // Analyze role distribution
      const roleCounts = data.reduce((acc: any, user: any) => {
        acc[user.role] = (acc[user.role] || 0) + 1;
        return acc;
      }, {});
      const adminCount = roleCounts['Admin'] || 0;
      insights.push(`${adminCount} users have admin privileges (${((adminCount/data.length)*100).toFixed(1)}%)`);
    }

    return insights;
  }

  // Generate audit insights
  private generateAuditInsights(data: any[]): string[] {
    const insights: string[] = [];
    
    if (data.length > 0) {
      const highRiskEvents = data.filter(event => event.severity === 'HIGH' || event.severity === 'CRITICAL');
      insights.push(`${highRiskEvents.length} high/critical risk events detected`);

      const failedEvents = data.filter(event => event.outcome === 'FAILURE');
      insights.push(`${failedEvents.length} failed events (${((failedEvents.length/data.length)*100).toFixed(1)}% failure rate)`);
    }

    return insights;
  }

  // Generate compliance insights
  private generateComplianceInsights(data: any[]): string[] {
    const insights: string[] = [];
    
    if (data.length > 0) {
      const openFindings = data.reduce((total: number, report: any) => 
        total + (report.findings?.filter((f: any) => f.status === 'OPEN')?.length || 0), 0
      );
      insights.push(`${openFindings} open compliance findings require attention`);

      const complianceTypes = [...new Set(data.map(report => report.type))];
      insights.push(`Covering ${complianceTypes.length} compliance frameworks: ${complianceTypes.join(', ')}`);
    }

    return insights;
  }

  // Generate activity insights
  private generateActivityInsights(data: any[]): string[] {
    const insights: string[] = [];
    
    if (data.length > 0) {
      const avgRiskScore = data.reduce((sum, user) => sum + (user.riskScore || 0), 0) / data.length;
      insights.push(`Average user risk score: ${avgRiskScore.toFixed(2)}`);

      const highRiskUsers = data.filter(user => user.riskScore > 7);
      insights.push(`${highRiskUsers.length} high-risk users identified`);

      const inactiveUsers = data.filter(user => 
        new Date(user.lastActivity) < new Date(Date.now() - 7*24*60*60*1000)
      );
      insights.push(`${inactiveUsers.length} users inactive for 7+ days`);
    }

    return insights;
  }

  // Generate recommendations
  private generateRecommendations(data: any[], reportType: string): string[] {
    const recommendations: string[] = [];

    switch (reportType) {
      case 'user_access':
        const inactiveUsers = data.filter((user: any) => 
          !user.lastLogin || new Date(user.lastLogin) < new Date(Date.now() - 90*24*60*60*1000)
        );
        if (inactiveUsers.length > 0) {
          recommendations.push(`Review and consider deactivating ${inactiveUsers.length} inactive users`);
        }
        break;

      case 'audit':
        const failedLogins = data.filter((event: any) => 
          event.action === 'LOGIN' && event.outcome === 'FAILURE'
        );
        if (failedLogins.length > 10) {
          recommendations.push('Implement account lockout policies for repeated failed logins');
        }
        break;

      case 'compliance':
        recommendations.push('Schedule regular compliance reviews monthly');
        recommendations.push('Implement automated policy violation detection');
        break;
    }

    return recommendations;
  }

  // Calculate user risk score based on activities
  private calculateUserRiskScore(activities: any[]): number {
    let riskScore = 0;
    
    activities.forEach(activity => {
      // Base risk factors
      if (activity.action === 'FAILED_LOGIN') riskScore += 2;
      if (activity.action === 'PRIVILEGE_ESCALATION') riskScore += 5;
      if (activity.action === 'DATA_ACCESS') riskScore += 1;
      if (activity.action === 'POLICY_VIOLATION') riskScore += 3;

      // Time-based risk (late night access)
      const hour = new Date(activity.timestamp).getHours();
      if (hour < 6 || hour > 22) riskScore += 1;
    });

    // Normalize to 0-10 scale
    return Math.min(10, Math.max(0, riskScore / activities.length * 2));
  }

  // Utility functions
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Storage methods
  private loadReports(): void {
    this.reports = JSON.parse(localStorage.getItem('iga_dynamic_reports') || '[]');
  }

  private saveReports(): void {
    localStorage.setItem('iga_dynamic_reports', JSON.stringify(this.reports));
  }

  private loadTemplates(): void {
    this.templates = JSON.parse(localStorage.getItem('iga_report_templates') || '[]');
  }

  private saveTemplates(): void {
    localStorage.setItem('iga_report_templates', JSON.stringify(this.templates));
  }

  private saveReportResults(): void {
    localStorage.setItem('iga_report_results', JSON.stringify(this.reportResults.slice(-100))); // Keep last 100 results
  }

  // Public API methods
  public getReports(): DynamicReport[] {
    return this.reports;
  }

  public getReport(id: string): DynamicReport | undefined {
    return this.reports.find(r => r.id === id);
  }

  public getTemplates(): ReportTemplate[] {
    return this.templates;
  }

  public getTemplate(id: string): ReportTemplate | undefined {
    return this.templates.find(t => t.id === id);
  }

  public deleteReport(id: string): boolean {
    const index = this.reports.findIndex(r => r.id === id);
    if (index !== -1) {
      this.reports.splice(index, 1);
      this.saveReports();
      return true;
    }
    return false;
  }

  public updateReport(id: string, updates: Partial<DynamicReport>): DynamicReport | null {
    const index = this.reports.findIndex(r => r.id === id);
    if (index !== -1) {
      this.reports[index] = { ...this.reports[index], ...updates };
      this.saveReports();
      return this.reports[index];
    }
    return null;
  }

  public getReportResults(reportId?: string): ReportResult[] {
    const results = JSON.parse(localStorage.getItem('iga_report_results') || '[]');
    return reportId ? results.filter((r: ReportResult) => r.reportId === reportId) : results;
  }

  // Export report to different formats
  public exportReport(result: ReportResult, format: 'csv' | 'json' | 'excel'): void {
    switch (format) {
      case 'csv':
        this.exportToCSV(result);
        break;
      case 'json':
        this.exportToJSON(result);
        break;
      case 'excel':
        this.exportToExcel(result);
        break;
    }
  }

  private exportToCSV(result: ReportResult): void {
    if (result.data.length === 0) return;
    
    const headers = Object.keys(result.data[0]);
    const csv = [
      headers.join(','),
      ...result.data.map(row => 
        headers.map(header => {
          const value = row[header];
          if (Array.isArray(value)) return `"${value.join('; ')}"`;
          if (typeof value === 'string' && value.includes(',')) return `"${value}"`;
          return value || '';
        }).join(',')
      )
    ].join('\n');

    this.downloadFile(csv, `report_${result.id}.csv`, 'text/csv');
  }

  private exportToJSON(result: ReportResult): void {
    const jsonContent = JSON.stringify(result, null, 2);
    this.downloadFile(jsonContent, `report_${result.id}.json`, 'application/json');
  }

  private exportToExcel(result: ReportResult): void {
    // For now, export as CSV (in real app, would use a library like xlsx)
    this.exportToCSV(result);
  }

  private downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

// Export the singleton instance
export const dynamicReportsService = DynamicReportsService.getInstance();
