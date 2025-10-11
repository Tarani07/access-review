import { getPrismaClient } from './utils/database.js';
import { authenticateUser, requireRole } from './utils/auth.js';
import logger from './utils/logger.js';

export async function handler(event, context) {
  context.callbackWaitsForEmptyEventLoop = false;

  const headers = {
    'Access-Control-Allow-Origin': process.env.FRONTEND_URL || '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const authResult = await authenticateUser(event);
    if (!authResult.success) {
      return {
        statusCode: authResult.statusCode,
        headers,
        body: JSON.stringify({ error: authResult.error })
      };
    }

    const prisma = getPrismaClient();
    const path = event.path.replace('/.netlify/functions/tools', '');
    const method = event.httpMethod;

    // GET /tools - List all tools
    if (method === 'GET' && (path === '' || path === '/')) {
      const tools = await prisma.tool.findMany({
        include: {
          _count: {
            select: {
              userAccess: true,
              toolUsers: true
            }
          }
        },
        orderBy: { name: 'asc' }
      });

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          data: tools
        })
      };
    }

    // POST /tools - Create new tool
    if (method === 'POST' && (path === '' || path === '/')) {
      const roleCheck = requireRole(['ADMIN', 'INTEGRATION'])(authResult.user);
      if (!roleCheck.success) {
        return {
          statusCode: roleCheck.statusCode,
          headers,
          body: JSON.stringify({ error: roleCheck.error })
        };
      }

      const { name, type, description, integrationUrl, apiKey, apiConfig } = JSON.parse(event.body || '{}');

      if (!name || !type) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Name and type are required' })
        };
      }

      const existingTool = await prisma.tool.findUnique({
        where: { name }
      });

      if (existingTool) {
        return {
          statusCode: 409,
          headers,
          body: JSON.stringify({ error: 'Tool with this name already exists' })
        };
      }

      const tool = await prisma.tool.create({
        data: {
          name,
          type,
          description,
          integrationUrl,
          apiKey,
          apiConfig,
          status: 'INACTIVE'
        }
      });

      // Log the creation
      await prisma.log.create({
        data: {
          action: 'Create Tool',
          category: 'ADMIN',
          userId: authResult.user.id,
          userEmail: authResult.user.email,
          resourceId: tool.id,
          resourceType: 'Tool',
          details: { toolName: name, toolType: type }
        }
      });

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({
          success: true,
          data: tool
        })
      };
    }

    // GET /tools/:id - Get specific tool
    if (method === 'GET' && path.startsWith('/') && path.length > 1) {
      const toolId = path.substring(1);
      
      const tool = await prisma.tool.findUnique({
        where: { id: toolId },
        include: {
          userAccess: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  name: true,
                  status: true
                }
              }
            }
          },
          toolUsers: true,
          syncHistory: {
            take: 10,
            orderBy: { startedAt: 'desc' }
          }
        }
      });

      if (!tool) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'Tool not found' })
        };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          data: tool
        })
      };
    }

    // PUT /tools/:id - Update tool
    if (method === 'PUT' && path.startsWith('/') && path.length > 1) {
      const roleCheck = requireRole(['ADMIN', 'INTEGRATION'])(authResult.user);
      if (!roleCheck.success) {
        return {
          statusCode: roleCheck.statusCode,
          headers,
          body: JSON.stringify({ error: roleCheck.error })
        };
      }

      const toolId = path.substring(1);
      const updateData = JSON.parse(event.body || '{}');

      const tool = await prisma.tool.findUnique({
        where: { id: toolId }
      });

      if (!tool) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'Tool not found' })
        };
      }

      const updatedTool = await prisma.tool.update({
        where: { id: toolId },
        data: {
          ...updateData,
          updatedAt: new Date()
        }
      });

      // Log the update
      await prisma.log.create({
        data: {
          action: 'Update Tool',
          category: 'ADMIN',
          userId: authResult.user.id,
          userEmail: authResult.user.email,
          resourceId: toolId,
          resourceType: 'Tool',
          details: { changes: updateData }
        }
      });

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          data: updatedTool
        })
      };
    }

    // DELETE /tools/:id - Delete tool
    if (method === 'DELETE' && path.startsWith('/') && path.length > 1) {
      const roleCheck = requireRole(['ADMIN'])(authResult.user);
      if (!roleCheck.success) {
        return {
          statusCode: roleCheck.statusCode,
          headers,
          body: JSON.stringify({ error: roleCheck.error })
        };
      }

      const toolId = path.substring(1);

      const tool = await prisma.tool.findUnique({
        where: { id: toolId }
      });

      if (!tool) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'Tool not found' })
        };
      }

      await prisma.tool.delete({
        where: { id: toolId }
      });

      // Log the deletion
      await prisma.log.create({
        data: {
          action: 'Delete Tool',
          category: 'ADMIN',
          userId: authResult.user.id,
          userEmail: authResult.user.email,
          resourceId: toolId,
          resourceType: 'Tool',
          details: { toolName: tool.name }
        }
      });

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: 'Tool deleted successfully'
        })
      };
    }

    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: 'Route not found' })
    };

  } catch (error) {
    logger.error('Tools function error', { error: error.message });
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
}
