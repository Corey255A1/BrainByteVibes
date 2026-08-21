#!/bin/bash
set -e

# Packaging Script for BrainByte NAS Deployment
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_DIR="$PROJECT_ROOT/deploy"
ARCHIVE_NAME="brainbyte_nas_deploy.tar.gz"

echo "📦 Packaging BrainByte source code for Synology NAS deployment..."

# Clean old deploy directory
rm -rf "$DEPLOY_DIR"
mkdir -p "$DEPLOY_DIR/source"

# Copy source files excluding heavy build artifacts and dependencies
rsync -av \
  --exclude="node_modules" \
  --exclude="venv" \
  --exclude="dist" \
  --exclude=".git" \
  --exclude=".gitignore" \
  --exclude="__pycache__" \
  --exclude="*.pyc" \
  --exclude="*.db" \
  --exclude=".env" \
  --exclude="deploy" \
  "$PROJECT_ROOT/" "$DEPLOY_DIR/source/"

# Create tar.gz archive for easy upload to Synology File Station
cd "$DEPLOY_DIR/source"
tar -czf "$DEPLOY_DIR/$ARCHIVE_NAME" .

echo ""
echo "=========================================================="
echo "✅ BrainByte successfully packaged!"
echo "=========================================================="
echo "📁 Deploy Directory: $DEPLOY_DIR/source"
echo "🎁 NAS Archive File: $DEPLOY_DIR/$ARCHIVE_NAME"
echo ""
echo "🚀 Synology NAS Container Manager Setup Instructions:"
echo "1. Open Synology File Station and create folder: /docker/brainbyte"
echo "2. Upload '$ARCHIVE_NAME' into /docker/brainbyte and extract it"
echo "3. Open Container Manager -> Project -> Click Create"
echo "4. Set Project Name: 'brainbyte', Path: '/docker/brainbyte'"
echo "5. Select 'Use existing docker-compose.yml' -> Click Next & Build!"
echo "=========================================================="
