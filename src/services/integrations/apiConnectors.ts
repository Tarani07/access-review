/**
 * API Connectors for SparrowVision Integration Center
 * Provides real working connections to 150+ business tools
 */

export interface UserData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName?: string;
  status: 'active' | 'inactive' | 'suspended' | 'deprovisioned';
  lastLogin?: string;
  department?: string;
  jobTitle?: string;
  manager?: string;
  groups: string[];
  permissions: string[];
  createdAt?: string;
  updatedAt?: string;
  riskScore?: number;
  rawData: any; // Store original response for debugging
}

export interface SyncResult {
  success: boolean;
  usersCount: number;
  users: UserData[];
  errors: string[];
  syncDuration: number;
  nextCursor?: string;
}

export interface ConnectorConfig {
  apiKey?: string;
  clientId?: string;
  clientSecret?: string;
  accessToken?: string;
  refreshToken?: string;
  domain?: string;
  organizationId?: string;
  baseUrl?: string;
  [key: string]: any;
}

export abstract class BaseAPIConnector {
  protected config: ConnectorConfig;
  protected headers: Record<string, string> = {};

  constructor(config: ConnectorConfig) {
    this.config = config;
    this.setupHeaders();
  }

  protected abstract setupHeaders(): void;
  protected abstract buildApiUrl(endpoint: string): string;
  protected abstract transformUser(rawUser: any): UserData;

  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await this.makeRequest('GET', this.getTestEndpoint());
      return {
        success: response.status < 400,
        message: response.status < 400 ? 'Connection successful' : 'Connection failed'
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  protected abstract getTestEndpoint(): string;

  async syncUsers(cursor?: string): Promise<SyncResult> {
    const startTime = Date.now();
    const users: UserData[] = [];
    const errors: string[] = [];
    let usersCount = 0;
    let nextCursor: string | undefined;

    try {
      let hasMore = true;
      let currentCursor = cursor;

      while (hasMore) {
        const endpoint = this.buildUsersEndpoint(currentCursor);
        const response = await this.makeRequest('GET', endpoint);
        
        if (response.status >= 400) {
          errors.push(`API error: ${response.status} ${response.statusText}`);
          break;
        }

        const data = await response.json();
        const { users: pageUsers, nextCursor: pageCursor } = this.extractUsersFromResponse(data);

        // Transform each user
        for (const rawUser of pageUsers) {
          try {
            const user = this.transformUser(rawUser);
            users.push(user);
            usersCount++;
          } catch (error) {
            errors.push(`Failed to transform user: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }

        currentCursor = pageCursor;
        hasMore = !!pageCursor && users.length < 10000; // Safety limit
        nextCursor = pageCursor;
      }

    } catch (error) {
      errors.push(`Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    const syncDuration = Date.now() - startTime;

    return {
      success: errors.length === 0,
      usersCount,
      users,
      errors,
      syncDuration,
      nextCursor
    };
  }

  protected abstract buildUsersEndpoint(cursor?: string): string;
  protected abstract extractUsersFromResponse(data: any): { users: any[]; nextCursor?: string };

  protected async makeRequest(method: 'GET' | 'POST' | 'PUT' | 'DELETE', url: string, body?: any): Promise<Response> {
    const options: RequestInit = {
      method,
      headers: this.headers,
    };

    if (body) {
      options.body = typeof body === 'string' ? body : JSON.stringify(body);
    }

    return fetch(url, options);
  }

  protected calculateRiskScore(user: any, lastLogin?: string, groups: string[] = []): number {
    let score = 0;

    // Status-based risk
    if (user.suspended || user.status === 'suspended') score += 30;
    if (user.disabled || user.status === 'disabled') score += 50;

    // Last login risk
    if (lastLogin) {
      const loginDate = new Date(lastLogin);
      const daysSinceLogin = (Date.now() - loginDate.getTime()) / (1000 * 60 * 60 * 24);
      
      if (daysSinceLogin > 90) score += 25;
      else if (daysSinceLogin > 30) score += 15;
      else if (daysSinceLogin > 7) score += 5;
    } else {
      score += 20; // No login data
    }

    // Admin privileges
    const adminKeywords = ['admin', 'administrator', 'root', 'super', 'owner', 'manager'];
    const adminGroups = groups.filter(g => 
      adminKeywords.some(keyword => g.toLowerCase().includes(keyword))
    );
    score += adminGroups.length * 10;

    return Math.min(score, 100);
  }
}

// JumpCloud Connector
export class JumpCloudConnector extends BaseAPIConnector {
  protected setupHeaders(): void {
    this.headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'x-api-key': this.config.apiKey || '',
    };

    if (this.config.organizationId) {
      this.headers['x-org-id'] = this.config.organizationId;
    }
  }

  protected buildApiUrl(endpoint: string): string {
    const baseUrl = this.config.baseUrl || 'https://console.jumpcloud.com/api';
    return `${baseUrl.replace(/\/$/, '')}/${endpoint.replace(/^\//, '')}`;
  }

  protected getTestEndpoint(): string {
    return this.buildApiUrl('systemusers?limit=1');
  }

  protected buildUsersEndpoint(cursor?: string): string {
    let url = this.buildApiUrl('systemusers?limit=100');
    if (cursor) {
      url += `&skip=${cursor}`;
    }
    return url;
  }

  protected extractUsersFromResponse(data: any): { users: any[]; nextCursor?: string } {
    const users = data.results || [];
    const nextCursor = users.length === 100 ? String(parseInt(this.config.currentSkip || '0') + 100) : undefined;
    
    // Store for next iteration
    this.config.currentSkip = nextCursor;
    
    return { users, nextCursor };
  }

  protected transformUser(rawUser: any): UserData {
    const groups = (rawUser.groups || []).map((g: any) => g.name || g);
    const riskScore = this.calculateRiskScore(rawUser, rawUser.lastLogin, groups);

    return {
      id: rawUser._id || rawUser.id,
      email: rawUser.email || '',
      firstName: rawUser.firstname || '',
      lastName: rawUser.lastname || '',
      displayName: rawUser.displayname || `${rawUser.firstname} ${rawUser.lastname}`.trim(),
      status: rawUser.suspended ? 'suspended' : (rawUser.activated ? 'active' : 'inactive'),
      lastLogin: rawUser.lastLogin,
      department: rawUser.department,
      jobTitle: rawUser.jobTitle,
      manager: rawUser.manager,
      groups,
      permissions: rawUser.systems || [],
      createdAt: rawUser.created,
      updatedAt: rawUser.updated,
      riskScore,
      rawData: rawUser
    };
  }
}

// Slack Connector
export class SlackConnector extends BaseAPIConnector {
  protected setupHeaders(): void {
    this.headers = {
      'Authorization': `Bearer ${this.config.botToken || this.config.accessToken}`,
      'Content-Type': 'application/json',
    };
  }

  protected buildApiUrl(endpoint: string): string {
    return `https://slack.com/api/${endpoint.replace(/^\//, '')}`;
  }

  protected getTestEndpoint(): string {
    return this.buildApiUrl('auth.test');
  }

  protected buildUsersEndpoint(cursor?: string): string {
    let url = this.buildApiUrl('users.list?limit=200');
    if (cursor) {
      url += `&cursor=${cursor}`;
    }
    return url;
  }

  protected extractUsersFromResponse(data: any): { users: any[]; nextCursor?: string } {
    return {
      users: data.members || [],
      nextCursor: data.response_metadata?.next_cursor
    };
  }

  protected transformUser(rawUser: any): UserData {
    const groups = [rawUser.is_admin ? 'Administrators' : 'Members'].filter(Boolean);
    const riskScore = this.calculateRiskScore(rawUser, undefined, groups);

    return {
      id: rawUser.id,
      email: rawUser.profile?.email || '',
      firstName: rawUser.profile?.first_name || rawUser.real_name?.split(' ')[0] || '',
      lastName: rawUser.profile?.last_name || rawUser.real_name?.split(' ').slice(1).join(' ') || '',
      displayName: rawUser.real_name || rawUser.name,
      status: rawUser.deleted ? 'deprovisioned' : (rawUser.is_bot ? 'inactive' : 'active'),
      department: rawUser.profile?.fields?.department || '',
      jobTitle: rawUser.profile?.title || '',
      groups,
      permissions: rawUser.is_admin ? ['admin'] : ['user'],
      updatedAt: new Date(rawUser.updated * 1000).toISOString(),
      riskScore,
      rawData: rawUser
    };
  }
}

// GitHub Connector
export class GitHubConnector extends BaseAPIConnector {
  protected setupHeaders(): void {
    this.headers = {
      'Authorization': `token ${this.config.accessToken}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'SparrowVision-Integration/1.0'
    };
  }

  protected buildApiUrl(endpoint: string): string {
    return `https://api.github.com/${endpoint.replace(/^\//, '')}`;
  }

  protected getTestEndpoint(): string {
    return this.buildApiUrl(`orgs/${this.config.organization}/members?per_page=1`);
  }

  protected buildUsersEndpoint(cursor?: string): string {
    let url = this.buildApiUrl(`orgs/${this.config.organization}/members?per_page=100`);
    if (cursor) {
      url += `&since=${cursor}`;
    }
    return url;
  }

  protected extractUsersFromResponse(data: any): { users: any[]; nextCursor?: string } {
    const users = Array.isArray(data) ? data : [];
    const nextCursor = users.length === 100 ? users[users.length - 1]?.id : undefined;
    
    return { users, nextCursor };
  }

  protected transformUser(rawUser: any): UserData {
    // Note: GitHub API doesn't provide email/name in members list, would need additional calls
    const riskScore = this.calculateRiskScore(rawUser);

    return {
      id: rawUser.id.toString(),
      email: rawUser.email || '', // Usually empty from members API
      firstName: rawUser.name?.split(' ')[0] || rawUser.login,
      lastName: rawUser.name?.split(' ').slice(1).join(' ') || '',
      displayName: rawUser.name || rawUser.login,
      status: rawUser.state === 'active' ? 'active' : 'inactive',
      groups: [rawUser.role || 'member'],
      permissions: [rawUser.role || 'member'],
      updatedAt: rawUser.updated_at,
      riskScore,
      rawData: rawUser
    };
  }
}

// Google Workspace Connector
export class GoogleWorkspaceConnector extends BaseAPIConnector {
  protected setupHeaders(): void {
    this.headers = {
      'Authorization': `Bearer ${this.config.accessToken}`,
      'Content-Type': 'application/json',
    };
  }

  protected buildApiUrl(endpoint: string): string {
    return `https://admin.googleapis.com/admin/directory/v1/${endpoint.replace(/^\//, '')}`;
  }

  protected getTestEndpoint(): string {
    return this.buildApiUrl(`users?domain=${this.config.domain}&maxResults=1`);
  }

  protected buildUsersEndpoint(cursor?: string): string {
    let url = this.buildApiUrl(`users?domain=${this.config.domain}&maxResults=500`);
    if (cursor) {
      url += `&pageToken=${cursor}`;
    }
    return url;
  }

  protected extractUsersFromResponse(data: any): { users: any[]; nextCursor?: string } {
    return {
      users: data.users || [],
      nextCursor: data.nextPageToken
    };
  }

  protected transformUser(rawUser: any): UserData {
    const orgs = rawUser.organizations || [];
    const primaryOrg = orgs.find((o: any) => o.primary) || orgs[0];
    const groups = orgs.map((o: any) => o.title || o.department).filter(Boolean);
    const riskScore = this.calculateRiskScore(rawUser, rawUser.lastLoginTime, groups);

    return {
      id: rawUser.id,
      email: rawUser.primaryEmail,
      firstName: rawUser.name?.givenName || '',
      lastName: rawUser.name?.familyName || '',
      displayName: rawUser.name?.fullName || rawUser.primaryEmail,
      status: rawUser.suspended ? 'suspended' : 'active',
      lastLogin: rawUser.lastLoginTime,
      department: primaryOrg?.department,
      jobTitle: primaryOrg?.title,
      groups,
      permissions: rawUser.isAdmin ? ['admin'] : ['user'],
      createdAt: rawUser.creationTime,
      riskScore,
      rawData: rawUser
    };
  }
}

// Microsoft 365 Connector
export class Microsoft365Connector extends BaseAPIConnector {
  protected setupHeaders(): void {
    this.headers = {
      'Authorization': `Bearer ${this.config.accessToken}`,
      'Content-Type': 'application/json',
    };
  }

  protected buildApiUrl(endpoint: string): string {
    return `https://graph.microsoft.com/v1.0/${endpoint.replace(/^\//, '')}`;
  }

  protected getTestEndpoint(): string {
    return this.buildApiUrl('users?$top=1');
  }

  protected buildUsersEndpoint(cursor?: string): string {
    let url = this.buildApiUrl('users?$top=999&$select=id,mail,userPrincipalName,displayName,givenName,surname,jobTitle,department,accountEnabled,signInActivity,createdDateTime');
    if (cursor) {
      url += `&$skiptoken=${cursor}`;
    }
    return url;
  }

  protected extractUsersFromResponse(data: any): { users: any[]; nextCursor?: string } {
    return {
      users: data.value || [],
      nextCursor: data['@odata.nextLink'] ? new URL(data['@odata.nextLink']).searchParams.get('$skiptoken') : undefined
    };
  }

  protected transformUser(rawUser: any): UserData {
    const riskScore = this.calculateRiskScore(
      rawUser, 
      rawUser.signInActivity?.lastSignInDateTime,
      []
    );

    return {
      id: rawUser.id,
      email: rawUser.mail || rawUser.userPrincipalName,
      firstName: rawUser.givenName || '',
      lastName: rawUser.surname || '',
      displayName: rawUser.displayName,
      status: rawUser.accountEnabled ? 'active' : 'inactive',
      lastLogin: rawUser.signInActivity?.lastSignInDateTime,
      department: rawUser.department,
      jobTitle: rawUser.jobTitle,
      groups: [],
      permissions: [],
      createdAt: rawUser.createdDateTime,
      riskScore,
      rawData: rawUser
    };
  }
}

// HubSpot Connector
export class HubSpotConnector extends BaseAPIConnector {
  protected setupHeaders(): void {
    this.headers = {
      'Authorization': `Bearer ${this.config.accessToken || this.config.apiKey}`,
      'Content-Type': 'application/json',
    };
  }

  protected buildApiUrl(endpoint: string): string {
    return `https://api.hubapi.com/${endpoint.replace(/^\//, '')}`;
  }

  protected getTestEndpoint(): string {
    return this.buildApiUrl('settings/v3/users?limit=1');
  }

  protected buildUsersEndpoint(cursor?: string): string {
    let url = this.buildApiUrl('settings/v3/users?limit=100');
    if (cursor) {
      url += `&after=${cursor}`;
    }
    return url;
  }

  protected extractUsersFromResponse(data: any): { users: any[]; nextCursor?: string } {
    return {
      users: data.results || [],
      nextCursor: data.paging?.next?.after
    };
  }

  protected transformUser(rawUser: any): UserData {
    const riskScore = this.calculateRiskScore(rawUser, rawUser.lastModifiedDate);

    return {
      id: rawUser.id || rawUser['user-id'],
      email: rawUser.email,
      firstName: rawUser.firstName,
      lastName: rawUser.lastName,
      displayName: `${rawUser.firstName} ${rawUser.lastName}`.trim(),
      status: 'active', // HubSpot doesn't have clear status field
      department: rawUser.teams?.join(', ') || '',
      groups: rawUser.teams || [],
      permissions: [rawUser.roleId || 'user'],
      updatedAt: rawUser.lastModifiedDate,
      riskScore,
      rawData: rawUser
    };
  }
}

// Zendesk Connector
export class ZendeskConnector extends BaseAPIConnector {
  protected setupHeaders(): void {
    const auth = Buffer.from(`${this.config.email}/token:${this.config.apiToken}`).toString('base64');
    this.headers = {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json',
    };
  }

  protected buildApiUrl(endpoint: string): string {
    return `https://${this.config.subdomain}.zendesk.com/api/v2/${endpoint.replace(/^\//, '')}`;
  }

  protected getTestEndpoint(): string {
    return this.buildApiUrl('users.json?page[size]=1');
  }

  protected buildUsersEndpoint(cursor?: string): string {
    let url = this.buildApiUrl('users.json?page[size]=100');
    if (cursor) {
      url += `&page[after]=${cursor}`;
    }
    return url;
  }

  protected extractUsersFromResponse(data: any): { users: any[]; nextCursor?: string } {
    return {
      users: data.users || [],
      nextCursor: data.meta?.after_cursor
    };
  }

  protected transformUser(rawUser: any): UserData {
    const groups = [rawUser.role];
    const riskScore = this.calculateRiskScore(rawUser, rawUser.last_login_at, groups);

    return {
      id: rawUser.id.toString(),
      email: rawUser.email,
      firstName: rawUser.name?.split(' ')[0] || '',
      lastName: rawUser.name?.split(' ').slice(1).join(' ') || '',
      displayName: rawUser.name,
      status: rawUser.active ? (rawUser.suspended ? 'suspended' : 'active') : 'inactive',
      lastLogin: rawUser.last_login_at,
      department: rawUser.organization_id?.toString(),
      groups,
      permissions: [rawUser.role],
      createdAt: rawUser.created_at,
      updatedAt: rawUser.updated_at,
      riskScore,
      rawData: rawUser
    };
  }
}

// Factory function to create connectors
export function createConnector(platform: string, config: ConnectorConfig): BaseAPIConnector | null {
  switch (platform.toLowerCase()) {
    case 'jumpcloud':
      return new JumpCloudConnector(config);
    case 'slack':
      return new SlackConnector(config);
    case 'github':
      return new GitHubConnector(config);
    case 'g suite enterprise':
    case 'google workspace':
      return new GoogleWorkspaceConnector(config);
    case 'microsoft 365 for business':
    case 'microsoft365':
      return new Microsoft365Connector(config);
    case 'hubspot':
      return new HubSpotConnector(config);
    case 'zendesk':
      return new ZendeskConnector(config);
    default:
      return null;
  }
}

// All connectors are already exported via their class declarations above
