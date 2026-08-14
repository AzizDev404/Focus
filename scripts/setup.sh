#!/usr/bin/env bash
set -euo pipefail
echo "Installing root and workspace dependencies..."
npm install
echo "Installing subpackage dependencies..."
npm install --workspaces

if [ ! -f .env ]; then
  echo "Creating .env from .env.example"
  cp .env.example .env
  echo "Please edit .env and set JWT_SECRET and ADMIN_PASSWORD before starting."
fi

echo "Setup complete. Run 'npm run dev' to start frontend, admin and backend locally (requires concurrently)."
