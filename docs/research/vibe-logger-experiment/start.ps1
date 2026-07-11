# Vibe Logger Startup Script
# This script starts the Vibe Logger server and opens the dashboard in the default browser

param(
    [int]$Port = 3001,
    [switch]$NoBrowser = $false
)

# Check if Node.js is installed
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "Node.js is not installed. Please install Node.js first." -ForegroundColor Red
    exit 1
}

# Check if npm is installed
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Host "npm is not installed. Please install npm first." -ForegroundColor Red
    exit 1
}

# Navigate to the vibe-logger directory
$scriptPath = $PSScriptRoot
cd "$scriptPath"

# Install dependencies if not already installed
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Cyan
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to install dependencies." -ForegroundColor Red
        exit 1
    }
}

# Start the server
Write-Host "Starting Vibe Logger server on port $Port..." -ForegroundColor Green
$serverProcess = Start-Process node -ArgumentList "server.js" -PassThru

# Wait for server to start
Start-Sleep -Seconds 2

# Check if server started successfully
try {
    $response = Invoke-WebRequest -Uri "http://localhost:$Port/api/logs" -ErrorAction SilentlyContinue
    if ($response.StatusCode -eq 200) {
        Write-Host "Vibe Logger server is running successfully!" -ForegroundColor Green
    }
} catch {
    Write-Host "Failed to start server. Check the error output above." -ForegroundColor Red
    exit 1
}

# Open browser if requested
if (-not $NoBrowser) {
    try {
        Start-Process "http://localhost:$Port"
        Write-Host "Dashboard opened in default browser." -ForegroundColor Cyan
    } catch {
        Write-Host "Could not open browser automatically. Please open http://localhost:$Port manually." -ForegroundColor Yellow
    }
}

Write-Host "Vibe Logger is ready!" -ForegroundColor Green
Write-Host "Access the dashboard at: http://localhost:$Port" -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop the server." -ForegroundColor Gray

# Keep the script running
try {
    while ($true) {
        Start-Sleep -Seconds 1
    }
} finally {
    Write-Host "Stopping Vibe Logger..." -ForegroundColor Yellow
    $serverProcess | Stop-Process -Force
}
