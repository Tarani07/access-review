/**
 * CSV Processing Service for SparrowVision Integration Center
 * Handles CSV uploads for platforms without API access
 */

import { UserData } from './apiConnectors';

export interface CSVMapping {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  status: string;
  department?: string;
  jobTitle?: string;
  manager?: string;
  groups?: string;
  permissions?: string;
  lastLogin?: string;
  createdAt?: string;
}

export interface CSVProcessResult {
  success: boolean;
  users: UserData[];
  errors: string[];
  skippedRows: number;
  processedRows: number;
  warnings: string[];
}

export interface CSVTemplate {
  name: string;
  description: string;
  requiredColumns: string[];
  optionalColumns: string[];
  sampleData: Record<string, string>[];
  mapping: CSVMapping;
}

// Predefined CSV templates for different tool types
export const CSV_TEMPLATES: Record<string, CSVTemplate> = {
  // Standard template for most tools
  standard: {
    name: 'Standard User Export',
    description: 'Generic format for user access data',
    requiredColumns: ['email', 'name', 'status'],
    optionalColumns: ['department', 'job_title', 'manager', 'last_login', 'groups', 'permissions'],
    sampleData: [
      {
        email: 'john.doe@company.com',
        name: 'John Doe',
        status: 'active',
        department: 'Engineering',
        job_title: 'Senior Developer',
        manager: 'jane.smith@company.com',
        last_login: '2024-01-15T10:30:00Z',
        groups: 'Developers;VPN-Users',
        permissions: 'read;write;admin'
      }
    ],
    mapping: {
      id: 'email',
      email: 'email',
      firstName: 'name',
      lastName: '',
      status: 'status',
      department: 'department',
      jobTitle: 'job_title',
      manager: 'manager',
      groups: 'groups',
      permissions: 'permissions',
      lastLogin: 'last_login'
    }
  },

  // Firewall logs
  firewall: {
    name: 'Firewall Access Logs',
    description: 'For Fortigate, SonicWall, and other firewall systems',
    requiredColumns: ['username', 'ip_address', 'action'],
    optionalColumns: ['timestamp', 'source_ip', 'destination', 'protocol', 'port'],
    sampleData: [
      {
        username: 'john.doe',
        email: 'john.doe@company.com',
        ip_address: '192.168.1.100',
        action: 'allow',
        timestamp: '2024-01-15T10:30:00Z',
        destination: 'salesforce.com',
        protocol: 'https'
      }
    ],
    mapping: {
      id: 'username',
      email: 'email',
      firstName: 'username',
      lastName: '',
      status: 'action',
      groups: 'protocol',
      permissions: 'destination'
    }
  },

  // Security tools
  security: {
    name: 'Security Tool Export',
    description: 'For antivirus, EDR, and security monitoring tools',
    requiredColumns: ['user_id', 'device_name', 'status'],
    optionalColumns: ['last_seen', 'threats_detected', 'compliance_status', 'agent_version'],
    sampleData: [
      {
        user_id: 'john.doe@company.com',
        device_name: 'LAPTOP-JD001',
        status: 'protected',
        last_seen: '2024-01-15T10:30:00Z',
        threats_detected: '0',
        compliance_status: 'compliant',
        agent_version: '7.5.1'
      }
    ],
    mapping: {
      id: 'user_id',
      email: 'user_id',
      firstName: 'device_name',
      lastName: '',
      status: 'status',
      groups: 'compliance_status',
      permissions: 'agent_version',
      lastLogin: 'last_seen'
    }
  },

  // Financial/billing tools
  financial: {
    name: 'Financial Tool Export',
    description: 'For QuickBooks, Gusto, financial platforms',
    requiredColumns: ['employee_id', 'email', 'employee_name', 'status'],
    optionalColumns: ['hire_date', 'salary', 'pay_type', 'department', 'manager'],
    sampleData: [
      {
        employee_id: 'EMP001',
        email: 'john.doe@company.com',
        employee_name: 'John Doe',
        status: 'active',
        hire_date: '2023-01-15',
        department: 'Engineering',
        manager: 'Jane Smith',
        pay_type: 'salary'
      }
    ],
    mapping: {
      id: 'employee_id',
      email: 'email',
      firstName: 'employee_name',
      lastName: '',
      status: 'status',
      department: 'department',
      manager: 'manager',
      createdAt: 'hire_date'
    }
  },

  // Domain/hosting providers
  domain: {
    name: 'Domain/Hosting Export',
    description: 'For Namecheap, GoDaddy, domain registrars',
    requiredColumns: ['domain', 'owner_email', 'status'],
    optionalColumns: ['expiry_date', 'registrar', 'nameservers', 'auto_renew'],
    sampleData: [
      {
        domain: 'company.com',
        owner_email: 'admin@company.com',
        status: 'active',
        expiry_date: '2025-01-15',
        registrar: 'Namecheap',
        auto_renew: 'yes'
      }
    ],
    mapping: {
      id: 'domain',
      email: 'owner_email',
      firstName: 'domain',
      lastName: '',
      status: 'status',
      groups: 'registrar',
      createdAt: 'expiry_date'
    }
  }
};

