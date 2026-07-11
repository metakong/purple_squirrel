# Vibe Logger Stop Script
# This script stops any running Vibe Logger server

# Find and stop node processes running server.js
$nodeProcesses = Get-Process node -ErrorAction SilentlyContinue

if ($nodeProcesses) {
    foreach ($process in $nodeProcesses) {
        try {
            # Check if this is a Vibe Logger server process
            $commandLine = $process.StartInfo.Arguments
            if ($commandLine -like "*server.js*" -or $commandLine -like "*vibe-logger*server.js*") {
                Write-Host "Stopping Vibe Logger server (PID: $($process.Id))..." -ForegroundColor Yellow
                $process | Stop-Process -Force -ErrorAction SilentlyContinue
                Write-Host "Vibe Logger server stopped." -ForegroundColor Green
            }
        } catch {
            Write-Host "Error stopping process: $_" -ForegroundColor Red
        }
    }
} else {
    Write-Host "No running Vibe Logger server found." -ForegroundColor Gray
}

# Also try to find processes by port
$ports = @(3001, 3000, 8080, 8000)
foreach ($port in $ports) {
    try {
        $process = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($process) {
            $pid = $process.OwningProcess
            $processInfo = Get-Process -Id $pid -ErrorAction SilentlyContinue
            if ($processInfo -and $processInfo.ProcessName -eq "node") {
                Write-Host "Stopping process on port $port (PID: $pid)..." -ForegroundColor Yellow
                $processInfo | Stop-Process -Force -ErrorAction SilentlyContinue
                Write-Host "Process on port $port stopped." -ForegroundColor Green
            }
        }
    } catch {
        # Ignore errors
    }
}

Write-Host "Cleanup complete." -ForegroundColor Green
