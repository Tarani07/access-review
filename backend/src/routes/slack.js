import express from 'express';
import logger from '../utils/logger.js';
import { getPrismaClient } from '../utils/database.js';

const router = express.Router();
const prisma = getPrismaClient();

// Send Slack notification
async function sendSlackNotification(webhookUrl, message) {
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return { success: true };
  } catch (error) {
    logger.error('Slack notification failed:', error);
    return { success: false, error: error.message };
  }
}

// Get Slack settings
router.get('/settings', async (req, res) => {
  try {
    const slackSettings = await prisma.slackSettings.findFirst({
      orderBy: { createdAt: 'desc' }
    });

    if (!slackSettings) {
      return res.json({
        success: true,
        data: {
          isActive: false,
          webhookUrl: '',
          notifications: {
            accessReviewComplete: true,
            newToolSynced: true,
            userInvited: false,
            policyViolation: true,
            exitEmployeeDetected: true
          }
        }
      });
    }

    // Don't expose the full webhook URL for security
    const safeSettings = {
      ...slackSettings,
      webhookUrl: slackSettings.webhookUrl ? 
        slackSettings.webhookUrl.substring(0, 50) + '...' : '',
      webhookConfigured: !!slackSettings.webhookUrl
    };

    res.json({
      success: true,
      data: safeSettings
    });
  } catch (error) {
    logger.error('Error fetching Slack settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch Slack settings'
    });
  }
});

// Update Slack settings
router.put('/settings', async (req, res) => {
  try {
    const {
      webhookUrl,
      isActive,
      notifications
    } = req.body;

    if (!webhookUrl || !webhookUrl.startsWith('https://hooks.slack.com/')) {
      return res.status(400).json({
        success: false,
        error: 'Valid Slack webhook URL is required'
      });
    }

    // Test the webhook first
    const testResult = await sendSlackNotification(webhookUrl, {
      text: '🔧 SparrowVision Slack Integration Test',
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '*SparrowVision Access Governance*\n✅ Slack integration configured successfully!'
          }
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `📅 Test sent at ${new Date().toLocaleString()}`
            }
          ]
        }
      ]
    });

    if (!testResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Failed to send test message to Slack webhook'
      });
    }

    // Find existing settings or create new
    const existingSettings = await prisma.slackSettings.findFirst();

    let slackSettings;
    if (existingSettings) {
      slackSettings = await prisma.slackSettings.update({
        where: { id: existingSettings.id },
        data: {
          webhookUrl,
          isActive,
          notifications,
          testSentAt: new Date(),
          updatedAt: new Date()
        }
      });
    } else {
      slackSettings = await prisma.slackSettings.create({
        data: {
          webhookUrl,
          isActive,
          notifications,
          testSentAt: new Date()
        }
      });
    }

    // Log settings update
    await prisma.log.create({
      data: {
        action: 'SLACK_SETTINGS_UPDATED',
        entityType: 'SLACK_SETTINGS',
        entityId: slackSettings.id,
        userId: req.user?.id || 'system',
        details: JSON.stringify({
          isActive,
          notificationTypes: Object.keys(notifications).filter(key => notifications[key])
        })
      }
    });

    logger.info('Slack settings updated successfully');

    res.json({
      success: true,
      data: {
        ...slackSettings,
        webhookUrl: webhookUrl.substring(0, 50) + '...',
        webhookConfigured: true
      },
      message: 'Slack settings updated and test message sent successfully'
    });
  } catch (error) {
    logger.error('Error updating Slack settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update Slack settings'
    });
  }
});

