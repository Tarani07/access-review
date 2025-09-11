// Excel Export Service for User Management
export interface UserData {
  id: string;
  email: string;
  tool: string;
  role: string;
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING';
  department?: string;
  manager?: string;
  lastLogin?: string;
  joinDate?: string;
  permissions: string[];
  syncedAt: string;
}

export interface ExitUserData {
  email: string;
  name: string;
  department: string;
  exitDate: string;
  reason: string;
}

export class ExcelExportService {
  // Export user data to CSV format
  static exportUsersToCSV(users: UserData[], filename: string = 'users') {
    const csv = [
      ['Email', 'Tool', 'Role', 'Status', 'Department', 'Manager', 'Last Login', 'Join Date', 'Permissions', 'Synced At'],
      ...users.map(user => [
        user.email,
        user.tool,
        user.role,
        user.status,
        user.department || 'Unknown',
        user.manager || 'Unknown',
        user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never',
        user.joinDate ? new Date(user.joinDate).toLocaleDateString() : 'Unknown',
        user.permissions.join('; '),
        new Date(user.syncedAt).toLocaleString()
      ])
    ].map(row => row.join(',')).join('\n');
    
    this.downloadFile(csv, `${filename}.csv`, 'text/csv');
  }

  // Export exit users to CSV format
  static exportExitUsersToCSV(users: ExitUserData[], filename: string = 'exit_users') {
    const csv = [
      ['Email', 'Name', 'Department', 'Exit Date', 'Reason'],
      ...users.map(user => [
        user.email,
        user.name,
        user.department,
        user.exitDate,
        user.reason
      ])
    ].map(row => row.join(',')).join('\n');
    
    this.downloadFile(csv, `${filename}.csv`, 'text/csv');
  }

  // Export comparison report (users to remove vs active users)
  static exportComparisonReport(
    usersToRemove: UserData[], 
    activeUsers: UserData[], 
    filename: string = 'access_review_report'
  ) {
    const csv = [
      ['Report Type', 'Email', 'Tool', 'Role', 'Status', 'Department', 'Manager', 'Last Login', 'Action Required'],
      // Users to remove
      ...usersToRemove.map(user => [
        'TO REMOVE',
        user.email,
        user.tool,
        user.role,
        user.status,
        user.department || 'Unknown',
        user.manager || 'Unknown',
        user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never',
        'Remove access immediately'
      ]),
      // Active users (for reference)
      ...activeUsers.map(user => [
        'ACTIVE',
        user.email,
        user.tool,
        user.role,
        user.status,
        user.department || 'Unknown',
        user.manager || 'Unknown',
        user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never',
        'Keep access'
      ])
    ].map(row => row.join(',')).join('\n');
    
    this.downloadFile(csv, `${filename}.csv`, 'text/csv');
  }

  // Export tool-specific user report
  static exportToolUsersReport(
    toolName: string,
    users: UserData[],
    filename?: string
  ) {
    const csv = [
      [`${toolName} - User Access Report`],
      ['Generated:', new Date().toLocaleString()],
      ['Total Users:', users.length.toString()],
      [''],
      ['Email', 'Role', 'Status', 'Department', 'Manager', 'Last Login', 'Join Date', 'Permissions'],
      ...users.map(user => [
        user.email,
        user.role,
        user.status,
        user.department || 'Unknown',
        user.manager || 'Unknown',
        user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never',
        user.joinDate ? new Date(user.joinDate).toLocaleDateString() : 'Unknown',
        user.permissions.join('; ')
      ])
    ].map(row => row.join(',')).join('\n');
    
    this.downloadFile(csv, filename || `${toolName.toLowerCase().replace(/\s+/g, '_')}_users.csv`, 'text/csv');
  }

  // Export summary report
  static exportSummaryReport(
    stats: {
      totalUsers: number;
      activeUsers: number;
      inactiveUsers: number;
      usersToRemove: number;
      toolsCount: number;
    },
    filename: string = 'access_summary_report'
  ) {
    const csv = [
      ['Access Review Summary Report'],
      ['Generated:', new Date().toLocaleString()],
      [''],
      ['Metric', 'Count'],
      ['Total Users', stats.totalUsers.toString()],
      ['Active Users', stats.activeUsers.toString()],
      ['Inactive Users', stats.inactiveUsers.toString()],
      ['Users to Remove', stats.usersToRemove.toString()],
      ['Tools Monitored', stats.toolsCount.toString()],
      [''],
      ['Recommendations:'],
      ['1. Review users marked for removal'],
      ['2. Verify inactive users status'],
      ['3. Update access permissions as needed'],
      ['4. Schedule regular access reviews']
    ].map(row => row.join(',')).join('\n');
    
    this.downloadFile(csv, `${filename}.csv`, 'text/csv');
  }

  // Helper method to download file
  private static downloadFile(content: string, filename: string, mimeType: string) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Generate Excel-like format with multiple sheets (simulated with multiple CSV files)
  static exportMultiSheetReport(
    activeUsers: UserData[],
    usersToRemove: UserData[],
    exitUsers: ExitUserData[],
    stats: any
  ) {
    // Export each sheet as a separate CSV
    this.exportUsersToCSV(activeUsers, 'active_users');
    this.exportUsersToCSV(usersToRemove, 'users_to_remove');
    this.exportExitUsersToCSV(exitUsers, 'exit_list');
    this.exportSummaryReport(stats, 'summary_report');
    
    // Create a master index file
    const indexContent = [
      ['Access Review Report - File Index'],
      ['Generated:', new Date().toLocaleString()],
      [''],
      ['File Name', 'Description', 'Record Count'],
      ['active_users.csv', 'Users with active access', activeUsers.length.toString()],
      ['users_to_remove.csv', 'Users to remove access', usersToRemove.length.toString()],
      ['exit_list.csv', 'Employee exit list', exitUsers.length.toString()],
      ['summary_report.csv', 'Summary statistics and recommendations', '1'],
      [''],
      ['Instructions:'],
      ['1. Open each CSV file in Excel or Google Sheets'],
      ['2. Review users_to_remove.csv for immediate action'],
      ['3. Use active_users.csv for access verification'],
      ['4. Cross-reference with exit_list.csv for accuracy']
    ].map(row => row.join(',')).join('\n');
    
    this.downloadFile(indexContent, 'report_index.csv', 'text/csv');
  }
}

export default ExcelExportService;
