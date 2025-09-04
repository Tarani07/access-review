// Role-Based Access Control (RBAC) Types for IGA Tool

export interface Permission {
  id: string;
  name: string;
  description: string;
  resource: string;
  action: string;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  isSystemRole: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: Role[];
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AccessRequest {
  id: string;
  userId: string;
  resource: string;
  requestedPermissions: Permission[];
  justification: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
  requestedBy: string;
  approvedBy?: string;
  approvedAt?: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Policy {
  id: string;
  name: string;
  description: string;
  rules: PolicyRule[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PolicyRule {
  id: string;
  condition: string;
  action: 'ALLOW' | 'DENY' | 'REQUIRE_APPROVAL';
  priority: number;
}

// Predefined permissions for IGA operations
export const IGA_PERMISSIONS: Permission[] = [
  // User Management
  { id: 'user:read', name: 'View Users', description: 'View user information and access rights', resource: 'users', action: 'read' },
  { id: 'user:create', name: 'Create Users', description: 'Create new user accounts', resource: 'users', action: 'create' },
  { id: 'user:update', name: 'Update Users', description: 'Modify user information and roles', resource: 'users', action: 'update' },
  { id: 'user:delete', name: 'Delete Users', description: 'Remove user accounts', resource: 'users', action: 'delete' },
  
  // Access Review
  { id: 'access:read', name: 'View Access Reviews', description: 'View access review results and reports', resource: 'access_reviews', action: 'read' },
  { id: 'access:create', name: 'Create Access Reviews', description: 'Initiate new access reviews', resource: 'access_reviews', action: 'create' },
  { id: 'access:approve', name: 'Approve Access', description: 'Approve or reject access requests', resource: 'access_reviews', action: 'approve' },
  { id: 'access:revoke', name: 'Revoke Access', description: 'Remove user access from systems', resource: 'access_reviews', action: 'revoke' },
  
  // Tool Management
  { id: 'tool:read', name: 'View Tools', description: 'View configured tools and integrations', resource: 'tools', action: 'read' },
  { id: 'tool:create', name: 'Add Tools', description: 'Add new tools and integrations', resource: 'tools', action: 'create' },
  { id: 'tool:update', name: 'Update Tools', description: 'Modify tool configurations', resource: 'tools', action: 'update' },
  { id: 'tool:delete', name: 'Delete Tools', description: 'Remove tools and integrations', resource: 'tools', action: 'delete' },
  { id: 'tool:test', name: 'Test Connections', description: 'Test API connections and integrations', resource: 'tools', action: 'test' },
  
  // Audit and Compliance
  { id: 'audit:read', name: 'View Audit Logs', description: 'View audit logs and compliance reports', resource: 'audit', action: 'read' },
  { id: 'audit:export', name: 'Export Audit Data', description: 'Export audit logs and reports', resource: 'audit', action: 'export' },
  
  // Policy Management
  { id: 'policy:read', name: 'View Policies', description: 'View access policies and rules', resource: 'policies', action: 'read' },
  { id: 'policy:create', name: 'Create Policies', description: 'Create new access policies', resource: 'policies', action: 'create' },
  { id: 'policy:update', name: 'Update Policies', description: 'Modify existing policies', resource: 'policies', action: 'update' },
  { id: 'policy:delete', name: 'Delete Policies', description: 'Remove access policies', resource: 'policies', action: 'delete' },
  
  // System Administration
  { id: 'system:admin', name: 'System Administration', description: 'Full system administration access', resource: 'system', action: 'admin' },
  { id: 'system:config', name: 'System Configuration', description: 'Configure system settings', resource: 'system', action: 'config' },
];

// Predefined roles for IGA operations
export const IGA_ROLES: Role[] = [
  {
    id: 'super-admin',
    name: 'Super Administrator',
    description: 'Full access to all IGA functions and system administration',
    permissions: IGA_PERMISSIONS,
    isSystemRole: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'access-admin',
    name: 'Access Administrator',
    description: 'Manage user access, conduct reviews, and handle approvals',
    permissions: IGA_PERMISSIONS.filter(p => 
      p.resource === 'users' || 
      p.resource === 'access_reviews' || 
      p.resource === 'audit' ||
      p.id === 'tool:read'
    ),
    isSystemRole: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'reviewer',
    name: 'Access Reviewer',
    description: 'Review and approve access requests, view audit logs',
    permissions: IGA_PERMISSIONS.filter(p => 
      p.id === 'access:read' ||
      p.id === 'access:approve' ||
      p.id === 'audit:read' ||
      p.id === 'user:read'
    ),
    isSystemRole: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'auditor',
    name: 'Compliance Auditor',
    description: 'View audit logs, generate compliance reports, export data',
    permissions: IGA_PERMISSIONS.filter(p => 
      p.resource === 'audit' ||
      p.id === 'access:read' ||
      p.id === 'user:read'
    ),
    isSystemRole: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'tool-admin',
    name: 'Tool Administrator',
    description: 'Manage tool integrations and configurations',
    permissions: IGA_PERMISSIONS.filter(p => 
      p.resource === 'tools' ||
      p.id === 'audit:read'
    ),
    isSystemRole: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Helper functions for RBAC
export const hasPermission = (user: User, permissionId: string): boolean => {
  return user.roles.some(role => 
    role.permissions.some(permission => permission.id === permissionId)
  );
};

export const hasAnyPermission = (user: User, permissionIds: string[]): boolean => {
  return permissionIds.some(permissionId => hasPermission(user, permissionId));
};

export const hasAllPermissions = (user: User, permissionIds: string[]): boolean => {
  return permissionIds.every(permissionId => hasPermission(user, permissionId));
};

export const getUserPermissions = (user: User): Permission[] => {
  const permissions = new Map<string, Permission>();
  user.roles.forEach(role => {
    role.permissions.forEach(permission => {
      permissions.set(permission.id, permission);
    });
  });
  return Array.from(permissions.values());
};

export const canAccessResource = (user: User, resource: string, action: string): boolean => {
  return user.roles.some(role => 
    role.permissions.some(permission => 
      permission.resource === resource && permission.action === action
    )
  );
};
