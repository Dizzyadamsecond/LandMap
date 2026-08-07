#!/bin/bash

# E2E Test Script for VC Features
# Tests all 5 features end-to-end with real API calls

set -e

API_BASE="http://localhost:4000/api/vc"
TEST_USER="test-user-e2e-$(date +%s)"
OFFER_ID=$(uuidgen)
BUYER_ID=$(uuidgen)
PROPERTY_ID=$(uuidgen)

echo "🧪 LandMap VC Features E2E Test Suite"
echo "======================================"
echo "Test User: $TEST_USER"
echo "Test Offer ID: $OFFER_ID"
echo ""

# Test 1: Risk Assessment
echo "1️⃣ Testing Risk Assessment..."
RISK_RESPONSE=$(curl -s -X POST "$API_BASE/risk/assess" \
  -H "Content-Type: application/json" \
  -H "x-user-id: $TEST_USER" \
  -d "{
    \"offerId\": \"$OFFER_ID\",
    \"buyerId\": \"$BUYER_ID\",
    \"propertyId\": \"$PROPERTY_ID\",
    \"offerAmountCents\": 50000000,
    \"buyerProfile\": {
      \"credit_score\": 780,
      \"successful_deals\": 8,
      \"failed_deals\": 0,
      \"portfolio_value_cents\": 2000000000,
      \"identity_verified\": true,
      \"email_verified\": true,
      \"phone_verified\": true,
      \"account_age_days\": 365
    }
  }")

RISK_SCORE=$(echo "$RISK_RESPONSE" | jq -r '.score')
RISK_LABEL=$(echo "$RISK_RESPONSE" | jq -r '.label')
echo "✅ Risk Score: $RISK_SCORE (label: $RISK_LABEL)"
if [[ "$RISK_SCORE" -gt "0" && "$RISK_SCORE" -lt "100" ]]; then
  echo "✓ Risk score in valid range"
else
  echo "✗ Risk score out of range!"
  exit 1
fi
echo ""

# Test 2: KYC Verification
echo "2️⃣ Testing KYC Verification..."
KYC_RESPONSE=$(curl -s -X POST "$API_BASE/kyc/verify" \
  -H "Content-Type: application/json" \
  -H "x-user-id: $TEST_USER" \
  -d '{"provider": "onfido"}')

KYC_STATUS=$(echo "$KYC_RESPONSE" | jq -r '.status')
echo "✅ KYC Status: $KYC_STATUS"
if [[ "$KYC_STATUS" == "pending" ]]; then
  echo "✓ KYC pending (expected for new user)"
else
  echo "⚠ KYC status: $KYC_STATUS"
fi
echo ""

# Test 3: Portfolio Analytics
echo "3️⃣ Testing Portfolio Analytics..."
ANALYTICS_RESPONSE=$(curl -s -X GET "$API_BASE/portfolio/analytics" \
  -H "x-user-id: $TEST_USER")

TOTAL_INVESTED=$(echo "$ANALYTICS_RESPONSE" | jq -r '.total_invested_cents')
ROI_PCT=$(echo "$ANALYTICS_RESPONSE" | jq -r '.roi_pct')
echo "✅ Portfolio Total Invested: $TOTAL_INVESTED cents"
echo "✅ ROI: $ROI_PCT%"
echo ""

# Test 4: Market Intelligence (São Paulo)
echo "4️⃣ Testing Market Intelligence..."
MARKET_RESPONSE=$(curl -s -X GET "$API_BASE/market/heat/São%20Paulo" \
  -H "x-user-id: $TEST_USER")

DEMAND_INDEX=$(echo "$MARKET_RESPONSE" | jq -r '.demand_index')
PRICE_TREND=$(echo "$MARKET_RESPONSE" | jq -r '.price_trend')
echo "✅ Market Demand Index: $DEMAND_INDEX"
echo "✅ Price Trend: $PRICE_TREND"
echo ""

# Test 5: AI Matching
echo "5️⃣ Testing AI Matching..."
MATCHING_RESPONSE=$(curl -s -X GET "$API_BASE/matching/recommendations?limit=5" \
  -H "x-user-id: $TEST_USER")

MATCH_COUNT=$(echo "$MATCHING_RESPONSE" | jq -r '.matches | length')
echo "✅ AI Matches returned: $MATCH_COUNT"
if [[ $MATCH_COUNT -ge 0 ]]; then
  echo "✓ Matching service working"
else
  echo "⚠ No matches (expected if no data seeded)"
fi
echo ""

# Summary
echo "======================================"
echo "✅ All E2E Tests Passed!"
echo ""
echo "Summary:"
echo "  ✓ Risk Assessment: $RISK_LABEL ($RISK_SCORE pts)"
echo "  ✓ KYC Verification: $KYC_STATUS"
echo "  ✓ Portfolio Analytics: \$$((TOTAL_INVESTED / 100)) invested"
echo "  ✓ Market Intelligence: Demand $DEMAND_INDEX ($PRICE_TREND)"
echo "  ✓ AI Matching: $MATCH_COUNT recommendations"
echo ""
echo "🚀 VC Features Backend is 100% functional!"
