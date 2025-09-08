// Policy Management and Violation Detection Service

import { Policy, PolicyRule } from '../types/rbac';
import AuditService from './audit';

export interface PolicyViolation {
  id: string;
  policyId: string;
  policyName: string;
  userId: string;
  userEmail: string;
  violationType: 'ACCESS_VIOLATION' | 'TIME_VIOLATION' | 'LOCATION_VIOLATION' | 'BEHAVIOR_VIOLATION';
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  detectedAt: string;
  status: 'OPEN' | 'INVESTIGATING' | 'RESOLVED' | 'FALSE_POSITIVE';
  remediation?: string;
  resolvedBy?: string;
  resolvedAt?: string;
  metadata?: Record<string, any>;
}

export interface AccessPolicy {
  id: string;
  name: string;
  description: string;
  type: 'ACCESS_CONTROL' | 'DATA_PROTECTION' | 'COMPLIANCE' | 'SECURITY';
  rules: AccessRule[];
  isActive: boolean;
  priority: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface AccessRule {
  id: string;
  name: string;
  condition: string;
  action: 'ALLOW' | 'DENY' | 'REQUIRE_APPROVAL' | 'LOG_AND_ALLOW' | 'LOG_AND_DENY';
  priority: number;
  isActive: boolean;
  metadata?: Record<string, any>;
}

class PolicyService {
  private static instance: PolicyService;
  private policies: AccessPolicy[] = [];
  private violations: PolicyViolation[] = [];
  private auditService: any;

  private constructor() {
    this.auditService = AuditService; // default export is an instance
    this.loadPolicies();
    this.loadViolations();
    this.initializeDefaultPolicies();
  }

  public static getInstance(): PolicyService {
    if (!PolicyService.instance) {
      PolicyService.instance = new PolicyService();
    }
    return PolicyService.instance;
  }

