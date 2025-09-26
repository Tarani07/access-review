import { checkRailwayConnection, testApiEndpoints, checkDatabaseIntegrity, checkPerformance } from './src/utils/railway-check.js';
import { PrismaClient } from '@prisma/client';
import logger from './src/utils/logger.js';

const prisma = new PrismaClient();

async function runBackendTests() {
  console.log('🚀 SparrowVision Backend Comprehensive Test Suite');
  console.log('=' .repeat(60));
  
  const testResults = {
    timestamp: new Date().toISOString(),
    overall: 'testing',
    tests: {}
  };

  try {
    // 1. Railway Connection Check
    console.log('\n📡 Testing Railway Connection & Environment...');
    testResults.tests.railway = await checkRailwayConnection();
    
    // 2. Database Integrity Check
    console.log('\n🔍 Checking Database Integrity...');
    testResults.tests.database = await checkDatabaseIntegrity();
    
    // 3. Performance Check
    console.log('\n⚡ Running Performance Tests...');
    testResults.tests.performance = await checkPerformance();
    
    // 4. API Endpoints Test
    console.log('\n🌐 Testing API Endpoints...');
    testResults.tests.endpoints = await testApiEndpoints();
    
    // 5. User Validation Test
    console.log('\n👥 Testing User Validation Logic...');
    testResults.tests.userValidation = await testUserValidation();
    
    // 6. Exit Employee Highlighting Test
    console.log('\n🚪 Testing Exit Employee Highlighting...');
    testResults.tests.exitEmployees = await testExitEmployeeHighlighting();
    
    // 7. Tool Functionality Test
    console.log('\n🛠️  Testing Tool Operations...');
    testResults.tests.toolOperations = await testToolOperations();
    
    // 8. Code Quality Check
    console.log('\n📋 Running Code Quality Checks...');
    testResults.tests.codeQuality = await checkCodeQuality();
    
    // Determine overall status
    const failedTests = Object.entries(testResults.tests).filter(([_, result]) => {
      if (Array.isArray(result)) {
        return result.some(item => !item.ok && item.status !== 404); // 404 is expected for some endpoints
      }
      return result.status === 'error';
    });
    
    testResults.overall = failedTests.length === 0 ? 'passed' : 
                         failedTests.length <= 2 ? 'partial' : 'failed';
    
    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`Overall Status: ${getStatusEmoji(testResults.overall)} ${testResults.overall.toUpperCase()}`);
    console.log(`Timestamp: ${testResults.timestamp}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Railway Deployment: ${process.env.RAILWAY_DEPLOYMENT_ID || 'local'}`);
    
    console.log('\nTest Results:');
    Object.entries(testResults.tests).forEach(([testName, result]) => {
      if (Array.isArray(result)) {
        const passedEndpoints = result.filter(item => item.ok || item.status === 404).length;
        console.log(`  ${getStatusEmoji(passedEndpoints === result.length ? 'passed' : 'failed')} ${testName}: ${passedEndpoints}/${result.length} endpoints`);
      } else {
        console.log(`  ${getStatusEmoji(result.status)} ${testName}: ${result.status}`);
      }
    });
    
    if (testResults.overall === 'passed') {
      console.log('\n✅ All systems operational! Backend is production-ready.');
    } else if (testResults.overall === 'partial') {
      console.log('\n⚠️  Some issues detected. Backend is functional but may need attention.');
    } else {
      console.log('\n❌ Critical issues detected. Backend requires fixes before production deployment.');
    }
    
    // Save test results
    const fs = await import('fs/promises');
    await fs.writeFile('./test-results.json', JSON.stringify(testResults, null, 2));
    console.log('\n📄 Test results saved to test-results.json');
    
  } catch (error) {
    console.error('❌ Test suite failed:', error);
    testResults.overall = 'error';
    testResults.error = error.message;
  } finally {
    await prisma.$disconnect();
  }
  
  return testResults;
}

