import express from 'express';
import { query } from '../config/database.js';
import { authenticateToken, requirePermission } from '../middleware/auth.js';

const router = express.Router();

// Get all dynamic reports for a user
router.get('/', authenticateToken, requirePermission('reports:read'), async (req, res) => {
  try {
    const { page = 1, limit = 20, type, status } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE created_by = $1';
    const params = [req.user.id];
    let paramCount = 1;

    if (type && type !== 'all') {
      paramCount++;
      whereClause += ` AND type = $${paramCount}`;
      params.push(type);
    }

    if (status && status !== 'all') {
      paramCount++;
      whereClause += ` AND status = $${paramCount}`;
      params.push(status);
    }

    // Get total count
    const countResult = await query(`
      SELECT COUNT(*) as count 
      FROM dynamic_reports 
      ${whereClause}
    `, params);

    const totalCount = parseInt(countResult.rows[0].count);

    // Get reports with pagination
    const reportsResult = await query(`
      SELECT 
        dr.*,
        u.first_name,
        u.last_name,
        u.email as creator_email
      FROM dynamic_reports dr
      LEFT JOIN users u ON dr.created_by = u.id
      ${whereClause}
      ORDER BY dr.created_at DESC
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `, [...params, limit, offset]);

    res.json({
      reports: reportsResult.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    });

  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({
      error: 'Failed to fetch reports',
      message: 'An error occurred while fetching reports'
    });
  }
});

// Create a new dynamic report
router.post('/', authenticateToken, requirePermission('reports:create'), async (req, res) => {
  try {
    const {
      name,
      description,
      type,
      template,
      filters,
      columns,
      charts,
      schedule
    } = req.body;

    if (!name || !type) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Name and type are required'
      });
    }

    const result = await query(`
      INSERT INTO dynamic_reports (
        name, description, type, template, filters, columns, charts, schedule,
        created_by, created_at, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), 'active')
      RETURNING *
    `, [
      name,
      description,
      type,
      JSON.stringify(template),
      JSON.stringify(filters),
      JSON.stringify(columns),
      JSON.stringify(charts),
      JSON.stringify(schedule),
      req.user.id
    ]);

    const newReport = result.rows[0];
    
    // Parse JSON fields for response
    newReport.template = JSON.parse(newReport.template || '{}');
    newReport.filters = JSON.parse(newReport.filters || '[]');
    newReport.columns = JSON.parse(newReport.columns || '[]');
    newReport.charts = JSON.parse(newReport.charts || '[]');
    newReport.schedule = JSON.parse(newReport.schedule || '{}');

    res.status(201).json(newReport);

  } catch (error) {
    console.error('Create report error:', error);
    res.status(500).json({
      error: 'Failed to create report',
      message: 'An error occurred while creating the report'
    });
  }
});

// Get a specific report
router.get('/:id', authenticateToken, requirePermission('reports:read'), async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(`
      SELECT 
        dr.*,
        u.first_name,
        u.last_name,
        u.email as creator_email
      FROM dynamic_reports dr
      LEFT JOIN users u ON dr.created_by = u.id
      WHERE dr.id = $1 AND (dr.created_by = $2 OR $3)
    `, [id, req.user.id, req.user.permissions.includes('reports:read_all')]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Report not found',
        message: 'The requested report could not be found'
      });
    }

    const report = result.rows[0];
    
    // Parse JSON fields
    report.template = JSON.parse(report.template || '{}');
    report.filters = JSON.parse(report.filters || '[]');
    report.columns = JSON.parse(report.columns || '[]');
    report.charts = JSON.parse(report.charts || '[]');
    report.schedule = JSON.parse(report.schedule || '{}');

    res.json(report);

  } catch (error) {
    console.error('Get report error:', error);
    res.status(500).json({
      error: 'Failed to fetch report',
      message: 'An error occurred while fetching the report'
    });
  }
});

