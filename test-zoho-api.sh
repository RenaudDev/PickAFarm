#!/bin/bash

# Test script to check Zoho image fields via your API
# This will trigger a webhook that fetches data from Zoho

RECORD_ID="${1:-38729000000292133}"
API_URL="http://localhost:8787"

echo ""
echo "🔍 Testing Zoho CRM Image Upload Fields"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Record ID: $RECORD_ID"
echo ""
echo "⚙️  Make sure wrangler dev is running in another terminal!"
echo ""
echo "Testing against: $API_URL/api/test-zoho-fetch"
echo ""

# Trigger the test endpoint
curl -s "$API_URL/api/test-zoho-fetch?id=$RECORD_ID" | jq .

echo ""
echo "✅ Test complete!"
echo ""
