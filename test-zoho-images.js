/**
 * Test script to check if Zoho CRM returns Logo and Cover_Image fields
 *
 * Usage:
 *   node test-zoho-images.js <record_id>
 *
 * Example:
 *   node test-zoho-images.js 38729000000292133
 */

const ZOHO_CLIENT_ID = process.env.ZOHO_CLIENT_ID;
const ZOHO_CLIENT_SECRET = process.env.ZOHO_CLIENT_SECRET;
const ZOHO_REFRESH_TOKEN = process.env.ZOHO_REFRESH_TOKEN;
const ZOHO_DC = process.env.ZOHO_DC || 'com';

async function getAccessToken() {
  const tokenUrl = `https://accounts.zoho.${ZOHO_DC}/oauth/v2/token`;

  const params = new URLSearchParams({
    refresh_token: ZOHO_REFRESH_TOKEN,
    client_id: ZOHO_CLIENT_ID,
    client_secret: ZOHO_CLIENT_SECRET,
    grant_type: 'refresh_token'
  });

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString()
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to get access token: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data.access_token;
}

async function fetchAccountWithImages(accountId, accessToken) {
  const fields = [
    "Account_Name",
    "Logo",
    "Cover_Image"
  ];

  // Test both with and without $file_details=true
  console.log('\n📋 TEST 1: Fetching WITHOUT $file_details parameter');
  console.log('━'.repeat(60));

  const url1 = `https://www.zohoapis.${ZOHO_DC}/crm/v3/Accounts/${accountId}?fields=${fields.join(",")}`;
  console.log(`URL: ${url1}\n`);

  const response1 = await fetch(url1, {
    method: 'GET',
    headers: {
      'Authorization': `Zoho-oauthtoken ${accessToken}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response1.ok) {
    const errorText = await response1.text();
    throw new Error(`Zoho API request failed: ${response1.status} - ${errorText}`);
  }

  const data1 = await response1.json();
  console.log('Response:', JSON.stringify(data1, null, 2));

  // Test with $file_details=true
  console.log('\n\n📋 TEST 2: Fetching WITH $file_details=true parameter');
  console.log('━'.repeat(60));

  const url2 = `https://www.zohoapis.${ZOHO_DC}/crm/v3/Accounts/${accountId}?fields=${fields.join(",")}&$file_details=true`;
  console.log(`URL: ${url2}\n`);

  const response2 = await fetch(url2, {
    method: 'GET',
    headers: {
      'Authorization': `Zoho-oauthtoken ${accessToken}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response2.ok) {
    const errorText = await response2.text();
    throw new Error(`Zoho API request failed: ${response2.status} - ${errorText}`);
  }

  const data2 = await response2.json();
  console.log('Response:', JSON.stringify(data2, null, 2));

  // Analyze the results
  console.log('\n\n📊 ANALYSIS');
  console.log('━'.repeat(60));

  const record1 = data1.data?.[0];
  const record2 = data2.data?.[0];

  console.log('\nAccount Name:', record1?.Account_Name || 'N/A');

  console.log('\n🖼️  Logo field:');
  console.log('  Without $file_details:', record1?.Logo ? JSON.stringify(record1.Logo, null, 2) : '❌ Not present');
  console.log('  With $file_details:', record2?.Logo ? JSON.stringify(record2.Logo, null, 2) : '❌ Not present');

  console.log('\n🖼️  Cover_Image field:');
  console.log('  Without $file_details:', record1?.Cover_Image ? JSON.stringify(record1.Cover_Image, null, 2) : '❌ Not present');
  console.log('  With $file_details:', record2?.Cover_Image ? JSON.stringify(record2.Cover_Image, null, 2) : '❌ Not present');

  // Check field types
  console.log('\n🔍 Field Type Detection:');

  if (record2?.Logo) {
    const logoType = Array.isArray(record2.Logo) ? 'Array' : typeof record2.Logo;
    console.log(`  Logo: ${logoType}`);
    if (Array.isArray(record2.Logo) && record2.Logo.length > 0) {
      console.log('    Has File_Id:', record2.Logo[0]?.File_Id ? '✅' : '❌');
      console.log('    Has file_name:', record2.Logo[0]?.file_name ? '✅' : '❌');
      console.log('    Has download_Url:', record2.Logo[0]?.download_Url ? '✅' : '❌');
    }
  }

  if (record2?.Cover_Image) {
    const coverType = Array.isArray(record2.Cover_Image) ? 'Array' : typeof record2.Cover_Image;
    console.log(`  Cover_Image: ${coverType}`);
    if (Array.isArray(record2.Cover_Image) && record2.Cover_Image.length > 0) {
      console.log('    Has File_Id:', record2.Cover_Image[0]?.File_Id ? '✅' : '❌');
      console.log('    Has file_name:', record2.Cover_Image[0]?.file_name ? '✅' : '❌');
      console.log('    Has download_Url:', record2.Cover_Image[0]?.download_Url ? '✅' : '❌');
    }
  }

  console.log('\n\n✅ Test complete!\n');
}

async function main() {
  const accountId = process.argv[2];

  if (!accountId) {
    console.error('❌ Error: Please provide a Zoho record ID');
    console.log('\nUsage: node test-zoho-images.js <record_id>');
    console.log('Example: node test-zoho-images.js 38729000000292133\n');
    process.exit(1);
  }

  if (!ZOHO_CLIENT_ID || !ZOHO_CLIENT_SECRET || !ZOHO_REFRESH_TOKEN) {
    console.error('❌ Error: Missing required environment variables');
    console.log('\nRequired variables:');
    console.log('  - ZOHO_CLIENT_ID');
    console.log('  - ZOHO_CLIENT_SECRET');
    console.log('  - ZOHO_REFRESH_TOKEN');
    console.log('  - ZOHO_DC (optional, defaults to "com")\n');
    process.exit(1);
  }

  console.log('\n🔍 Testing Zoho CRM Image Upload Fields');
  console.log('━'.repeat(60));
  console.log(`Record ID: ${accountId}`);
  console.log(`Data Center: ${ZOHO_DC}`);

  try {
    console.log('\n🔑 Getting access token...');
    const accessToken = await getAccessToken();
    console.log('✅ Access token obtained');

    await fetchAccountWithImages(accountId, accessToken);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();