// Update a report
router.put('/:id', authenticateToken, requirePermission('reports:update'), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      type,
      template,
      filters,
      columns,
      charts,
      schedule,
      status
    } = req.body;

    // Check if user owns the report or has admin permissions
    const checkResult = await query(`
      SELECT * FROM dynamic_reports 
      WHERE id = $1 AND (created_by = $2 OR $3)
    `, [id, req.user.id, req.user.permissions.includes('reports:update_all')]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Report not found',
        message: 'The requested report could not be found or you do not have permission to update it'
      });
    }

    const result = await query(`
      UPDATE dynamic_reports 
      SET 
        name = COALESCE($2, name),
        description = COALESCE($3, description),
        type = COALESCE($4, type),
        template = COALESCE($5, template),
        filters = COALESCE($6, filters),
        columns = COALESCE($7, columns),
        charts = COALESCE($8, charts),
        schedule = COALESCE($9, schedule),
        status = COALESCE($10, status),
        updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `, [
      id,
      name,
      description,
      type,
      template ? JSON.stringify(template) : null,
      filters ? JSON.stringify(filters) : null,
      columns ? JSON.stringify(columns) : null,
      charts ? JSON.stringify(charts) : null,
      schedule ? JSON.stringify(schedule) : null,
      status
    ]);

    const updatedReport = result.rows[0];
    
    // Parse JSON fields for response
    updatedReport.template = JSON.parse(updatedReport.template || '{}');
    updatedReport.filters = JSON.parse(updatedReport.filters || '[]');
    updatedReport.columns = JSON.parse(updatedReport.columns || '[]');
    updatedReport.charts = JSON.parse(updatedReport.charts || '[]');
    updatedReport.schedule = JSON.parse(updatedReport.schedule || '{}');

    res.json(updatedReport);

  } catch (error) {
    console.error('Update report error:', error);
    res.status(500).json({
      error: 'Failed to update report',
      message: 'An error occurred while updating the report'
    });
  }
});

// Delete a report
router.delete('/:id', authenticateToken, requirePermission('reports:delete'), async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user owns the report or has admin permissions
    const checkResult = await query(`
      SELECT * FROM dynamic_reports 
      WHERE id = $1 AND (created_by = $2 OR $3)
    `, [id, req.user.id, req.user.permissions.includes('reports:delete_all')]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Report not found',
        message: 'The requested report could not be found or you do not have permission to delete it'
      });
    }

    // Delete associated report results first
    await query('DELETE FROM report_results WHERE report_id = $1', [id]);

    // Delete the report
    await query('DELETE FROM dynamic_reports WHERE id = $1', [id]);

    res.json({
      message: 'Report deleted successfully'
    });

  } catch (error) {
    console.error('Delete report error:', error);
    res.status(500).json({
      error: 'Failed to delete report',
      message: 'An error occurred while deleting the report'
    });
  }
});

