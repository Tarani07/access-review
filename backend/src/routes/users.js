import express from 'express';
import { query } from '../config/database.js';
import { authenticateToken, requirePermission } from '../middleware/auth.js';

const router = express.Router();

// Get all users
router.get('/', authenticateToken, requirePermission('users:read'), async (req, res) => {
  try {
    const { page = 1, limit = 20, search, role } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE u.is_active = true';
    const params = [];
    let paramCount = 0;

    if (search) {
      paramCount++;
      whereClause += ` AND (u.first_name ILIKE $${paramCount} OR u.last_name ILIKE $${paramCount} OR u.email ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    if (role) {
      paramCount++;
      whereClause += ` AND r.name = $${paramCount}`;
      params.push(role);
    }

    // Get total count
    const countResult = await query(`
      SELECT COUNT(*) as count 
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      ${whereClause}
    `, params);

    const totalCount = parseInt(countResult.rows[0].count);

    // Get users with pagination
    const usersResult = await query(`
      SELECT 
        u.id,
        u.email,
        u.first_name,
        u.last_name,
        u.is_active,
        u.last_login,
        u.created_at,
        u.updated_at,
        r.name as role_name,
        r.permissions
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      ${whereClause}
      ORDER BY u.created_at DESC
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `, [...params, limit, offset]);

    res.json({
      users: usersResult.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    });

  } catch (error) {
    console.error('Users fetch error:', error);
    res.status(500).json({
      error: 'Failed to fetch users',
      message: 'An error occurred while fetching users'
    });
  }
});

export default router;