export class CSVProcessor {
  private static parseCSV(csvContent: string): string[][] {
    const lines = csvContent.trim().split('\n');
    const result: string[][] = [];

    for (const line of lines) {
      // Simple CSV parser - handles basic cases
      // In production, use a more robust CSV parser like papaparse
      const row: string[] = [];
      let current = '';
      let inQuotes = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          row.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      
      row.push(current.trim());
      result.push(row);
    }

    return result;
  }

  private static detectDelimiter(csvContent: string): string {
    const firstLine = csvContent.split('\n')[0];
    const delimiters = [',', ';', '\t', '|'];
    
    let bestDelimiter = ',';
    let maxColumns = 0;
    
    for (const delimiter of delimiters) {
      const columns = firstLine.split(delimiter).length;
      if (columns > maxColumns) {
        maxColumns = columns;
        bestDelimiter = delimiter;
      }
    }
    
    return bestDelimiter;
  }

  private static normalizeColumnName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_{2,}/g, '_')
      .replace(/^_|_$/g, '');
  }

  private static mapColumnNames(headers: string[]): Record<string, string> {
    const mapping: Record<string, string> = {};
    
    // Common column name mappings
    const commonMappings: Record<string, string[]> = {
      email: ['email', 'e_mail', 'email_address', 'user_email', 'login', 'username'],
      firstName: ['first_name', 'firstname', 'given_name', 'fname', 'name'],
      lastName: ['last_name', 'lastname', 'family_name', 'lname', 'surname'],
      status: ['status', 'state', 'active', 'enabled', 'account_status'],
      department: ['department', 'dept', 'division', 'team', 'group'],
      jobTitle: ['job_title', 'title', 'position', 'role'],
      manager: ['manager', 'supervisor', 'reports_to'],
      lastLogin: ['last_login', 'last_sign_in', 'last_access', 'login_date'],
      groups: ['groups', 'roles', 'permissions', 'access_groups'],
      createdAt: ['created', 'created_at', 'created_date', 'hire_date', 'start_date']
    };

    for (let i = 0; i < headers.length; i++) {
      const normalizedHeader = this.normalizeColumnName(headers[i]);
      
      for (const [standardName, variants] of Object.entries(commonMappings)) {
        if (variants.some(variant => normalizedHeader.includes(variant))) {
          mapping[standardName] = headers[i];
          break;
        }
      }
    }

    return mapping;
  }

  private static transformCSVRow(
    row: Record<string, string>, 
    mapping: Record<string, string>,
    rowIndex: number
  ): { user?: UserData; errors: string[] } {
    const errors: string[] = [];

    try {
      // Extract required fields
      const email = row[mapping.email] || '';
      const firstName = row[mapping.firstName] || '';
      const status = row[mapping.status] || 'unknown';

      if (!email) {
        errors.push(`Row ${rowIndex}: Missing email address`);
        return { errors };
      }

      // Parse groups and permissions
      const groupsStr = row[mapping.groups] || '';
      const groups = groupsStr ? groupsStr.split(/[;,|]/).map(g => g.trim()).filter(Boolean) : [];

      const permissionsStr = row[mapping.permissions] || '';
      const permissions = permissionsStr ? permissionsStr.split(/[;,|]/).map(p => p.trim()).filter(Boolean) : [];

      // Parse names
      let parsedFirstName = firstName;
      let parsedLastName = row[mapping.lastName] || '';

      // If firstName contains full name, split it
      if (!parsedLastName && firstName.includes(' ')) {
        const nameParts = firstName.split(' ');
        parsedFirstName = nameParts[0];
        parsedLastName = nameParts.slice(1).join(' ');
      }

      // Normalize status
      const normalizedStatus = this.normalizeStatus(status);

      // Calculate risk score
      const riskScore = this.calculateRiskScore({
        status: normalizedStatus,
        lastLogin: row[mapping.lastLogin],
        groups
      });

      const user: UserData = {
        id: row[mapping.id] || email,
        email,
        firstName: parsedFirstName,
        lastName: parsedLastName,
        displayName: `${parsedFirstName} ${parsedLastName}`.trim() || email,
        status: normalizedStatus,
        lastLogin: row[mapping.lastLogin] || undefined,
        department: row[mapping.department] || undefined,
        jobTitle: row[mapping.jobTitle] || undefined,
        manager: row[mapping.manager] || undefined,
        groups,
        permissions,
        createdAt: row[mapping.createdAt] || undefined,
        riskScore,
        rawData: row
      };

      return { user, errors };

    } catch (error) {
      errors.push(`Row ${rowIndex}: Failed to parse - ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { errors };
    }
  }

  private static normalizeStatus(status: string): UserData['status'] {
    const normalized = status.toLowerCase();
    
    if (['active', 'enabled', 'allow', 'protected', 'compliant', 'yes', 'true', '1'].includes(normalized)) {
      return 'active';
    }
    
    if (['suspended', 'disabled', 'blocked', 'deny', 'quarantined'].includes(normalized)) {
      return 'suspended';
    }
    
    if (['inactive', 'terminated', 'deprovisioned', 'deleted', 'no', 'false', '0'].includes(normalized)) {
      return 'inactive';
    }
    
    return 'inactive'; // Default for unknown statuses
  }

  private static calculateRiskScore(data: { status: string; lastLogin?: string; groups: string[] }): number {
    let score = 0;

    // Status-based risk
    if (data.status === 'suspended') score += 30;
    if (data.status === 'inactive') score += 20;

    // Last login risk
    if (data.lastLogin) {
      try {
        const loginDate = new Date(data.lastLogin);
        const daysSinceLogin = (Date.now() - loginDate.getTime()) / (1000 * 60 * 60 * 24);
        
        if (daysSinceLogin > 90) score += 25;
        else if (daysSinceLogin > 30) score += 15;
        else if (daysSinceLogin > 7) score += 5;
      } catch {
        score += 10; // Invalid date format
      }
    } else {
      score += 15; // No login data
    }

    // Admin/privileged access
    const adminKeywords = ['admin', 'administrator', 'root', 'super', 'owner', 'manager', 'full_access'];
    const adminGroups = data.groups.filter(g => 
      adminKeywords.some(keyword => g.toLowerCase().includes(keyword))
    );
    score += adminGroups.length * 10;

    return Math.min(score, 100);
  }

  static async processCSVFile(
    file: File, 
    templateType: string = 'standard',
    customMapping?: Partial<CSVMapping>
  ): Promise<CSVProcessResult> {
    const result: CSVProcessResult = {
      success: false,
      users: [],
      errors: [],
      skippedRows: 0,
      processedRows: 0,
      warnings: []
    };

    try {
      // Read file content
      const csvContent = await file.text();
      
      if (!csvContent.trim()) {
        result.errors.push('CSV file is empty');
        return result;
      }

      // Parse CSV
      const rows = this.parseCSV(csvContent);
      
      if (rows.length < 2) {
        result.errors.push('CSV file must contain at least a header row and one data row');
        return result;
      }

      const headers = rows[0];
      const dataRows = rows.slice(1);

      // Auto-detect column mapping
      const autoMapping = this.mapColumnNames(headers);
      
      // Use template mapping as fallback
      const template = CSV_TEMPLATES[templateType] || CSV_TEMPLATES.standard;
      const mapping = { ...template.mapping, ...autoMapping, ...customMapping };

      // Validate required columns
      const missingColumns: string[] = [];
      if (!mapping.email) missingColumns.push('email');
      if (!mapping.firstName && !mapping.lastName) missingColumns.push('name');

      if (missingColumns.length > 0) {
        result.errors.push(`Missing required columns: ${missingColumns.join(', ')}`);
        result.warnings.push('Available columns: ' + headers.join(', '));
        return result;
      }

      // Process each row
      for (let i = 0; i < dataRows.length; i++) {
        const row = dataRows[i];
        
        // Convert array row to object
        const rowObject: Record<string, string> = {};
        headers.forEach((header, index) => {
          rowObject[header] = row[index] || '';
        });

        // Transform row to user data
        const { user, errors } = this.transformCSVRow(rowObject, mapping, i + 2);
        
        if (errors.length > 0) {
          result.errors.push(...errors);
          result.skippedRows++;
        } else if (user) {
          result.users.push(user);
          result.processedRows++;
        } else {
          result.skippedRows++;
        }
      }

      // Add warnings for data quality issues
      const duplicateEmails = new Set();
      const duplicates = result.users.filter(user => {
        if (duplicateEmails.has(user.email)) {
          return true;
        }
        duplicateEmails.add(user.email);
        return false;
      });

      if (duplicates.length > 0) {
        result.warnings.push(`Found ${duplicates.length} duplicate email addresses`);
      }

      const usersWithoutDepartment = result.users.filter(u => !u.department).length;
      if (usersWithoutDepartment > 0) {
        result.warnings.push(`${usersWithoutDepartment} users missing department information`);
      }

      result.success = result.processedRows > 0;

    } catch (error) {
      result.errors.push(`Failed to process CSV file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return result;
  }

  static generateCSVTemplate(templateType: string): string {
    const template = CSV_TEMPLATES[templateType] || CSV_TEMPLATES.standard;
    
    // Generate header row
    const headers = [
      ...template.requiredColumns,
      ...template.optionalColumns
    ];

    // Generate sample data rows
    const rows = [headers.join(',')];
    
    template.sampleData.forEach(sample => {
      const row = headers.map(header => {
        const value = sample[header] || '';
        // Escape values containing commas or quotes
        return value.includes(',') || value.includes('"') ? `"${value.replace(/"/g, '""')}"` : value;
      });
      rows.push(row.join(','));
    });

    return rows.join('\n');
  }

  static getAvailableTemplates(): Array<{ id: string; name: string; description: string }> {
    return Object.entries(CSV_TEMPLATES).map(([id, template]) => ({
      id,
      name: template.name,
      description: template.description
    }));
  }
}
