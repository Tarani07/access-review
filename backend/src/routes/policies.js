import express from 'express';
import { query } from '../config/database.js';
import { authenticateToken, requirePermission } from '../middleware/auth.js';

const router = express.Router();

// Get all policies
router.get('/', authenticateToken, requirePermission('policies:read'), async (req, res) => {
  try {
    const policiesResult = await query(`
      SELECT 
        p.*,
        u.first_name as created_by_name,
        u.last_name as created_by_last_name,
        COUNT(pv.id) as violation_count
      FROM policies p
      LEFT JOIN users u ON p.created_by = u.id
      LEFT JOIN policy_violations pv ON p.id = pv.policy_id
      WHERE p.is_active = true
      GROUP BY p.id, u.first_name, u.last_name
      ORDER BY p.created_at DESC
    `);

    res.json({
      policies: policiesResult.rows
    });

  } catch (error) {
    console.error('Policies fetch error:', error);
    res.status(500).json({
      error: 'Failed to fetch policies',
      message: 'An error occurred while fetching policies'
    });
  }
});

// Get policy violations
router.get('/violations', authenticateToken, requirePermission('policies:read'), async (req, res) => {
  try {
    const { page = 1, limit = 20, status, policyId } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramCount = 0;

    if (status) {
      paramCount++;
      whereClause += ` AND pv.status = $${paramCount}`;
      params.push(status);
    }

    if (policyId) {
      paramCount++;
      whereClause += ` AND pv.policy_id = $${paramCount}`;
      params.push(policyId);
    }

    // Get total count
    const countResult = await query(`
      SELECT COUNT(*) as count 
      FROM policy_violations pv
      ${whereClause}
    `, params);

    const totalCount = parseInt(countResult.rows[0].count);

    // Get violations with pagination
    const violationsResult = await query(`
      SELECT 
        pv.*,
        p.name as policy_name,
        p.policy_type,
        u.first_name,
        u.last_name,
        u.email
      FROM policy_violations pv
      LEFT JOIN policies p ON pv.policy_id = p.id
      LEFT JOIN users u ON pv.user_id = u.id
      ${whereClause}
      ORDER BY pv.created_at DESC
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `, [...params, limit, offset]);

    res.json({
      violations: violationsResult.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    });

  } catch (error) {
    console.error('Policy violations error:', error);
    res.status(500).json({
      error: 'Failed to fetch policy violations',
      message: 'An error occurred while fetching policy violations'
    });
  }
});

export default router;
