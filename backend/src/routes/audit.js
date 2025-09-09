import express from 'express';
import { query } from '../config/database.js';
import { authenticateToken, requirePermission } from '../middleware/auth.js';

const router = express.Router();

// Get audit logs
router.get('/', authenticateToken, requirePermission('audit:read'), async (req, res) => {
  try {
    const { page = 1, limit = 50, action, resource, userId, startDate, endDate } = req.query;
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

    if (userId) {
      paramCount++;
      whereClause += ` AND user_id = $${paramCount}`;
      params.push(userId);
    }

    if (startDate) {
      paramCount++;
      whereClause += ` AND created_at >= $${paramCount}`;
      params.push(startDate);
    }

    if (endDate) {
      paramCount++;
      whereClause += ` AND created_at <= $${paramCount}`;
      params.push(endDate);
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

export default router;
