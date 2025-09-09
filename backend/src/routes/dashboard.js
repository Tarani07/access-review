import express from 'express';
import { query } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get dashboard statistics
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    // Get user count
    const userCountResult = await query('SELECT COUNT(*) as count FROM users WHERE is_active = true');
    const userCount = parseInt(userCountResult.rows[0].count);

    // Get role count
    const roleCountResult = await query('SELECT COUNT(*) as count FROM roles WHERE is_active = true');
    const roleCount = parseInt(roleCountResult.rows[0].count);

    // Get policy count
    const policyCountResult = await query('SELECT COUNT(*) as count FROM policies WHERE is_active = true');
    const policyCount = parseInt(policyCountResult.rows[0].count);

    // Get violation count
    const violationCountResult = await query(`
      SELECT COUNT(*) as count 
      FROM policy_violations 
      WHERE status = 'open'
    `);
    const violationCount = parseInt(violationCountResult.rows[0].count);

    // Get recent audit logs count (last 24 hours)
    const recentAuditResult = await query(`
      SELECT COUNT(*) as count 
      FROM audit_logs 
      WHERE created_at >= NOW() - INTERVAL '24 hours'
    `);
    const recentAuditCount = parseInt(recentAuditResult.rows[0].count);

    // Get user activity (last 7 days)
    const activityResult = await query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count
      FROM audit_logs 
      WHERE created_at >= NOW() - INTERVAL '7 days'
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `);

    // Get top users by activity
    const topUsersResult = await query(`
      SELECT 
        u.first_name,
        u.last_name,
        u.email,
        COUNT(al.id) as activity_count
      FROM users u
      LEFT JOIN audit_logs al ON u.id = al.user_id
      WHERE al.created_at >= NOW() - INTERVAL '7 days'
      GROUP BY u.id, u.first_name, u.last_name, u.email
      ORDER BY activity_count DESC
      LIMIT 5
    `);

    // Get recent violations
    const recentViolationsResult = await query(`
      SELECT 
        pv.id,
        pv.violation_type,
        pv.status,
        pv.created_at,
        p.name as policy_name,
        u.first_name,
        u.last_name,
        u.email
      FROM policy_violations pv
      LEFT JOIN policies p ON pv.policy_id = p.id
      LEFT JOIN users u ON pv.user_id = u.id
      ORDER BY pv.created_at DESC
      LIMIT 10
    `);

    // Get system health metrics
    const healthMetrics = {
      database: 'healthy',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      timestamp: new Date().toISOString()
    };

    res.json({
      stats: {
        users: userCount,
        roles: roleCount,
        policies: policyCount,
        violations: violationCount,
        recentAudit: recentAuditCount
      },
      activity: activityResult.rows,
      topUsers: topUsersResult.rows,
      recentViolations: recentViolationsResult.rows,
      health: healthMetrics
    });

  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      error: 'Failed to fetch dashboard statistics',
      message: 'An error occurred while fetching dashboard data'
    });
  }
});

// Get audit logs for dashboard
router.get('/audit-logs', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20, action, resource } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramCount = 0;

    if (action) {
      paramCount++;
      whereClause += ` AND action = $${paramCount}`;
      params.push(action);
    }

    if (resource) {
      paramCount++;
      whereClause += ` AND resource = $${paramCount}`;
      params.push(resource);
    }

    // Get total count
    const countResult = await query(`
      SELECT COUNT(*) as count 
      FROM audit_logs 
      ${whereClause}
    `, params);

    const totalCount = parseInt(countResult.rows[0].count);

    // Get audit logs with pagination
    const auditLogsResult = await query(`
      SELECT 
        al.*,
        u.first_name,
        u.last_name,
        u.email
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      ${whereClause}
      ORDER BY al.created_at DESC
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `, [...params, limit, offset]);

    res.json({
      logs: auditLogsResult.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    });

  } catch (error) {
    console.error('Audit logs error:', error);
    res.status(500).json({
      error: 'Failed to fetch audit logs',
      message: 'An error occurred while fetching audit logs'
    });
  }
});

// Get risk assessment data
router.get('/risk-assessment', authenticateToken, async (req, res) => {
  try {
    // Get violation trends
    const violationTrendsResult = await query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count,
        violation_type
      FROM policy_violations 
      WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY DATE(created_at), violation_type
      ORDER BY date DESC
    `);

    // Get high-risk users
    const highRiskUsersResult = await query(`
      SELECT 
        u.id,
        u.first_name,
        u.last_name,
        u.email,
        COUNT(pv.id) as violation_count,
        MAX(pv.created_at) as last_violation
      FROM users u
      LEFT JOIN policy_violations pv ON u.id = pv.user_id
      WHERE pv.status = 'open' OR pv.created_at >= NOW() - INTERVAL '7 days'
      GROUP BY u.id, u.first_name, u.last_name, u.email
      HAVING COUNT(pv.id) > 0
      ORDER BY violation_count DESC
      LIMIT 10
    `);

    // Get policy compliance rates
    const complianceResult = await query(`
      SELECT 
        p.id,
        p.name,
        p.policy_type,
        COUNT(pv.id) as total_violations,
        COUNT(CASE WHEN pv.status = 'open' THEN 1 END) as open_violations,
        ROUND(
          (COUNT(CASE WHEN pv.status = 'resolved' THEN 1 END)::float / 
           NULLIF(COUNT(pv.id), 0) * 100), 2
        ) as compliance_rate
      FROM policies p
      LEFT JOIN policy_violations pv ON p.id = pv.policy_id
      WHERE p.is_active = true
      GROUP BY p.id, p.name, p.policy_type
      ORDER BY compliance_rate ASC
    `);

    res.json({
      violationTrends: violationTrendsResult.rows,
      highRiskUsers: highRiskUsersResult.rows,
      compliance: complianceResult.rows
    });

  } catch (error) {
    console.error('Risk assessment error:', error);
    res.status(500).json({
      error: 'Failed to fetch risk assessment data',
      message: 'An error occurred while fetching risk assessment data'
    });
  }
});

export default router;
