import express from 'express';
import { query } from '../config/database.js';
import { authenticateToken, requirePermission } from '../middleware/auth.js';

const router = express.Router();

// Get all roles
router.get('/', authenticateToken, requirePermission('roles:read'), async (req, res) => {
  try {
    const rolesResult = await query(`
      SELECT 
        r.*,
        COUNT(u.id) as user_count
      FROM roles r
      LEFT JOIN users u ON r.id = u.role_id AND u.is_active = true
      WHERE r.is_active = true
      GROUP BY r.id
      ORDER BY r.created_at DESC
    `);

    res.json({
      roles: rolesResult.rows
    });

  } catch (error) {
    console.error('Roles fetch error:', error);
    res.status(500).json({
      error: 'Failed to fetch roles',
      message: 'An error occurred while fetching roles'
    });
  }
});

export default router;