// Generate report data
router.post('/:id/generate', authenticateToken, requirePermission('reports:generate'), async (req, res) => {
  try {
    const { id } = req.params;
    const { dateRange } = req.body;

    // Get the report configuration
    const reportResult = await query(`
      SELECT * FROM dynamic_reports 
      WHERE id = $1 AND (created_by = $2 OR $3) AND status = 'active'
    `, [id, req.user.id, req.user.permissions.includes('reports:generate_all')]);

    if (reportResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Report not found',
        message: 'The requested report could not be found or is inactive'
      });
    }

    const report = reportResult.rows[0];
    
    // Parse JSON fields
    const filters = JSON.parse(report.filters || '[]');
    const columns = JSON.parse(report.columns || '[]');

    // Generate the actual report data based on type
    let data = [];
    let insights = [];
    let recommendations = [];

    switch (report.type) {
      case 'user_access':
        data = await generateUserAccessReport(filters, dateRange);
        insights = generateUserAccessInsights(data);
        break;
      case 'audit':
        data = await generateAuditReport(filters, dateRange);
        insights = generateAuditInsights(data);
        break;
      case 'compliance':
        data = await generateComplianceReport(filters, dateRange);
        insights = generateComplianceInsights(data);
        break;
      case 'activity':
        data = await generateActivityReport(filters, dateRange);
        insights = generateActivityInsights(data);
        break;
      default:
        data = await generateCustomReport(report, dateRange);
        insights = ['Custom report generated successfully'];
    }

    // Create report result record
    const resultId = `result_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const reportResultData = {
      id: resultId,
      reportId: id,
      data: data.slice(0, 1000), // Limit data size
      summary: {
        totalRecords: data.length,
        dateRange: dateRange || { start: '', end: '' },
        generatedAt: new Date().toISOString(),
        filters: filters
      },
      insights,
      recommendations: generateRecommendations(data, report.type)
    };

    // Store the result
    await query(`
      INSERT INTO report_results (id, report_id, data, summary, insights, recommendations, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
    `, [
      resultId,
      id,
      JSON.stringify(reportResultData.data),
      JSON.stringify(reportResultData.summary),
      JSON.stringify(insights),
      JSON.stringify(reportResultData.recommendations)
    ]);

    // Update report last_generated timestamp
    await query(`
      UPDATE dynamic_reports 
      SET last_generated = NOW() 
      WHERE id = $1
    `, [id]);

    res.json(reportResultData);

  } catch (error) {
    console.error('Generate report error:', error);
    res.status(500).json({
      error: 'Failed to generate report',
      message: 'An error occurred while generating the report'
    });
  }
});

// Get report results
router.get('/:id/results', authenticateToken, requirePermission('reports:read'), async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    // Verify user has access to the report
    const reportCheck = await query(`
      SELECT id FROM dynamic_reports 
      WHERE id = $1 AND (created_by = $2 OR $3)
    `, [id, req.user.id, req.user.permissions.includes('reports:read_all')]);

    if (reportCheck.rows.length === 0) {
      return res.status(404).json({
        error: 'Report not found',
        message: 'The requested report could not be found'
      });
    }

    const results = await query(`
      SELECT id, summary, insights, recommendations, created_at
      FROM report_results 
      WHERE report_id = $1 
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `, [id, limit, offset]);

    const parsedResults = results.rows.map(row => ({
      ...row,
      summary: JSON.parse(row.summary || '{}'),
      insights: JSON.parse(row.insights || '[]'),
      recommendations: JSON.parse(row.recommendations || '[]')
    }));

    res.json(parsedResults);

  } catch (error) {
    console.error('Get report results error:', error);
    res.status(500).json({
      error: 'Failed to fetch report results',
      message: 'An error occurred while fetching report results'
    });
  }
});

// Helper functions for generating different types of reports
async function generateUserAccessReport(filters, dateRange) {
  // Get users with their roles and permissions
  let whereClause = 'WHERE u.is_active = true';
  const params = [];

  // Apply filters
  filters.forEach((filter, index) => {
    if (filter.field === 'status' && filter.value === 'ACTIVE') {
      // Already handled by is_active = true
      return;
    }
    // Add more filter logic as needed
  });

  const result = await query(`
    SELECT 
      u.id,
      u.email,
      u.first_name,
      u.last_name,
      u.department,
      u.manager,
      u.last_login,
      u.created_at as join_date,
      r.name as role,
      array_agg(DISTINCT p.name) as permissions,
      'SYSTEM' as tool,
      CASE WHEN u.is_active THEN 'ACTIVE' ELSE 'INACTIVE' END as status
    FROM users u
    LEFT JOIN user_roles ur ON u.id = ur.user_id
    LEFT JOIN roles r ON ur.role_id = r.id
    LEFT JOIN role_permissions rp ON r.id = rp.role_id
    LEFT JOIN permissions p ON rp.permission_id = p.id
    ${whereClause}
    GROUP BY u.id, u.email, u.first_name, u.last_name, u.department, u.manager, u.last_login, u.created_at, r.name, u.is_active
  `, params);

  return result.rows;
}

async function generateAuditReport(filters, dateRange) {
  let whereClause = 'WHERE 1=1';
  const params = [];
  let paramCount = 0;

  if (dateRange) {
    if (dateRange.start) {
      paramCount++;
      whereClause += ` AND al.created_at >= $${paramCount}`;
      params.push(dateRange.start);
    }
    if (dateRange.end) {
      paramCount++;
      whereClause += ` AND al.created_at <= $${paramCount}`;
      params.push(dateRange.end);
    }
  }

  const result = await query(`
    SELECT 
      al.*,
      u.email as userEmail
    FROM audit_logs al
    LEFT JOIN users u ON al.user_id = u.id
    ${whereClause}
    ORDER BY al.created_at DESC
    LIMIT 1000
  `, params);

  return result.rows;
}

async function generateComplianceReport(filters, dateRange) {
  // For demo purposes, return mock compliance data
  return [
    {
      complianceType: 'SOX',
      findings: 5,
      violations: 2,
      resolved: 3,
      status: 'IN_PROGRESS'
    },
    {
      complianceType: 'GDPR',
      findings: 3,
      violations: 1,
      resolved: 2,
      status: 'COMPLETED'
    }
  ];
}

async function generateActivityReport(filters, dateRange) {
  let whereClause = 'WHERE 1=1';
  const params = [];
  let paramCount = 0;

  if (dateRange) {
    if (dateRange.start) {
      paramCount++;
      whereClause += ` AND al.created_at >= $${paramCount}`;
      params.push(dateRange.start);
    }
  }

  const result = await query(`
    SELECT 
      u.id as userId,
      u.email as userEmail,
      COUNT(CASE WHEN al.action = 'LOGIN' THEN 1 END) as loginCount,
      COUNT(*) as actionsCount,
      MAX(al.created_at) as lastActivity,
      AVG(CASE WHEN al.severity = 'HIGH' THEN 8 WHEN al.severity = 'MEDIUM' THEN 5 ELSE 2 END) as riskScore
    FROM users u
    LEFT JOIN audit_logs al ON u.id = al.user_id
    ${whereClause}
    GROUP BY u.id, u.email
    HAVING COUNT(al.id) > 0
  `, params);

  return result.rows;
}

async function generateCustomReport(report, dateRange) {
  // For custom reports, return a basic dataset
  return [];
}

function generateUserAccessInsights(data) {
  const insights = [];
  if (data.length > 0) {
    const adminUsers = data.filter(user => user.role === 'Admin');
    insights.push(`${adminUsers.length} users have admin privileges`);
    
    const inactiveUsers = data.filter(user => 
      !user.last_login || new Date(user.last_login) < new Date(Date.now() - 90*24*60*60*1000)
    );
    if (inactiveUsers.length > 0) {
      insights.push(`${inactiveUsers.length} users haven't logged in for 90+ days`);
    }
  }
  return insights;
}

