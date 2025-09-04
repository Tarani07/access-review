// Enhanced Authentication and Session Management Service

import { User, Role, hasPermission } from '../types/rbac';

export interface AuthSession {
  user: User;
  token: string;
  expiresAt: string;
  lastActivity: string;
  ipAddress: string;
  userAgent: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
  mfaCode?: string;
  rememberMe?: boolean;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  session: AuthSession | null;
  isLoading: boolean;
  error: string | null;
}

class AuthService {
  private static instance: AuthService;
  private authState: AuthState = {
    isAuthenticated: false,
    user: null,
    session: null,
    isLoading: false,
    error: null,
  };

  private listeners: ((state: AuthState) => void)[] = [];

  private constructor() {
    this.initializeFromStorage();
    this.setupSessionTimeout();
  }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  // Subscribe to auth state changes
  public subscribe(listener: (state: AuthState) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  // Get current auth state
  public getAuthState(): AuthState {
    return { ...this.authState };
  }

  // Initialize auth state from localStorage
  private initializeFromStorage(): void {
    try {
      const storedSession = localStorage.getItem('iga_session');
      if (storedSession) {
        const session: AuthSession = JSON.parse(storedSession);
        
        // Check if session is still valid
        if (new Date(session.expiresAt) > new Date()) {
          this.authState = {
            isAuthenticated: true,
            user: session.user,
            session,
            isLoading: false,
            error: null,
          };
          this.notifyListeners();
        } else {
          this.logout();
        }
      }
    } catch (error) {
      console.error('Failed to initialize auth from storage:', error);
      this.logout();
    }
  }

  // Setup session timeout
  private setupSessionTimeout(): void {
    setInterval(() => {
      if (this.authState.session && new Date(this.authState.session.expiresAt) <= new Date()) {
        this.logout();
      }
    }, 60000); // Check every minute
  }

  // Notify all listeners of state changes
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.authState));
  }

  // Update auth state
  private updateState(updates: Partial<AuthState>): void {
    this.authState = { ...this.authState, ...updates };
    this.notifyListeners();
  }

  // Mock user database (in real app, this would be API calls)
  private mockUsers: User[] = [
    {
      id: '1',
      email: 'admin@surveysparrow.com',
      firstName: 'System',
      lastName: 'Administrator',
      roles: [{ ...this.getRoleById('super-admin') }],
      isActive: true,
      lastLogin: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '2',
      email: 'access.admin@surveysparrow.com',
      firstName: 'Access',
      lastName: 'Administrator',
      roles: [{ ...this.getRoleById('access-admin') }],
      isActive: true,
      lastLogin: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '3',
      email: 'reviewer@surveysparrow.com',
      firstName: 'Access',
      lastName: 'Reviewer',
      roles: [{ ...this.getRoleById('reviewer') }],
      isActive: true,
      lastLogin: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '4',
      email: 'auditor@surveysparrow.com',
      firstName: 'Compliance',
      lastName: 'Auditor',
      roles: [{ ...this.getRoleById('auditor') }],
      isActive: true,
      lastLogin: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '5',
      email: 'tool.admin@surveysparrow.com',
      firstName: 'Tool',
      lastName: 'Administrator',
      roles: [{ ...this.getRoleById('tool-admin') }],
      isActive: true,
      lastLogin: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  // Get role by ID (mock implementation)
  private getRoleById(roleId: string): Role {
    const { IGA_ROLES } = require('../types/rbac');
    return IGA_ROLES.find((role: Role) => role.id === roleId) || IGA_ROLES[0];
  }

  // Login with credentials
  public async login(credentials: LoginCredentials): Promise<{ success: boolean; error?: string }> {
    this.updateState({ isLoading: true, error: null });

    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Find user by email
      const user = this.mockUsers.find(u => 
        u.email.toLowerCase() === credentials.email.toLowerCase() && u.isActive
      );

      if (!user) {
        this.updateState({ isLoading: false, error: 'Invalid email or password' });
        return { success: false, error: 'Invalid email or password' };
      }

      // Mock password validation (in real app, this would be hashed)
      const validPassword = credentials.password === 'password' || 
                           credentials.password === 'admin123' ||
                           credentials.password === 'demo123';

      if (!validPassword) {
        this.updateState({ isLoading: false, error: 'Invalid email or password' });
        return { success: false, error: 'Invalid email or password' };
      }

      // Mock MFA validation (in real app, this would be real MFA)
      if (credentials.mfaCode && credentials.mfaCode !== '123456') {
        this.updateState({ isLoading: false, error: 'Invalid MFA code' });
        return { success: false, error: 'Invalid MFA code' };
      }

      // Create session
      const session: AuthSession = {
        user: {
          ...user,
          lastLogin: new Date().toISOString(),
        },
        token: this.generateToken(),
        expiresAt: new Date(Date.now() + (credentials.rememberMe ? 30 : 8) * 60 * 60 * 1000).toISOString(), // 8 hours or 30 days
        lastActivity: new Date().toISOString(),
        ipAddress: '127.0.0.1', // In real app, get from request
        userAgent: navigator.userAgent,
      };

      // Store session
      localStorage.setItem('iga_session', JSON.stringify(session));

      // Update state
      this.updateState({
        isAuthenticated: true,
        user: session.user,
        session,
        isLoading: false,
        error: null,
      });

      // Log successful login
      this.logActivity('LOGIN', 'User logged in successfully', session.user.id);

      return { success: true };
    } catch (error) {
      this.updateState({ isLoading: false, error: 'Login failed. Please try again.' });
      return { success: false, error: 'Login failed. Please try again.' };
    }
  }

  // Logout
  public logout(): void {
    if (this.authState.user) {
      this.logActivity('LOGOUT', 'User logged out', this.authState.user.id);
    }

    localStorage.removeItem('iga_session');
    this.updateState({
      isAuthenticated: false,
      user: null,
      session: null,
      isLoading: false,
      error: null,
    });
  }

  // Check if user has permission
  public hasPermission(permissionId: string): boolean {
    if (!this.authState.user) return false;
    return hasPermission(this.authState.user, permissionId);
  }

  // Check if user has any of the specified permissions
  public hasAnyPermission(permissionIds: string[]): boolean {
    if (!this.authState.user) return false;
    return permissionIds.some(permissionId => this.hasPermission(permissionId));
  }

  // Check if user has all specified permissions
  public hasAllPermissions(permissionIds: string[]): boolean {
    if (!this.authState.user) return false;
    return permissionIds.every(permissionId => this.hasPermission(permissionId));
  }

  // Update last activity
  public updateLastActivity(): void {
    if (this.authState.session) {
      this.authState.session.lastActivity = new Date().toISOString();
      localStorage.setItem('iga_session', JSON.stringify(this.authState.session));
    }
  }

  // Generate mock JWT token
  private generateToken(): string {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(JSON.stringify({ 
      sub: this.authState.user?.id,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (8 * 60 * 60), // 8 hours
    }));
    const signature = btoa('mock-signature');
    return `${header}.${payload}.${signature}`;
  }

  // Log activity for audit trail
  private logActivity(action: string, description: string, userId: string): void {
    const activity = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      action,
      description,
      userId,
      ipAddress: '127.0.0.1',
      userAgent: navigator.userAgent,
    };

    // Store in localStorage for demo (in real app, send to API)
    const existingLogs = JSON.parse(localStorage.getItem('iga_audit_logs') || '[]');
    existingLogs.unshift(activity);
    localStorage.setItem('iga_audit_logs', JSON.stringify(existingLogs.slice(0, 1000))); // Keep last 1000 entries
  }

  // Get audit logs
  public getAuditLogs(): any[] {
    return JSON.parse(localStorage.getItem('iga_audit_logs') || '[]');
  }

  // Refresh session
  public async refreshSession(): Promise<boolean> {
    if (!this.authState.session) return false;

    try {
      // In real app, this would call the API to refresh the token
      const newSession = {
        ...this.authState.session,
        token: this.generateToken(),
        expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
        lastActivity: new Date().toISOString(),
      };

      localStorage.setItem('iga_session', JSON.stringify(newSession));
      this.updateState({ session: newSession });
      return true;
    } catch (error) {
      this.logout();
      return false;
    }
  }
}

export default AuthService.getInstance();
