Param()
Write-Host "Installing root and workspace dependencies..."
npm install
Write-Host "Installing workspace dependencies..."
npm install --workspaces

if (-not (Test-Path -Path .env)) {
  Write-Host "Creating .env from .env.example"
  Copy-Item .env.example .env
  Write-Host "Please edit .env and set JWT_SECRET and ADMIN_PASSWORD before starting."
}

Write-Host "Setup complete. Run 'npm run dev' to start frontend, admin and backend locally."
