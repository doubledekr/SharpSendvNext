#!/bin/bash
# Test script to verify production mode behavior

echo "🧪 Testing production mode server behavior..."
echo "=========================================="

# Set production environment
export NODE_ENV=production
export PORT=5001

echo "Environment: NODE_ENV=$NODE_ENV, PORT=$PORT"
echo ""

# Start the server in background
echo "Starting server in production mode..."
timeout 10s npm run dev &
SERVER_PID=$!

# Wait for server to start
sleep 5

# Test health endpoints
echo ""
echo "Testing health endpoints..."
echo "-----------------------------------"
echo "Testing /health endpoint:"
curl -s http://localhost:5001/health | head -c 100
echo ""
echo ""
echo "Testing /api/health-check endpoint:"
curl -s http://localhost:5001/api/health-check | head -c 100
echo ""

# Check if server is still running
if ps -p $SERVER_PID > /dev/null 2>&1; then
    echo ""
    echo "✅ SUCCESS: Server is still running after 10 seconds"
    echo "Process $SERVER_PID is active"
else
    echo ""
    echo "❌ FAILURE: Server exited prematurely"
fi

# Clean up
kill $SERVER_PID 2>/dev/null
wait $SERVER_PID 2>/dev/null

echo ""
echo "Test completed."