function generateAuditInsights(data) {
  const insights = [];
  if (data.length > 0) {
    const failedEvents = data.filter(event => event.outcome === 'FAILURE');
    insights.push(`${failedEvents.length} failed events detected`);
    
    const highRiskEvents = data.filter(event => event.severity === 'HIGH' || event.severity === 'CRITICAL');
    insights.push(`${highRiskEvents.length} high-risk events identified`);
  }
  return insights;
}

function generateComplianceInsights(data) {
  return ['Compliance report generated successfully'];
}

function generateActivityInsights(data) {
  const insights = [];
  if (data.length > 0) {
    const avgRiskScore = data.reduce((sum, user) => sum + (user.riskScore || 0), 0) / data.length;
    insights.push(`Average user risk score: ${avgRiskScore.toFixed(2)}`);
  }
  return insights;
}

function generateRecommendations(data, reportType) {
  const recommendations = [];
  switch (reportType) {
    case 'user_access':
      recommendations.push('Review inactive user accounts monthly');
      recommendations.push('Implement principle of least privilege');
      break;
    case 'audit':
      recommendations.push('Investigate high-risk events promptly');
      recommendations.push('Implement automated alerting for failed logins');
      break;
    default:
      recommendations.push('Regular monitoring recommended');
  }
  return recommendations;
}

export default router;
