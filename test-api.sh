#!/bin/bash
# 9JA AI API Test Script
# Tests live endpoints at https://9jai.web.app

BASE_URL="https://9jai.web.app"
echo "Testing 9JA AI at: $BASE_URL"
echo "================================"
echo ""

# Test 1: Health Check
echo "1. Testing Health Endpoint..."
curl -s "$BASE_URL/api/v1/health" | head -20
echo ""
echo ""

# Test 2: Chat
echo "2. Testing Chat Endpoint..."
curl -s -X POST "$BASE_URL/api/v1/chat" \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Hello, how are you?"}]}' \
  | head -20
echo ""
echo ""

# Test 3: Image Generation
echo "3. Testing Image Generation..."
curl -s -X POST "$BASE_URL/api/v1/image/generate" \
  -H "Content-Type: application/json" \
  -d '{"prompt":"a simple red circle"}' \
  | head -20
echo ""
echo ""

# Test 4: Search
echo "4. Testing Search Endpoint..."
curl -s -X POST "$BASE_URL/api/v1/search" \
  -H "Content-Type: application/json" \
  -d '{"query":"Nigeria capital city"}' \
  | head -20
echo ""
echo ""

echo "================================"
echo "Test complete!"
echo ""
echo "NEXT STEPS:"
echo "1. Open https://9jai.web.app in browser"
echo "2. Open DevTools (F12) → Network tab"
echo "3. Test features manually from UI"
echo "4. Document what works vs what fails"
