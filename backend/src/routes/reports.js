import express from 'express';
import logger from '../utils/logger.js';
import { getPrismaClient } from '../utils/database.js';
import nodemailer from 'nodemailer';

const router = express.Router();
const prisma = getPrismaClient();

// Email configuration
const emailTransporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST || 'localhost',
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || ''
  }
});

// Team email mappings
const TEAM_EMAILS = {
  'IT Security Team': process.env.IT_SECURITY_EMAILS?.split(',') || ['it-security@company.com'],
  'HR Team': process.env.HR_TEAM_EMAILS?.split(',') || ['hr@company.com'],
  'Engineering Team': process.env.ENGINEERING_EMAILS?.split(',') || ['engineering@company.com'],
  'Marketing Team': process.env.MARKETING_EMAILS?.split(',') || ['marketing@company.com'],
  'Finance Team': process.env.FINANCE_EMAILS?.split(',') || ['finance@company.com'],
  'Compliance': process.env.COMPLIANCE_EMAILS?.split(',') || ['compliance@company.com']
};

// Email templates
const EMAIL_TEMPLATES = {
  'Access Review Summary': {
    subject: 'Access Review Report - {title}',
    body: `Dear Team,

Please find the attached access review report for your review.

Summary:
- Review Period: {period}
- Total Users Reviewed: {usersReviewed}
- Access Items Reviewed: {itemsReviewed}
- Access Removed: {accessRemoved}
- High Risk Users: {highRiskUsers}

{customMessage}

Please review the attached report and take necessary actions for your team members.

Best regards,
SparrowVision Access Governance Team`
  },
  'Exit Employee Report': {
    subject: 'Exit Employee Access Review - Action Required',
    body: `Dear Team,

This report contains access review information for recently departed employees.

URGENT: The following users have left the organization but may still have active access:
{exitUsersList}

Please review and ensure all access has been properly removed.

{customMessage}

Best regards,
SparrowVision Access Governance Team`
  },
  'New Access Granted': {
    subject: 'New Access Permissions Granted - {period}',
    body: `Dear Team,

This report shows new access permissions granted during {period}.

Summary:
- New Users Added: {newUsers}
- New Permissions Granted: {newPermissions}

{customMessage}

Please review to ensure all access grants are appropriate.

Best regards,
SparrowVision Access Governance Team`
  },
  'Compliance Alert': {
    subject: 'Compliance Alert - Immediate Action Required',
    body: `Dear Team,

This is a compliance alert regarding access governance findings that require immediate attention.

{complianceIssues}

{customMessage}

Please address these issues within 48 hours.

Best regards,
SparrowVision Access Governance Team`
  }
};

// Get all reports
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      status, 
      type,
      search 
    } = req.query;
    
    const offset = (page - 1) * limit;
    
    const whereClause = {
      ...(status && status !== 'ALL' && { status }),
      ...(type && type !== 'ALL' && { type }),
      ...(search && {
        title: { contains: search, mode: 'insensitive' }
      })
    };

    const [reports, totalCount] = await Promise.all([
      prisma.report.findMany({
        where: whereClause,
        orderBy: { generatedAt: 'desc' },
        skip: offset,
        take: parseInt(limit)
      }),
      prisma.report.count({ where: whereClause })
    ]);

    res.json({
      success: true,
      data: reports,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    logger.error('Error fetching reports:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch reports'
    });
  }
});