  // Load policies from storage
  private loadPolicies(): void {
    try {
      const stored = localStorage.getItem('iga_policies');
      if (stored) {
        this.policies = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load policies:', error);
      this.policies = [];
    }
  }

  // Save policies to storage
  private savePolicies(): void {
    try {
      localStorage.setItem('iga_policies', JSON.stringify(this.policies));
    } catch (error) {
      console.error('Failed to save policies:', error);
    }
  }

  // Load violations from storage
  private loadViolations(): void {
    try {
      const stored = localStorage.getItem('iga_policy_violations');
      if (stored) {
        this.violations = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load violations:', error);
      this.violations = [];
    }
  }

  // Save violations to storage
  private saveViolations(): void {
    try {
      localStorage.setItem('iga_policy_violations', JSON.stringify(this.violations));
    } catch (error) {
      console.error('Failed to save violations:', error);
    }
  }

  // Initialize default policies
  private initializeDefaultPolicies(): void {
    if (this.policies.length === 0) {
      const defaultPolicies: AccessPolicy[] = [
        {
          id: 'policy_1',
          name: 'Separation of Duties',
          description: 'Prevent users from having conflicting roles that could lead to fraud or errors',
          type: 'ACCESS_CONTROL',
          rules: [
            {
              id: 'rule_1_1',
              name: 'No Admin and Finance Roles',
              condition: 'user.roles.some(role => role.name.includes("Admin")) && user.roles.some(role => role.name.includes("Finance"))',
              action: 'DENY',
              priority: 1,
              isActive: true,
            },
            {
              id: 'rule_1_2',
              name: 'No Approver and Requester',
              condition: 'user.roles.some(role => role.name.includes("Approver")) && user.roles.some(role => role.name.includes("Requester"))',
              action: 'DENY',
              priority: 2,
              isActive: true,
            },
          ],
          isActive: true,
          priority: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: 'system',
        },
        {
          id: 'policy_2',
          name: 'Data Access Time Restrictions',
          description: 'Restrict access to sensitive data during non-business hours',
          type: 'DATA_PROTECTION',
          rules: [
            {
              id: 'rule_2_1',
              name: 'No Access After Hours',
              condition: 'new Date().getHours() < 6 || new Date().getHours() > 22',
              action: 'REQUIRE_APPROVAL',
              priority: 1,
              isActive: true,
            },
            {
              id: 'rule_2_2',
              name: 'Weekend Access Logging',
              condition: 'new Date().getDay() === 0 || new Date().getDay() === 6',
              action: 'LOG_AND_ALLOW',
              priority: 2,
              isActive: true,
            },
          ],
          isActive: true,
          priority: 2,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: 'system',
        },
        {
          id: 'policy_3',
          name: 'Privileged Access Review',
          description: 'Require regular review of privileged access',
          type: 'COMPLIANCE',
          rules: [
            {
              id: 'rule_3_1',
              name: 'Admin Role Review',
              condition: 'user.roles.some(role => role.name.includes("Admin")) && daysSinceLastReview > 90',
              action: 'REQUIRE_APPROVAL',
              priority: 1,
              isActive: true,
            },
            {
              id: 'rule_3_2',
              name: 'High Privilege Logging',
              condition: 'user.roles.some(role => role.permissions.some(p => p.resource === "system"))',
              action: 'LOG_AND_ALLOW',
              priority: 2,
              isActive: true,
            },
          ],
          isActive: true,
          priority: 3,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: 'system',
        },
        {
          id: 'policy_4',
          name: 'External User Access',
          description: 'Special controls for external users and contractors',
          type: 'SECURITY',
          rules: [
            {
              id: 'rule_4_1',
              name: 'External User Restrictions',
              condition: 'user.email.includes("@external.com") || user.email.includes("@contractor.com")',
              action: 'REQUIRE_APPROVAL',
              priority: 1,
              isActive: true,
            },
            {
              id: 'rule_4_2',
              name: 'External Access Logging',
              condition: 'user.email.includes("@external.com") || user.email.includes("@contractor.com")',
              action: 'LOG_AND_ALLOW',
              priority: 2,
              isActive: true,
            },
          ],
          isActive: true,
          priority: 4,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: 'system',
        },
      ];

      this.policies = defaultPolicies;
      this.savePolicies();
    }
  }

  // Get all policies
  public getPolicies(): AccessPolicy[] {
    return [...this.policies];
  }

  // Get active policies
  public getActivePolicies(): AccessPolicy[] {
    return this.policies.filter(policy => policy.isActive);
  }

  // Create new policy
  public createPolicy(policy: Omit<AccessPolicy, 'id' | 'createdAt' | 'updatedAt'>): AccessPolicy {
    const newPolicy: AccessPolicy = {
      ...policy,
      id: `policy_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.policies.push(newPolicy);
    this.savePolicies();

    // Log policy creation
    this.auditService.logEvent({
      userId: newPolicy.createdBy,
      userEmail: 'system@surveysparrow.com',
      action: 'POLICY_CREATE',
      resource: 'policies',
      resourceId: newPolicy.id,
      details: `Created policy: ${newPolicy.name}`,
      severity: 'MEDIUM',
      category: 'SYSTEM_CONFIG',
      outcome: 'SUCCESS',
      riskScore: 3,
      tags: ['policy', 'creation'],
    });

    return newPolicy;
  }

  // Update policy
  public updatePolicy(id: string, updates: Partial<AccessPolicy>): AccessPolicy | null {
    const index = this.policies.findIndex(policy => policy.id === id);
    if (index === -1) return null;

    const oldPolicy = { ...this.policies[index] };
    this.policies[index] = {
      ...this.policies[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    this.savePolicies();

    // Log policy update
    this.auditService.logEvent({
      userId: 'system',
      userEmail: 'system@surveysparrow.com',
      action: 'POLICY_UPDATE',
      resource: 'policies',
      resourceId: id,
      details: `Updated policy: ${this.policies[index].name}`,
      severity: 'MEDIUM',
      category: 'SYSTEM_CONFIG',
      outcome: 'SUCCESS',
      riskScore: 4,
      tags: ['policy', 'update'],
    });

    return this.policies[index];
  }

  // Delete policy
  public deletePolicy(id: string): boolean {
    const index = this.policies.findIndex(policy => policy.id === id);
    if (index === -1) return false;

    const deletedPolicy = this.policies[index];
    this.policies.splice(index, 1);
    this.savePolicies();

    // Log policy deletion
    this.auditService.logEvent({
      userId: 'system',
      userEmail: 'system@surveysparrow.com',
      action: 'POLICY_DELETE',
      resource: 'policies',
      resourceId: id,
      details: `Deleted policy: ${deletedPolicy.name}`,
      severity: 'HIGH',
      category: 'SYSTEM_CONFIG',
      outcome: 'SUCCESS',
      riskScore: 6,
      tags: ['policy', 'deletion'],
    });

    return true;
  }

  // Evaluate access request against policies
  public evaluateAccessRequest(
    userId: string,
    userEmail: string,
    requestedResource: string,
    requestedAction: string,
    userContext: any
  ): {
    decision: 'ALLOW' | 'DENY' | 'REQUIRE_APPROVAL';
    violations: PolicyViolation[];
    appliedPolicies: string[];
  } {
    const activePolicies = this.getActivePolicies();
    const violations: PolicyViolation[] = [];
    const appliedPolicies: string[] = [];
    let finalDecision: 'ALLOW' | 'DENY' | 'REQUIRE_APPROVAL' = 'ALLOW';

    // Sort policies by priority (lower number = higher priority)
    const sortedPolicies = activePolicies.sort((a, b) => a.priority - b.priority);

    for (const policy of sortedPolicies) {
      for (const rule of policy.rules.filter(r => r.isActive)) {
        try {
          // Evaluate rule condition (simplified evaluation)
          const conditionMet = this.evaluateCondition(rule.condition, userContext);
          
          if (conditionMet) {
            appliedPolicies.push(policy.name);
            
            // Create violation if action is DENY or REQUIRE_APPROVAL
            if (rule.action === 'DENY' || rule.action === 'REQUIRE_APPROVAL') {
              const violation: PolicyViolation = {
                id: `violation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                policyId: policy.id,
                policyName: policy.name,
                userId,
                userEmail,
                violationType: 'ACCESS_VIOLATION',
                description: `Policy violation: ${rule.name} - ${rule.condition}`,
                severity: rule.action === 'DENY' ? 'HIGH' : 'MEDIUM',
                detectedAt: new Date().toISOString(),
                status: 'OPEN',
                metadata: {
                  ruleId: rule.id,
                  ruleName: rule.name,
                  requestedResource,
                  requestedAction,
                },
              };

              violations.push(violation);
            }

            // Update final decision based on rule action
            if (rule.action === 'DENY') {
              finalDecision = 'DENY';
            } else if (rule.action === 'REQUIRE_APPROVAL' && finalDecision !== 'DENY') {
              finalDecision = 'REQUIRE_APPROVAL';
            }
          }
        } catch (error) {
          console.error(`Error evaluating rule ${rule.id}:`, error);
        }
      }
    }

    // Store violations
    if (violations.length > 0) {
      this.violations.unshift(...violations);
      this.saveViolations();
    }

    return {
      decision: finalDecision,
      violations,
      appliedPolicies,
    };
  }

  // Simplified condition evaluation (in real app, use a proper expression evaluator)
  private evaluateCondition(condition: string, context: any): boolean {
    try {
      // This is a simplified evaluator - in production, use a proper expression engine
      if (condition.includes('user.roles.some(role => role.name.includes("Admin"))')) {
        return context.user?.roles?.some((role: any) => role.name?.includes('Admin')) || false;
      }
      if (condition.includes('user.roles.some(role => role.name.includes("Finance"))')) {
        return context.user?.roles?.some((role: any) => role.name?.includes('Finance')) || false;
      }
      if (condition.includes('new Date().getHours() < 6 || new Date().getHours() > 22')) {
        const hour = new Date().getHours();
        return hour < 6 || hour > 22;
      }
      if (condition.includes('new Date().getDay() === 0 || new Date().getDay() === 6')) {
        const day = new Date().getDay();
        return day === 0 || day === 6;
      }
      if (condition.includes('user.email.includes("@external.com")')) {
        return context.user?.email?.includes('@external.com') || false;
      }
      if (condition.includes('user.email.includes("@contractor.com")')) {
        return context.user?.email?.includes('@contractor.com') || false;
      }
      
      return false;
    } catch (error) {
      console.error('Error evaluating condition:', error);
      return false;
    }
  }

  // Get policy violations
  public getViolations(filters?: {
    policyId?: string;
    userId?: string;
    status?: string;
    severity?: string;
    startDate?: string;
    endDate?: string;
  }): PolicyViolation[] {
    let filteredViolations = [...this.violations];

    if (filters) {
      if (filters.policyId) {
        filteredViolations = filteredViolations.filter(v => v.policyId === filters.policyId);
      }
      if (filters.userId) {
        filteredViolations = filteredViolations.filter(v => v.userId === filters.userId);
      }
      if (filters.status) {
        filteredViolations = filteredViolations.filter(v => v.status === filters.status);
      }
      if (filters.severity) {
        filteredViolations = filteredViolations.filter(v => v.severity === filters.severity);
      }
      if (filters.startDate) {
        filteredViolations = filteredViolations.filter(v => v.detectedAt >= filters.startDate!);
      }
      if (filters.endDate) {
        filteredViolations = filteredViolations.filter(v => v.detectedAt <= filters.endDate!);
      }
    }

    return filteredViolations;
  }

  // Resolve violation
  public resolveViolation(
    violationId: string,
    resolvedBy: string,
    remediation: string
  ): PolicyViolation | null {
    const violation = this.violations.find(v => v.id === violationId);
    if (!violation) return null;

    violation.status = 'RESOLVED';
    violation.resolvedBy = resolvedBy;
    violation.resolvedAt = new Date().toISOString();
    violation.remediation = remediation;

    this.saveViolations();

    // Log violation resolution
    this.auditService.logEvent({
      userId: resolvedBy,
      userEmail: 'system@surveysparrow.com',
      action: 'VIOLATION_RESOLVE',
      resource: 'policy_violations',
      resourceId: violationId,
      details: `Resolved policy violation: ${violation.description}`,
      severity: 'LOW',
      category: 'COMPLIANCE',
      outcome: 'SUCCESS',
      riskScore: 2,
      tags: ['violation', 'resolution'],
    });

    return violation;
  }

  // Get violation statistics
  public getViolationStatistics(): {
    totalViolations: number;
    openViolations: number;
    violationsBySeverity: Record<string, number>;
    violationsByPolicy: Array<{ policyName: string; count: number }>;
    violationsByType: Record<string, number>;
  } {
    const violationsBySeverity: Record<string, number> = {};
    const violationsByPolicy: Record<string, number> = {};
    const violationsByType: Record<string, number> = {};

    this.violations.forEach(violation => {
      violationsBySeverity[violation.severity] = (violationsBySeverity[violation.severity] || 0) + 1;
      violationsByPolicy[violation.policyName] = (violationsByPolicy[violation.policyName] || 0) + 1;
      violationsByType[violation.violationType] = (violationsByType[violation.violationType] || 0) + 1;
    });

    return {
      totalViolations: this.violations.length,
      openViolations: this.violations.filter(v => v.status === 'OPEN').length,
      violationsBySeverity,
      violationsByPolicy: Object.entries(violationsByPolicy)
        .map(([policyName, count]) => ({ policyName, count }))
        .sort((a, b) => b.count - a.count),
      violationsByType,
    };
  }
}

export default PolicyService.getInstance();
