#!/usr/bin/env node

/**
 * Debug script to test individual admin endpoints
 * This will help identify which specific endpoint is causing the 500 error
 */

const axios = require('axios');

// You'll need to replace this with a valid admin token from your production app
const ADMIN_TOKEN = 'your_admin_token_here';
const BASE_URL = 'https://coral-app-bh2u4.ondigitalocean.app/api';

const endpoints = [
  { name: 'Admin Dashboard', url: `${BASE_URL}/admin/dashboard` },
  { name: 'Admin Users', url: `${BASE_URL}/admin/users` },
  { name: 'Admin Transactions', url: `${BASE_URL}/admin/transactions` },
  { name: 'Admin Withdrawals', url: `${BASE_URL}/admin/withdrawals` },
  { name: 'Admin Demos', url: `${BASE_URL}/admin/demos` },
  { name: 'Admin Pending Deposits', url: `${BASE_URL}/admin/pending-deposits` },
  { name: 'Chat Admin Conversations', url: `${BASE_URL}/chat/admin/conversations` }
];

async function testEndpoint(endpoint) {
  try {
    console.log(`🧪 Testing: ${endpoint.name}`);
    const response = await axios.get(endpoint.url, {
      headers: {
        'Authorization': `Bearer ${ADMIN_TOKEN}`
      },
      timeout: 10000
    });
    console.log(`✅ ${endpoint.name}: SUCCESS (${response.status})`);
    return { name: endpoint.name, status: 'success', data: response.status };
  } catch (error) {
    console.log(`❌ ${endpoint.name}: FAILED`);
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Error: ${error.response.data?.error || 'Unknown error'}`);
      return { name: endpoint.name, status: 'failed', error: error.response.status, message: error.response.data?.error };
    } else {
      console.log(`   Error: ${error.message}`);
      return { name: endpoint.name, status: 'failed', error: 'network', message: error.message };
    }
  }
}

async function debugAllEndpoints() {
  console.log('🔍 Starting Admin Endpoints Debug...\n');
  
  if (ADMIN_TOKEN === 'your_admin_token_here') {
    console.log('❌ Please set a valid ADMIN_TOKEN in this script first');
    console.log('   1. Login to your app as admin');
    console.log('   2. Check localStorage.getItem("token") in browser console');
    console.log('   3. Replace ADMIN_TOKEN in this script');
    process.exit(1);
  }

  const results = [];
  
  for (const endpoint of endpoints) {
    const result = await testEndpoint(endpoint);
    results.push(result);
    console.log(''); // Empty line for readability
  }

  console.log('📊 SUMMARY:');
  console.log('===========');
  
  const successful = results.filter(r => r.status === 'success');
  const failed = results.filter(r => r.status === 'failed');
  
  console.log(`✅ Successful: ${successful.length}/${results.length}`);
  console.log(`❌ Failed: ${failed.length}/${results.length}`);
  
  if (failed.length > 0) {
    console.log('\n❌ FAILED ENDPOINTS:');
    failed.forEach(f => {
      console.log(`   • ${f.name}: ${f.error} - ${f.message}`);
    });
  }
}

// Run the debug
debugAllEndpoints().catch(console.error);