// Generate new report
router.post('/generate', async (req, res) => {
  try {
    const {
      title,
      type,
      toolFilter,
      selectedTools,
      reviewId,
      customParams
    } = req.body;

    if (!title || !type) {
      return res.status(400).json({
        success: false,
        error: 'Title and type are required'
      });
    }

    // Get tools to include in report
    let toolsToReview = [];
    if (toolFilter === 'ALL') {
      const allTools = await prisma.tool.findMany({
        select: { name: true }
      });
      toolsToReview = allTools.map(t => t.name);
    } else if (toolFilter === 'SELECTED' && selectedTools) {
      toolsToReview = selectedTools;
    }

    // Get data based on report type
    let reportData = {};
    let usersReviewed = 0;
    let removals = 0;
    let flags = 0;

    if (type === 'ACCESS_REVIEW' && reviewId) {
      const review = await prisma.accessReview.findUnique({
        where: { id: reviewId },
        include: { entries: true }
      });

      if (review) {
        usersReviewed = review.entries.length;
        removals = review.entries.filter(e => e.status === 'REMOVED').length;
        flags = review.entries.filter(e => e.shouldRemove).length;
        
        reportData = {
          reviewTitle: review.title,
          reviewType: review.type,
          totalEntries: review.entries.length,
          entriesByStatus: {
            approved: review.entries.filter(e => e.status === 'APPROVED').length,
            flagged: review.entries.filter(e => e.status === 'FLAGGED').length,
            removed: review.entries.filter(e => e.status === 'REMOVED').length
          },
          exitUsers: review.entries.filter(e => e.userName).map(e => ({
            email: e.userEmail,
            name: e.userName,
            tool: e.toolName,
            shouldRemove: e.shouldRemove
          }))
        };
      }
    } else if (type === 'COMPLIANCE') {
      // Get compliance data
      const exitUsersWithAccess = await prisma.user.count({
        where: {
          status: 'EXIT',
          userAccess: {
            some: { status: 'ACTIVE' }
          }
        }
      });

      const highRiskUsers = await prisma.user.count({
        where: {
          status: 'ACTIVE',
          riskScore: { gte: 70 }
        }
      });

      reportData = {
        exitUsersWithAccess,
        highRiskUsers,
        totalActiveUsers: await prisma.user.count({ where: { status: 'ACTIVE' } }),
        complianceScore: Math.max(0, 100 - (exitUsersWithAccess * 10) - (highRiskUsers * 5))
      };
    }

    // Create report record
    const report = await prisma.report.create({
      data: {
        title,
        type,
        reviewId,
        status: 'GENERATED',
        generatedAt: new Date(),
        generatedBy: req.user?.id || 'system',
        toolsReviewed: toolsToReview,
        usersReviewed,
        removals,
        flags,
        data: JSON.stringify(reportData)
      }
    });

    // Log report generation
    await prisma.log.create({
      data: {
        action: 'REPORT_GENERATED',
        entityType: 'REPORT',
        entityId: report.id,
        userId: req.user?.id || 'system',
        details: JSON.stringify({
          title,
          type,
          toolsCount: toolsToReview.length,
          usersReviewed
        })
      }
    });

    logger.info(`Report generated: ${title}`);

    res.status(201).json({
      success: true,
      data: report,
      message: 'Report generated successfully'
    });
  } catch (error) {
    logger.error('Error generating report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate report'
    });
  }
});

