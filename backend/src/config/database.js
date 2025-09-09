import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
import mockDB from './mockDatabase.js';

dotenv.config();

// Check if we should use mock database (only for development)
const useMockDB = process.env.NODE_ENV === 'development' && (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('mock'));

let pool;

if (useMockDB) {
  console.log('🔧 Using Mock Database for development');
  pool = mockDB;
} else {
  // Database connection configuration
  const dbConfig = {
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: 20, // Maximum number of clients in the pool
    idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
    connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
  };

  // Create connection pool
  pool = new Pool(dbConfig);
}

// Test database connection
export const connectDB = async () => {
  try {
    if (useMockDB) {
      await pool.connect();
      console.log('✅ Connected to Mock Database');
      return;
    }

    const client = await pool.connect();
    console.log('✅ Connected to Neon PostgreSQL database');
    
    // Test query
    const result = await client.query('SELECT NOW()');
    console.log('📅 Database time:', result.rows[0].now);
    
    client.release();
    
    // Initialize database schema
    await initializeSchema();
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    throw error;
  }
};

// Initialize database schema
const initializeSchema = async () => {
  try {
    const client = await pool.connect();
    
    // Create tables if they don't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        role_id UUID,
        is_active BOOLEAN DEFAULT true,
        last_login TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS roles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) UNIQUE NOT NULL,
        description TEXT,
        permissions JSONB DEFAULT '[]',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id),
        action VARCHAR(100) NOT NULL,
        resource VARCHAR(100) NOT NULL,
        resource_id VARCHAR(255),
        details JSONB DEFAULT '{}',
        ip_address INET,
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS policies (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        policy_type VARCHAR(100) NOT NULL,
        rules JSONB DEFAULT '{}',
        severity VARCHAR(20) DEFAULT 'medium',
        is_active BOOLEAN DEFAULT true,
        created_by UUID REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS policy_violations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        policy_id UUID REFERENCES policies(id),
        user_id UUID REFERENCES users(id),
        violation_type VARCHAR(100) NOT NULL,
        details JSONB DEFAULT '{}',
        status VARCHAR(20) DEFAULT 'open',
        resolved_at TIMESTAMP,
        resolved_by UUID REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Create indexes for better performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_role_id ON users(role_id);
      CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
      CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
      CREATE INDEX IF NOT EXISTS idx_policy_violations_policy_id ON policy_violations(policy_id);
      CREATE INDEX IF NOT EXISTS idx_policy_violations_user_id ON policy_violations(user_id);
    `);
    
    // Insert default roles if they don't exist
    await client.query(`
      INSERT INTO roles (name, description, permissions) VALUES
      ('super_admin', 'Super Administrator with full system access', '["*"]'),
      ('admin', 'Administrator with management access', '["users:read", "users:write", "roles:read", "roles:write", "audit:read", "policies:read", "policies:write"]'),
      ('manager', 'Manager with team oversight', '["users:read", "audit:read", "policies:read"]'),
      ('user', 'Standard user with basic access', '["profile:read", "profile:write"]')
      ON CONFLICT (name) DO NOTHING;
    `);
    
    // Insert default admin user if no users exist
    const userCount = await client.query('SELECT COUNT(*) FROM users');
    if (parseInt(userCount.rows[0].count) === 0) {
      const bcrypt = await import('bcryptjs');
      const hashedPassword = await bcrypt.default.hash('admin123', 10);
      
      await client.query(`
        INSERT INTO users (email, password_hash, first_name, last_name, role_id)
        VALUES (
          'admin@sparrowvision.com',
          $1,
          'System',
          'Administrator',
          (SELECT id FROM roles WHERE name = 'super_admin')
        );
      `, [hashedPassword]);
      
      console.log('👤 Default admin user created: admin@sparrowvision.com / admin123');
    }
    
    client.release();
    console.log('📋 Database schema initialized successfully');
    
  } catch (error) {
    console.error('❌ Schema initialization failed:', error.message);
    throw error;
  }
};

// Query helper function
export const query = async (text, params) => {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
};

// Transaction helper function
export const transaction = async (callback) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export default pool;
