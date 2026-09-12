#!/bin/bash

ROOT="$(cd "$(dirname "$0")" && pwd)"

# Kill any old running servers
pkill -f "uvicorn main:app" 2>/dev/null
pkill -f "vite" 2>/dev/null
sleep 1

clear
echo "================================================"
echo "  Lakshmi Vastra Studio — Dev Server"
echo "================================================"
echo "  Website   →  http://localhost:5173"
echo "  Admin     →  http://localhost:5173/admin/login"
echo "  API Docs  →  http://localhost:8000/docs"
echo "  Username  →  admin"
echo "  Password  →  Kishorekumar@646"
echo "================================================"
echo "  Press Ctrl+C to stop all servers"
echo "================================================"
echo ""

# Start backend in background
cd "$ROOT/backend"
source venv/bin/activate
PYTHONUNBUFFERED=1 uvicorn main:app --reload --port 8000 --log-level info &
BACKEND_PID=$!

# Start frontend in foreground (logs stream directly to terminal)
cd "$ROOT/frontend"
npm run dev

# When frontend stops, stop backend too
kill $BACKEND_PID 2>/dev/null
