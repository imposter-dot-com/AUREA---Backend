#!/bin/bash

echo "🔍 Finding and killing Node.js server processes..."

# Kill all node processes related to server.js
echo "Killing server.js processes..."
pkill -f "node server.js"

# Kill all nodemon processes
echo "Killing nodemon processes..."
pkill -f "nodemon"

# Kill all npm run dev processes
echo "Killing npm run dev processes..."
pkill -f "npm run dev"

# Kill any remaining node processes on port 5000
echo "Killing processes on port 5000..."
lsof -ti :5000 | xargs -r kill -9

# Show remaining node processes
echo ""
echo "📊 Remaining Node.js processes:"
ps aux | grep node | grep -v grep || echo "No Node.js processes found"

echo ""
echo "✅ Server cleanup completed!"