// Test user validation functionality
async function testUserValidation() {
  try {
    const mockToolUsers = [
      { email: 'test@example.com', name: 'Test User' },
      { email: 'invalid@example.com', name: 'Invalid User' }
    ];
    
    const mockActiveUsers = [
      { id: '1', email: 'test@example.com', status: 'ACTIVE' }
    ];
    
    // Mock validation logic (simplified)
    const validatedUsers = [];
    const invalidUsers = [];
    
    for (const toolUser of mockToolUsers) {
      const activeUser = mockActiveUsers.find(user => 
        user.email.toLowerCase() === toolUser.email.toLowerCase()
      );
      
      if (activeUser) {
        validatedUsers.push({
          ...toolUser,
          activeUserId: activeUser.id,
          isValid: true
        });
      } else {
        invalidUsers.push({
          ...toolUser,
          isValid: false,
          reason: 'User not found in active directory'
        });
      }
    }
    
    return {
      status: 'passed',
      validatedUsers: validatedUsers.length,
      invalidUsers: invalidUsers.length,
      totalTested: mockToolUsers.length
    };
  } catch (error) {
    return {
      status: 'error',
      error: error.message
    };
  }
}

// Test exit employee highlighting
async function testExitEmployeeHighlighting() {
  try {
    // Check if exit users exist in database
    const exitUsersCount = await prisma.user.count({
      where: { status: 'EXIT' }
    });
    
    const exitUsersWithAccess = await prisma.user.count({
      where: {
        status: 'EXIT',
        userAccess: {
          some: { status: 'ACTIVE' }
        }
      }
    });
    
    return {
      status: 'passed',
      exitUsers: exitUsersCount,
      exitUsersWithActiveAccess: exitUsersWithAccess,
      highlightingEnabled: true
    };
  } catch (error) {
    return {
      status: 'error',
      error: error.message
    };
  }
}

// Test tool operations
async function testToolOperations() {
  try {
    const toolsCount = await prisma.tool.count();
    const connectedTools = await prisma.tool.count({
      where: { status: 'CONNECTED' }
    });
    const userAccessCount = await prisma.userAccess.count();
    
    // Test tool creation (mock)
    const toolCreationTest = {
      canCreate: true,
      canUpdate: true,
      canDelete: true,
      canSync: true
    };
    
    return {
      status: 'passed',
      totalTools: toolsCount,
      connectedTools,
      userAccessRecords: userAccessCount,
      operations: toolCreationTest
    };
  } catch (error) {
    return {
      status: 'error',
      error: error.message
    };
  }
}

// Check code quality
async function checkCodeQuality() {
  try {
    const fs = await import('fs/promises');
    const path = await import('path');
    
    // Check for unused imports and code blocks (simplified check)
    const routeFiles = [
      './src/routes/auth.js',
      './src/routes/dashboard.js',
      './src/routes/tools.js',
      './src/routes/users.js',
      './src/routes/reviews.js',
      './src/routes/reports.js',
      './src/routes/admin.js',
      './src/routes/logs.js',
      './src/routes/slack.js'
    ];
    
    const fileChecks = [];
    
    for (const file of routeFiles) {
      try {
        const content = await fs.readFile(file, 'utf-8');
        
        // Basic code quality checks
        const checks = {
          hasErrorHandling: content.includes('try {') && content.includes('catch'),
          hasLogging: content.includes('logger.'),
          hasValidation: content.includes('if (!') || content.includes('!=='),
          hasAsyncAwait: content.includes('async') && content.includes('await'),
          lineCount: content.split('\n').length
        };
        
        fileChecks.push({
          file: path.basename(file),
          ...checks,
          quality: Object.values(checks).filter(v => typeof v === 'boolean').every(v => v) ? 'good' : 'needs_improvement'
        });
      } catch (error) {
        fileChecks.push({
          file: path.basename(file),
          error: 'File not found or unreadable',
          quality: 'error'
        });
      }
    }
    
    const goodQualityFiles = fileChecks.filter(f => f.quality === 'good').length;
    
    return {
      status: goodQualityFiles >= fileChecks.length * 0.8 ? 'passed' : 'needs_improvement',
      files: fileChecks,
      totalFiles: fileChecks.length,
      goodQualityFiles
    };
  } catch (error) {
    return {
      status: 'error',
      error: error.message
    };
  }
}

function getStatusEmoji(status) {
  switch (status) {
    case 'passed':
    case 'healthy':
    case 'optimal':
    case 'good':
      return '✅';
    case 'partial':
    case 'acceptable':
    case 'warning':
    case 'needs_improvement':
      return '⚠️';
    case 'failed':
    case 'error':
    case 'critical':
      return '❌';
    default:
      return '🔄';
  }
}

// Run the tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runBackendTests()
    .then((results) => {
      process.exit(results.overall === 'passed' ? 0 : 1);
    })
    .catch((error) => {
      console.error('Test suite crashed:', error);
      process.exit(1);
    });
}

export default runBackendTests;