// Send automated team notification
router.post('/notify-team', async (req, res) => {
  try {
    const {
      team,
      template,
      reportId,
      customSubject,
      customMessage,
      scheduleFor
    } = req.body;

    if (!team || !template) {
      return res.status(400).json({
        success: false,
        error: 'Team and template are required'
      });
    }

    // Get team email addresses
    const teamEmails = TEAM_EMAILS[team];
    if (!teamEmails) {
      return res.status(400).json({
        success: false,
        error: 'Invalid team specified'
      });
    }

    // Get email template
    const emailTemplate = EMAIL_TEMPLATES[template];
    if (!emailTemplate) {
      return res.status(400).json({
        success: false,
        error: 'Invalid template specified'
      });
    }

    // Get report data if reportId provided
    let report = null;
    let reportData = {};
    if (reportId) {
      report = await prisma.report.findUnique({
        where: { id: reportId }
      });
      
      if (report) {
        reportData = JSON.parse(report.data || '{}');
      }
    }

    // Prepare email content
    let subject = customSubject || emailTemplate.subject;
    let body = emailTemplate.body;

    // Replace placeholders
    const replacements = {
      '{title}': report?.title || 'Access Review Report',
      '{period}': new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      '{usersReviewed}': report?.usersReviewed || 0,
      '{itemsReviewed}': reportData.totalEntries || 0,
      '{accessRemoved}': report?.removals || 0,
      '{highRiskUsers}': reportData.highRiskUsers || 0,
      '{customMessage}': customMessage || '',
      '{exitUsersList}': reportData.exitUsers?.map(u => `- ${u.name} (${u.email})`).join('\n') || '',
      '{newUsers}': reportData.newUsers || 0,
      '{newPermissions}': reportData.newPermissions || 0,
      '{complianceIssues}': reportData.complianceIssues || 'See attached report for details.'
    };

    Object.entries(replacements).forEach(([placeholder, value]) => {
      subject = subject.replace(placeholder, value.toString());
      body = body.replace(placeholder, value.toString());
    });

    // Schedule or send immediately
    if (scheduleFor && new Date(scheduleFor) > new Date()) {
      // For now, just log the scheduled notification
      // In production, you'd use a job queue like Bull or Agenda
      logger.info(`Notification scheduled for ${scheduleFor}`, {
        team,
        template,
        subject
      });

      res.json({
        success: true,
        message: `Notification scheduled for ${new Date(scheduleFor).toLocaleString()}`,
        data: { scheduledFor: scheduleFor }
      });
    } else {
      // Send immediately
      try {
        await emailTransporter.sendMail({
          from: process.env.FROM_EMAIL || 'noreply@sparrowvision.com',
          to: teamEmails.join(','),
          subject,
          text: body,
          attachments: report ? [{
            filename: `${report.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
            content: Buffer.from('Mock PDF content'), // In production, generate actual PDF
            contentType: 'application/pdf'
          }] : []
        });

        // Log notification
        await prisma.log.create({
          data: {
            action: 'TEAM_NOTIFICATION_SENT',
            entityType: 'REPORT',
            entityId: reportId || null,
            userId: req.user?.id || 'system',
            details: JSON.stringify({
              team,
              template,
              recipientCount: teamEmails.length,
              subject
            })
          }
        });

        logger.info(`Team notification sent to ${team}`, {
          template,
          recipientCount: teamEmails.length
        });

        res.json({
          success: true,
          message: `Notification sent to ${team} (${teamEmails.length} recipients)`,
          data: { sentTo: teamEmails.length }
        });
      } catch (emailError) {
        logger.error('Error sending team notification:', emailError);
        res.status(500).json({
          success: false,
          error: 'Failed to send team notification'
        });
      }
    }
  } catch (error) {
    logger.error('Error processing team notification:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process team notification'
    });
  }
});

// Send custom team notification
router.post('/notify-custom', async (req, res) => {
  try {
    const {
      teams,
      subject,
      message,
      reportId,
      attachReport = false
    } = req.body;

    if (!teams || !Array.isArray(teams) || teams.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'At least one team must be specified'
      });
    }

    if (!subject || !message) {
      return res.status(400).json({
        success: false,
        error: 'Subject and message are required'
      });
    }

    // Collect all recipient emails
    const allRecipients = [];
    teams.forEach(team => {
      if (TEAM_EMAILS[team]) {
        allRecipients.push(...TEAM_EMAILS[team]);
      }
    });

    if (allRecipients.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid teams specified'
      });
    }

    // Get report if needed
    let report = null;
    if (reportId && attachReport) {
      report = await prisma.report.findUnique({
        where: { id: reportId }
      });
    }

    // Send email
    try {
      await emailTransporter.sendMail({
        from: process.env.FROM_EMAIL || 'noreply@sparrowvision.com',
        to: [...new Set(allRecipients)].join(','), // Remove duplicates
        subject,
        text: message,
        attachments: report && attachReport ? [{
          filename: `${report.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
          content: Buffer.from('Mock PDF content'), // In production, generate actual PDF
          contentType: 'application/pdf'
        }] : []
      });

      // Log notification
      await prisma.log.create({
        data: {
          action: 'CUSTOM_TEAM_NOTIFICATION_SENT',
          entityType: 'REPORT',
          entityId: reportId || null,
          userId: req.user?.id || 'system',
          details: JSON.stringify({
            teams,
            recipientCount: [...new Set(allRecipients)].length,
            subject,
            hasAttachment: attachReport && report
          })
        }
      });

      logger.info('Custom team notification sent', {
        teams,
        recipientCount: [...new Set(allRecipients)].length
      });

      res.json({
        success: true,
        message: `Custom notification sent to ${teams.join(', ')} (${[...new Set(allRecipients)].length} recipients)`,
        data: { 
          sentTo: [...new Set(allRecipients)].length,
          teams 
        }
      });
    } catch (emailError) {
      logger.error('Error sending custom team notification:', emailError);
      res.status(500).json({
        success: false,
        error: 'Failed to send custom team notification'
      });
    }
  } catch (error) {
    logger.error('Error processing custom team notification:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process custom team notification'
    });
  }
});

// Certify report
router.patch('/:id/certify', async (req, res) => {
  try {
    const { id } = req.params;
    const { framework = 'ISO 27001' } = req.body;

    const report = await prisma.report.findUnique({
      where: { id }
    });

    if (!report) {
      return res.status(404).json({
        success: false,
        error: 'Report not found'
      });
    }

    // Update report status
    const updatedReport = await prisma.report.update({
      where: { id },
      data: {
        status: 'CERTIFIED',
        certifiedAt: new Date(),
        certifiedBy: req.user?.id || 'system',
        complianceFramework: framework
      }
    });

    // Create certification record
    const certification = await prisma.certification.create({
      data: {
        reportId: id,
        framework,
        certifiedBy: req.user?.id || 'system',
        certifiedAt: new Date(),
        validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
        certificateNumber: `SS-${framework.replace(/\s+/g, '')}-${new Date().getFullYear()}-${Date.now()}`,
        status: 'VALID'
      }
    });

    // Log certification
    await prisma.log.create({
      data: {
        action: 'REPORT_CERTIFIED',
        entityType: 'REPORT',
        entityId: id,
        userId: req.user?.id || 'system',
        details: JSON.stringify({
          framework,
          certificateNumber: certification.certificateNumber
        })
      }
    });

    logger.info(`Report certified: ${report.title} for ${framework}`);

    res.json({
      success: true,
      data: {
        report: updatedReport,
        certification
      },
      message: 'Report certified successfully'
    });
  } catch (error) {
    logger.error('Error certifying report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to certify report'
    });
  }
});

// Download report
router.get('/:id/download', async (req, res) => {
  try {
    const { id } = req.params;
    const { format = 'pdf' } = req.query;

    const report = await prisma.report.findUnique({
      where: { id }
    });

    if (!report) {
      return res.status(404).json({
        success: false,
        error: 'Report not found'
      });
    }

    // In production, generate actual PDF/Excel files
    const mockContent = JSON.stringify({
      title: report.title,
      type: report.type,
      generatedAt: report.generatedAt,
      data: JSON.parse(report.data || '{}')
    }, null, 2);

    if (format === 'pdf') {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${report.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf"`);
      res.send(Buffer.from(mockContent)); // In production, generate actual PDF
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${report.title.replace(/[^a-zA-Z0-9]/g, '_')}.json"`);
      res.send(mockContent);
    }

    // Log download
    await prisma.log.create({
      data: {
        action: 'REPORT_DOWNLOADED',
        entityType: 'REPORT',
        entityId: id,
        userId: req.user?.id || 'system',
        details: JSON.stringify({
          format,
          reportTitle: report.title
        })
      }
    });
  } catch (error) {
    logger.error('Error downloading report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to download report'
    });
  }
});

export default router;