// Test Slack connection
router.post('/test', async (req, res) => {
  try {
    const slackSettings = await prisma.slackSettings.findFirst({
      where: { isActive: true }
    });

    if (!slackSettings || !slackSettings.webhookUrl) {
      return res.status(400).json({
        success: false,
        error: 'Slack integration not configured'
      });
    }

    const testMessage = {
      text: '🧪 SparrowVision Connection Test',
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '🧪 Connection Test'
          }
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '*SparrowVision Access Governance*\n✅ Your Slack integration is working correctly!'
          }
        },
        {
          type: 'divider'
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Test Date:*\n${new Date().toLocaleDateString()}`
            },
            {
              type: 'mrkdwn',
              text: `*Test Time:*\n${new Date().toLocaleTimeString()}`
            }
          ]
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: '🔐 Secure notifications for access governance events'
            }
          ]
        }
      ]
    };

    const result = await sendSlackNotification(slackSettings.webhookUrl, testMessage);

    if (result.success) {
      // Update test timestamp
      await prisma.slackSettings.update({
        where: { id: slackSettings.id },
        data: { testSentAt: new Date() }
      });

      // Log test
      await prisma.log.create({
        data: {
          action: 'SLACK_TEST_SENT',
          entityType: 'SLACK_SETTINGS',
          entityId: slackSettings.id,
          userId: req.user?.id || 'system',
          details: JSON.stringify({
            testSuccessful: true
          })
        }
      });

      res.json({
        success: true,
        message: 'Test message sent to Slack successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Failed to send test message to Slack'
      });
    }
  } catch (error) {
    logger.error('Error testing Slack connection:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to test Slack connection'
    });
  }
});

// Send notification for access review completion
router.post('/notify/review-complete', async (req, res) => {
  try {
    const {
      reviewId,
      reviewTitle,
      usersReviewed,
      accessRemoved,
      flaggedUsers
    } = req.body;

    const slackSettings = await prisma.slackSettings.findFirst({
      where: { 
        isActive: true,
        'notifications.accessReviewComplete': true
      }
    });

    if (!slackSettings) {
      return res.json({
        success: true,
        message: 'Slack notifications not configured for access reviews'
      });
    }

    const message = {
      text: '✅ Access Review Completed',
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '✅ Access Review Completed'
          }
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*${reviewTitle}*\nAccess review has been completed successfully.`
          }
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Users Reviewed:*\n${usersReviewed || 0}`
            },
            {
              type: 'mrkdwn',
              text: `*Access Removed:*\n${accessRemoved || 0}`
            },
            {
              type: 'mrkdwn',
              text: `*Flagged Users:*\n${flaggedUsers || 0}`
            },
            {
              type: 'mrkdwn',
              text: `*Completed:*\n${new Date().toLocaleDateString()}`
            }
          ]
        },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: 'View Report'
              },
              url: `${process.env.FRONTEND_URL}/reviews/${reviewId}`,
              style: 'primary'
            }
          ]
        }
      ]
    };

    const result = await sendSlackNotification(slackSettings.webhookUrl, message);

    if (result.success) {
      await prisma.log.create({
        data: {
          action: 'SLACK_NOTIFICATION_SENT',
          entityType: 'ACCESS_REVIEW',
          entityId: reviewId,
          userId: req.user?.id || 'system',
          details: JSON.stringify({
            notificationType: 'review_complete',
            reviewTitle
          })
        }
      });

      res.json({
        success: true,
        message: 'Slack notification sent successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Failed to send Slack notification'
      });
    }
  } catch (error) {
    logger.error('Error sending review completion notification:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send Slack notification'
    });
  }
});

// Send notification for exit employee detection
router.post('/notify/exit-employee', async (req, res) => {
  try {
    const {
      userEmail,
      userName,
      activeToolsCount,
      daysAfterExit
    } = req.body;

    const slackSettings = await prisma.slackSettings.findFirst({
      where: { 
        isActive: true,
        'notifications.exitEmployeeDetected': true
      }
    });

    if (!slackSettings) {
      return res.json({
        success: true,
        message: 'Slack notifications not configured for exit employees'
      });
    }

    const urgencyLevel = daysAfterExit > 7 ? '🚨 HIGH' : 
                        daysAfterExit > 3 ? '⚠️ MEDIUM' : '📋 LOW';

    const message = {
      text: `🚪 Exit Employee Access Alert: ${userName}`,
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '🚪 Exit Employee Access Detected'
          }
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*${userName}* (${userEmail}) has left the organization but still has active access to ${activeToolsCount} tools.`
          }
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Employee:*\n${userName}`
            },
            {
              type: 'mrkdwn',
              text: `*Email:*\n${userEmail}`
            },
            {
              type: 'mrkdwn',
              text: `*Active Tools:*\n${activeToolsCount}`
            },
            {
              type: 'mrkdwn',
              text: `*Days After Exit:*\n${daysAfterExit}`
            }
          ]
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Priority Level:* ${urgencyLevel}`
          }
        },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: 'Review Access'
              },
              url: `${process.env.FRONTEND_URL}/users/${userEmail}`,
              style: 'danger'
            },
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: 'Create Review'
              },
              url: `${process.env.FRONTEND_URL}/access-review/new?exitUser=${userEmail}`
            }
          ]
        }
      ]
    };

    const result = await sendSlackNotification(slackSettings.webhookUrl, message);

    if (result.success) {
      await prisma.log.create({
        data: {
          action: 'SLACK_EXIT_EMPLOYEE_ALERT_SENT',
          entityType: 'USER',
          userId: req.user?.id || 'system',
          details: JSON.stringify({
            exitUserEmail: userEmail,
            activeToolsCount,
            daysAfterExit
          })
        }
      });

      res.json({
        success: true,
        message: 'Exit employee alert sent to Slack successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Failed to send Slack notification'
      });
    }
  } catch (error) {
    logger.error('Error sending exit employee notification:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send Slack notification'
    });
  }
});

// Send notification for new tool sync
router.post('/notify/tool-sync', async (req, res) => {
  try {
    const {
      toolName,
      usersCount,
      newUsers,
      status
    } = req.body;

    const slackSettings = await prisma.slackSettings.findFirst({
      where: { 
        isActive: true,
        'notifications.newToolSynced': true
      }
    });

    if (!slackSettings) {
      return res.json({
        success: true,
        message: 'Slack notifications not configured for tool sync'
      });
    }

    const statusEmoji = status === 'success' ? '✅' : '❌';
    const statusText = status === 'success' ? 'Successful' : 'Failed';

    const message = {
      text: `${statusEmoji} Tool Sync ${statusText}: ${toolName}`,
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: `${statusEmoji} Tool Sync ${statusText}`
          }
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*${toolName}* synchronization has ${status === 'success' ? 'completed' : 'failed'}.`
          }
        }
      ]
    };

    if (status === 'success') {
      message.blocks.push({
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Total Users:*\n${usersCount || 0}`
          },
          {
            type: 'mrkdwn',
            text: `*New Users:*\n${newUsers || 0}`
          },
          {
            type: 'mrkdwn',
            text: `*Sync Time:*\n${new Date().toLocaleString()}`
          }
        ]
      });
    }

    const result = await sendSlackNotification(slackSettings.webhookUrl, message);

    if (result.success) {
      await prisma.log.create({
        data: {
          action: 'SLACK_TOOL_SYNC_NOTIFICATION_SENT',
          entityType: 'TOOL',
          userId: req.user?.id || 'system',
          details: JSON.stringify({
            toolName,
            status,
            usersCount,
            newUsers
          })
        }
      });

      res.json({
        success: true,
        message: 'Tool sync notification sent to Slack successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Failed to send Slack notification'
      });
    }
  } catch (error) {
    logger.error('Error sending tool sync notification:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send Slack notification'
    });
  }
});

export default router;
