// Mock database for development and testing
export class MockDatabase {
  constructor() {
    this.data = {
      users: [
        {
          id: '1',
          email: 'admin@sparrowvision.com',
          password_hash: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
          first_name: 'System',
          last_name: 'Administrator',
          role_id: '1',
          is_active: true,
          last_login: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ],
      roles: [
        {
          id: '1',
          name: 'super_admin',
          description: 'Super Administrator with full system access',
          permissions: ['*'],
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '2',
          name: 'admin',
          description: 'Administrator with management access',
          permissions: ['users:read', 'users:write', 'roles:read', 'roles:write', 'audit:read', 'policies:read', 'policies:write'],
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '3',
          name: 'manager',
          description: 'Manager with team oversight',
          permissions: ['users:read', 'audit:read', 'policies:read'],
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '4',
          name: 'user',
          description: 'Standard user with basic access',
          permissions: ['profile:read', 'profile:write'],
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ],
      audit_logs: [
        {
          id: '1',
          user_id: '1',
          action: 'login',
          resource: 'auth',
          resource_id: null,
          details: { email: 'admin@sparrowvision.com' },
          ip_address: '127.0.0.1',
          user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          user_id: '1',
          action: 'view_dashboard',
          resource: 'dashboard',
          resource_id: null,
          details: { page: 'main' },
          ip_address: '127.0.0.1',
          user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
          created_at: new Date().toISOString()
        }
      ],
      policies: [
        {
          id: '1',
          name: 'Password Policy',
          description: 'Strong password requirements',
          policy_type: 'security',
          rules: { minLength: 8, requireSpecialChars: true },
          severity: 'high',
          is_active: true,
          created_by: '1',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '2',
          name: 'Access Review Policy',
          description: 'Regular access reviews required',
          policy_type: 'governance',
          rules: { reviewFrequency: 'quarterly' },
          severity: 'medium',
          is_active: true,
          created_by: '1',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ],
      policy_violations: [
        {
          id: '1',
          policy_id: '1',
          user_id: '1',
          violation_type: 'weak_password',
          details: { passwordStrength: 'weak' },
          status: 'open',
          resolved_at: null,
          resolved_by: null,
          created_at: new Date().toISOString()
        }
      ]
    };
  }

  async query(text, params = []) {
    // Mock query execution
    console.log('Mock Query:', text, params);
    
    // Simple query parsing for mock responses
    if (text.includes('SELECT COUNT(*)')) {
      const table = this.extractTableName(text);
      const count = this.data[table]?.length || 0;
      return { rows: [{ count: count.toString() }] };
    }
    
    if (text.includes('SELECT') && text.includes('FROM users')) {
      return { rows: this.data.users };
    }
    
    if (text.includes('SELECT') && text.includes('FROM roles')) {
      return { rows: this.data.roles };
    }
    
    if (text.includes('SELECT') && text.includes('FROM audit_logs')) {
      return { rows: this.data.audit_logs };
    }
    
    if (text.includes('SELECT') && text.includes('FROM policies')) {
      return { rows: this.data.policies };
    }
    
    if (text.includes('SELECT') && text.includes('FROM policy_violations')) {
      return { rows: this.data.policy_violations };
    }
    
    if (text.includes('INSERT INTO audit_logs')) {
      const newLog = {
        id: Date.now().toString(),
        user_id: params[0],
        action: params[1],
        resource: params[2],
        details: JSON.parse(params[3] || '{}'),
        ip_address: params[4],
        user_agent: params[5],
        created_at: new Date().toISOString()
      };
      this.data.audit_logs.push(newLog);
      return { rows: [newLog] };
    }
    
    return { rows: [] };
  }

  extractTableName(query) {
    const match = query.match(/FROM\s+(\w+)/i);
    return match ? match[1] : 'users';
  }

  async connect() {
    console.log('✅ Connected to Mock Database');
    return true;
  }
}

// Create singleton instance
const mockDB = new MockDatabase();
export default mockDB;
