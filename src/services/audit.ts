// Comprehensive Audit Logging and Compliance Service

export interface AuditEvent {
  id: string;
  timestamp: string;
  userId: string;
  userEmail: string;
  action: string;
  resource: string;
  resourceId?: string;
  details: string;
  ipAddress: string;
  userAgent: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  category: 'AUTHENTICATION' | 'AUTHORIZATION' | 'DATA_ACCESS' | 'DATA_MODIFICATION' | 'SYSTEM_CONFIG' | 'COMPLIANCE';
  outcome: 'SUCCESS' | 'FAILURE' | 'PARTIAL';
  riskScore: number;
  tags: string[];
  metadata?: Record<string, any>;
}

export interface ComplianceReport {
  id: string;
  name: string;
  type: 'SOX' | 'GDPR' | 'HIPAA' | 'PCI_DSS' | 'ISO27001' | 'CUSTOM';
  period: {
    start: string;
    end: string;
  };
  status: 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED' | 'APPROVED';
  findings: ComplianceFinding[];
  recommendations: string[];
  generatedBy: string;
  generatedAt: string;
  approvedBy?: string;
  approvedAt?: string;
}

export interface ComplianceFinding {
  id: string;
  title: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  category: string;
  affectedUsers: number;
  affectedResources: string[];
  remediation: string;
  dueDate?: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'ACCEPTED_RISK';
}

class AuditService {
  private static instance: AuditService;
  private auditEvents: AuditEvent[] = [];

  private constructor() {
    this.loadAuditEvents();
  }

  public static getInstance(): AuditService {
    if (!AuditService.instance) {
      AuditService.instance = new AuditService();
    }
    return AuditService.instance;
  }

