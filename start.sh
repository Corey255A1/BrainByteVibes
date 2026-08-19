#!/usr/bin/env bash

set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"
echo $PROJECT_DIR

echo "=== AntiScroll App Launcher ==="

# Check requirements
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is required but not installed."
    exit 1
fi

if ! command -v python3 &> /dev/null; then
    echo "Error: Python 3 is required but not installed."
    exit 1
fi

# 1. Setup & Launch Backend
echo "--> Setting up Python backend environment..."
cd "$PROJECT_DIR/backend"

if [ ! -d "venv" ]; then
    python3 -m venv venv
fi

source venv/bin/activate
pip install -q --upgrade pip
pip install -q .

echo "--> Launching FastAPI Backend on http://localhost:8000 ..."
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

# Trap signals to shut down backend on script exit
cleanup() {
    echo ""
    echo "--> Shutting down AntiScroll services..."
    if [ -n "$BACKEND_PID" ]; then
        kill "$BACKEND_PID" 2>/dev/null || true
    fi
    exit 0
}
trap cleanup SIGINT SIGTERM EXIT

# 2. Setup & Build Frontend
echo "--> Setting up Frontend PWA dependencies..."
cd "$PROJECT_DIR/frontend"

if [ ! -d "node_modules" ]; then
    npm install
fi

echo "--> Building PWA Frontend production bundle..."
npm run build

echo "--> Starting Frontend PWA preview server on http://localhost:5173 ..."
npm run preview -- --host 0.0.0.0 --port 5173 &
FRONTEND_PID=$!

echo ""
echo "===================================================="
echo "🚀 AntiScroll is up and running!"
echo "   - Frontend PWA: http://localhost:5173"
echo "   - Backend NAS API: http://localhost:8000"
echo "   - API Docs: http://localhost:8000/docs"
echo "Press Ctrl+C to stop all servers."
echo "===================================================="

wait
