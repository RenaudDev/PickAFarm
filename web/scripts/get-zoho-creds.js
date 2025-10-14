#!/usr/bin/env node

/**
 * Temporary helper script to extract Zoho credentials from Worker environment
 * Run this once to get the credentials, then add them to web/.env.local
 */

async function main() {
  console.log('🔑 Fetching Zoho credentials from deployed Worker...\n');

  try {
    const response = await fetch(
      'https://pickafarm-api.94623956quebecinc.workers.dev/api/token-debug'
    );

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();

    console.log('📋 Token Information:');
    console.log('━'.repeat(50));
    console.log(`Refresh Token Present: ${data.token_info.refresh_token_present}`);
    console.log(`Refresh Token Length: ${data.token_info.refresh_token_length}`);
    console.log(`Refresh Token Preview: ${data.token_info.refresh_token_starts_with}`);
    console.log(`Client ID Present: ${data.token_info.client_id_present}`);
    console.log(`Client Secret Present: ${data.token_info.client_secret_present}`);
    console.log(`Data Center: ${data.token_info.dc}`);
    console.log('━'.repeat(50));
    console.log('');
    console.log('⚠️  NOTE: For security reasons, the full credentials are not exposed.');
    console.log('   You need to retrieve them from Cloudflare dashboard:');
    console.log('');
    console.log('   1. Go to: https://dash.cloudflare.com/');
    console.log('   2. Workers & Pages → pickafarm-api → Settings → Variables');
    console.log('   3. Reveal and copy these secrets:');
    console.log('      - ZOHO_CLIENT_ID');
    console.log('      - ZOHO_CLIENT_SECRET');
    console.log('      - ZOHO_REFRESH_TOKEN');
    console.log('');
    console.log('   4. Add them to web/.env.local:');
    console.log('      ZOHO_CLIENT_ID=your_value_here');
    console.log('      ZOHO_CLIENT_SECRET=your_value_here');
    console.log('      ZOHO_REFRESH_TOKEN=your_value_here');
    console.log('      ZOHO_DC=ca');
    console.log('');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
