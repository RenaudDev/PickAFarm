/**
 * Test script for monitoring and alerting system
 * Tests Cliq webhook and monitoring dashboard
 */

// Test 1: Send a test alert to Cliq
async function testCliqWebhook() {
  const CLIQ_WEBHOOK_URL = process.env.CLIQ_WEBHOOK_URL;

  if (!CLIQ_WEBHOOK_URL) {
    console.error('❌ CLIQ_WEBHOOK_URL environment variable not set');
    return false;
  }

  console.log('🧪 Testing Cliq webhook integration...');

  const payload = {
    text: '✅ **PickAFarm Monitoring Test**\n\n**Status:** Monitoring system is operational\n\n**Components Tested:**\n- Structured logging\n- Correlation IDs\n- Zoho Cliq integration\n- Monitoring dashboard\n\n**Time:** ' + new Date().toISOString() + '\n**Environment:** testing',
    card: {
      title: '✅ Monitoring System Test',
      theme: 'prompt'
    }
  };

  try {
    const response = await fetch(CLIQ_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Cliq webhook failed:', response.status, errorText);
      return false;
    }

    console.log('✅ Cliq webhook test passed - Check your Cliq channel for the message');
    return true;
  } catch (error) {
    console.error('❌ Cliq webhook error:', error.message);
    return false;
  }
}

// Test 2: Test monitoring dashboard endpoint
async function testMonitoringDashboard() {
  const ADMIN_API_KEY = process.env.ADMIN_API_KEY;
  const WORKER_URL = process.env.WORKER_URL || 'https://pickafarm-api.94623956quebecinc.workers.dev';

  if (!ADMIN_API_KEY) {
    console.error('❌ ADMIN_API_KEY environment variable not set');
    return false;
  }

  console.log('🧪 Testing monitoring dashboard endpoint...');

  try {
    const response = await fetch(`${WORKER_URL}/api/admin/monitoring`, {
      method: 'GET',
      headers: {
        'X-API-Key': ADMIN_API_KEY,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Monitoring dashboard failed:', response.status, errorText);
      return false;
    }

    const data = await response.json();
    console.log('✅ Monitoring dashboard test passed');
    console.log('📊 Dashboard data:', JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('❌ Monitoring dashboard error:', error.message);
    return false;
  }
}

// Test 3: Test monitoring dashboard with invalid API key
async function testMonitoringDashboardAuth() {
  const WORKER_URL = process.env.WORKER_URL || 'https://pickafarm-api.94623956quebecinc.workers.dev';

  console.log('🧪 Testing monitoring dashboard authentication...');

  try {
    const response = await fetch(`${WORKER_URL}/api/admin/monitoring`, {
      method: 'GET',
      headers: {
        'X-API-Key': 'invalid-key',
        'Content-Type': 'application/json'
      }
    });

    if (response.status === 401) {
      console.log('✅ Authentication test passed - Invalid key rejected');
      return true;
    } else {
      console.error('❌ Authentication test failed - Invalid key was accepted');
      return false;
    }
  } catch (error) {
    console.error('❌ Authentication test error:', error.message);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting monitoring system tests...\n');

  const results = {
    cliqWebhook: await testCliqWebhook(),
    monitoringDashboard: await testMonitoringDashboard(),
    authentication: await testMonitoringDashboardAuth()
  };

  console.log('\n📋 Test Results Summary:');
  console.log('========================');
  console.log(`Cliq Webhook:          ${results.cliqWebhook ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Monitoring Dashboard:  ${results.monitoringDashboard ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Authentication:        ${results.authentication ? '✅ PASS' : '❌ FAIL'}`);

  const allPassed = Object.values(results).every(r => r === true);
  console.log('\n' + (allPassed ? '🎉 All tests passed!' : '⚠️  Some tests failed'));

  process.exit(allPassed ? 0 : 1);
}

runAllTests();