  // Load audit events from storage
  private loadAuditEvents(): void {
    try {
      const stored = localStorage.getItem('iga_audit_events');
      if (stored) {
        this.auditEvents = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load audit events:', error);
      this.auditEvents = [];
    }
  }

  // Save audit events to storage
  private saveAuditEvents(): void {
    try {
      localStorage.setItem('iga_audit_events', JSON.stringify(this.auditEvents));
    } catch (error) {
      console.error('Failed to save audit events:', error);
    }
  }

  // Log an audit event
  public logEvent(event: Omit<AuditEvent, 'id' | 'timestamp' | 'ipAddress' | 'userAgent'>): void {
    const auditEvent: AuditEvent = {
      ...event,
      id: this.generateEventId(),
      timestamp: new Date().toISOString(),
      ipAddress: '127.0.0.1', // In real app, get from request context
      userAgent: navigator.userAgent,
    };

    this.auditEvents.unshift(auditEvent);
    
    // Keep only last 10000 events
    if (this.auditEvents.length > 10000) {
      this.auditEvents = this.auditEvents.slice(0, 10000);
    }

    this.saveAuditEvents();

    // In real app, also send to centralized logging system
    console.log('Audit Event:', auditEvent);
  }

  // Generate unique event ID
  private generateEventId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Get audit events with filtering
  public getAuditEvents(filters?: {
    userId?: string;
    action?: string;
    resource?: string;
    category?: string;
    severity?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
  }): AuditEvent[] {
    let filteredEvents = [...this.auditEvents];

    if (filters) {
      if (filters.userId) {
        filteredEvents = filteredEvents.filter(event => event.userId === filters.userId);
      }
      if (filters.action) {
        filteredEvents = filteredEvents.filter(event => event.action === filters.action);
      }
      if (filters.resource) {
        filteredEvents = filteredEvents.filter(event => event.resource === filters.resource);
      }
      if (filters.category) {
        filteredEvents = filteredEvents.filter(event => event.category === filters.category);
      }
      if (filters.severity) {
        filteredEvents = filteredEvents.filter(event => event.severity === filters.severity);
      }
      if (filters.startDate) {
        filteredEvents = filteredEvents.filter(event => event.timestamp >= filters.startDate!);
      }
      if (filters.endDate) {
        filteredEvents = filteredEvents.filter(event => event.timestamp <= filters.endDate!);
      }
    }

    if (filters?.limit) {
      filteredEvents = filteredEvents.slice(0, filters.limit);
    }

    return filteredEvents;
  }

  // Get audit statistics
  public getAuditStatistics(period?: { start: string; end: string }): {
    totalEvents: number;
    eventsByCategory: Record<string, number>;
    eventsBySeverity: Record<string, number>;
    eventsByOutcome: Record<string, number>;
    topUsers: Array<{ userId: string; userEmail: string; count: number }>;
    topActions: Array<{ action: string; count: number }>;
    riskTrend: Array<{ date: string; averageRisk: number }>;
  } {
    let events = this.auditEvents;

    if (period) {
      events = events.filter(event => 
        event.timestamp >= period.start && event.timestamp <= period.end
      );
    }

    const eventsByCategory: Record<string, number> = {};
    const eventsBySeverity: Record<string, number> = {};
    const eventsByOutcome: Record<string, number> = {};
    const userCounts: Record<string, { email: string; count: number }> = {};
    const actionCounts: Record<string, number> = {};

    events.forEach(event => {
      // Category counts
      eventsByCategory[event.category] = (eventsByCategory[event.category] || 0) + 1;
      
      // Severity counts
      eventsBySeverity[event.severity] = (eventsBySeverity[event.severity] || 0) + 1;
      
      // Outcome counts
      eventsByOutcome[event.outcome] = (eventsByOutcome[event.outcome] || 0) + 1;
      
      // User counts
      if (!userCounts[event.userId]) {
        userCounts[event.userId] = { email: event.userEmail, count: 0 };
      }
      userCounts[event.userId].count++;
      
      // Action counts
      actionCounts[event.action] = (actionCounts[event.action] || 0) + 1;
    });

    // Calculate risk trend (last 30 days)
    const riskTrend = this.calculateRiskTrend(events);

    return {
      totalEvents: events.length,
      eventsByCategory,
      eventsBySeverity,
      eventsByOutcome,
      topUsers: Object.entries(userCounts)
        .map(([userId, data]) => ({ userId, userEmail: data.email, count: data.count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
      topActions: Object.entries(actionCounts)
        .map(([action, count]) => ({ action, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
      riskTrend,
    };
  }

  // Calculate risk trend over time
  private calculateRiskTrend(events: AuditEvent[]): Array<{ date: string; averageRisk: number }> {
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);

    const dailyRisk: Record<string, { total: number; count: number }> = {};

    events
      .filter(event => new Date(event.timestamp) >= last30Days)
      .forEach(event => {
        const date = event.timestamp.split('T')[0];
        if (!dailyRisk[date]) {
          dailyRisk[date] = { total: 0, count: 0 };
        }
        dailyRisk[date].total += event.riskScore;
        dailyRisk[date].count++;
      });

    return Object.entries(dailyRisk)
      .map(([date, data]) => ({
        date,
        averageRisk: data.count > 0 ? data.total / data.count : 0,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  // Generate compliance report
  public generateComplianceReport(
    type: ComplianceReport['type'],
    period: { start: string; end: string },
    generatedBy: string
  ): ComplianceReport {
    const events = this.getAuditEvents({ startDate: period.start, endDate: period.end });
    const findings = this.analyzeComplianceFindings(events, type);

    const report: ComplianceReport = {
      id: `report_${Date.now()}`,
      name: `${type} Compliance Report - ${period.start} to ${period.end}`,
      type,
      period,
      status: 'DRAFT',
      findings,
      recommendations: this.generateRecommendations(findings),
      generatedBy,
      generatedAt: new Date().toISOString(),
    };

    // Store report
    const reports = JSON.parse(localStorage.getItem('iga_compliance_reports') || '[]');
    reports.unshift(report);
    localStorage.setItem('iga_compliance_reports', JSON.stringify(reports));

    return report;
  }

  // Analyze compliance findings
  private analyzeComplianceFindings(events: AuditEvent[], type: ComplianceReport['type']): ComplianceFinding[] {
    const findings: ComplianceFinding[] = [];

    // Analyze failed authentication attempts
    const failedAuths = events.filter(e => 
      e.category === 'AUTHENTICATION' && e.outcome === 'FAILURE'
    );
    if (failedAuths.length > 10) {
      findings.push({
        id: `finding_${Date.now()}_1`,
        title: 'Excessive Failed Authentication Attempts',
        description: `${failedAuths.length} failed authentication attempts detected`,
        severity: 'HIGH',
        category: 'Authentication Security',
        affectedUsers: new Set(failedAuths.map(e => e.userId)).size,
        affectedResources: ['Authentication System'],
        remediation: 'Review and strengthen authentication policies',
        status: 'OPEN',
      });
    }

    // Analyze privilege escalation
    const privilegeChanges = events.filter(e => 
      e.action.includes('ROLE_ASSIGN') || e.action.includes('PERMISSION_GRANT')
    );
    if (privilegeChanges.length > 0) {
      findings.push({
        id: `finding_${Date.now()}_2`,
        title: 'Privilege Escalation Activities',
        description: `${privilegeChanges.length} privilege escalation activities detected`,
        severity: 'MEDIUM',
        category: 'Access Control',
        affectedUsers: new Set(privilegeChanges.map(e => e.userId)).size,
        affectedResources: ['User Management System'],
        remediation: 'Review privilege changes and implement approval workflows',
        status: 'OPEN',
      });
    }

    // Analyze data access patterns
    const dataAccess = events.filter(e => e.category === 'DATA_ACCESS');
    const suspiciousAccess = dataAccess.filter(e => e.riskScore > 7);
    if (suspiciousAccess.length > 0) {
      findings.push({
        id: `finding_${Date.now()}_3`,
        title: 'Suspicious Data Access Patterns',
        description: `${suspiciousAccess.length} high-risk data access activities detected`,
        severity: 'HIGH',
        category: 'Data Protection',
        affectedUsers: new Set(suspiciousAccess.map(e => e.userId)).size,
        affectedResources: Array.from(new Set(suspiciousAccess.map(e => e.resource))),
        remediation: 'Investigate and review data access policies',
        status: 'OPEN',
      });
    }

    return findings;
  }

  // Generate recommendations based on findings
  private generateRecommendations(findings: ComplianceFinding[]): string[] {
    const recommendations: string[] = [];

    if (findings.some(f => f.category === 'Authentication Security')) {
      recommendations.push('Implement multi-factor authentication for all users');
      recommendations.push('Set up account lockout policies after failed attempts');
    }

    if (findings.some(f => f.category === 'Access Control')) {
      recommendations.push('Implement role-based access control with approval workflows');
      recommendations.push('Regular access reviews and certifications');
    }

    if (findings.some(f => f.category === 'Data Protection')) {
      recommendations.push('Implement data loss prevention (DLP) policies');
      recommendations.push('Encrypt sensitive data at rest and in transit');
    }

    recommendations.push('Conduct regular security awareness training');
    recommendations.push('Implement continuous monitoring and alerting');

    return recommendations;
  }

  // Get compliance reports
  public getComplianceReports(): ComplianceReport[] {
    return JSON.parse(localStorage.getItem('iga_compliance_reports') || '[]');
  }

  // Export audit data
  public exportAuditData(format: 'CSV' | 'JSON', filters?: any): string {
    const events = this.getAuditEvents(filters);

    if (format === 'CSV') {
      const headers = [
        'Timestamp', 'User ID', 'User Email', 'Action', 'Resource', 'Resource ID',
        'Details', 'Severity', 'Category', 'Outcome', 'Risk Score', 'IP Address'
      ];
      
      const rows = events.map(event => [
        event.timestamp,
        event.userId,
        event.userEmail,
        event.action,
        event.resource,
        event.resourceId || '',
        event.details,
        event.severity,
        event.category,
        event.outcome,
        event.riskScore,
        event.ipAddress
      ]);

      return [headers, ...rows].map(row => row.join(',')).join('\n');
    } else {
      return JSON.stringify(events, null, 2);
    }
  }

  // Calculate risk score for an event
  public calculateRiskScore(event: Partial<AuditEvent>): number {
    let score = 0;

    // Base score by category
    const categoryScores: Record<string, number> = {
      'AUTHENTICATION': 3,
      'AUTHORIZATION': 5,
      'DATA_ACCESS': 4,
      'DATA_MODIFICATION': 6,
      'SYSTEM_CONFIG': 7,
      'COMPLIANCE': 8,
    };
    score += categoryScores[event.category || 'DATA_ACCESS'] || 4;

    // Adjust by severity
    const severityScores: Record<string, number> = {
      'LOW': 1,
      'MEDIUM': 3,
      'HIGH': 6,
      'CRITICAL': 10,
    };
    score += severityScores[event.severity || 'MEDIUM'] || 3;

    // Adjust by outcome
    if (event.outcome === 'FAILURE') score += 2;
    if (event.outcome === 'PARTIAL') score += 1;

    // Adjust by action type
    if (event.action?.includes('DELETE')) score += 3;
    if (event.action?.includes('ADMIN')) score += 2;
    if (event.action?.includes('EXPORT')) score += 2;

    return Math.min(score, 10); // Cap at 10
  }
}

export default AuditService.getInstance();
