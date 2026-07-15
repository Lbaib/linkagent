Write-Host "=== Starting LinkedAgent Full Stack ===" -ForegroundColor Cyan

# 1. Run backend startup script
Write-Host "1. Starting Backend services..." -ForegroundColor Green
& "$PSScriptRoot\start-backend.ps1"

# 2. Run frontend service
Write-Host "2. Starting Frontend service..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$Host.UI.RawUI.WindowTitle = '[Frontend:5173]'; npm run dev" -WorkingDirectory "$PSScriptRoot\linkedagent-frontend"

Write-Host "=== Everything Started! ===" -ForegroundColor Green
Write-Host "Access Frontend at: http://localhost:5173" -ForegroundColor Cyan
