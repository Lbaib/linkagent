Write-Host "=== LinkedAgent Backend Startup Script ===" -ForegroundColor Cyan

# 1. Start Docker Desktop Service if not running
Write-Host "1. Checking Docker Desktop Service..." -ForegroundColor Green
$dockerService = Get-Service -Name com.docker.service -ErrorAction SilentlyContinue
if ($dockerService) {
    if ($dockerService.Status -ne 'Running') {
        Write-Host "Starting Docker Desktop Service (com.docker.service)..." -ForegroundColor Yellow
        Start-Service -Name com.docker.service
    } else {
        Write-Host "Docker Desktop Service is already running."
    }
}

# 2. Check and start winnat NAT service to prevent port conflicts (Hyper-V exclusions)
Write-Host "2. Resolving potential port 8848 collisions (winnat)..." -ForegroundColor Green
Restart-Service -Name winnat -Force

# 3. Start middleware via docker compose
Write-Host "3. Starting Docker Middleware (Postgres, Redis, Nacos)..." -ForegroundColor Green
cd "E:\SDD+Harness\LinkAgent\linkedagent-backend"
docker compose up -d

# 4. Wait for Nacos to start (port 8848)
Write-Host "4. Waiting for Nacos Registry to be ready on port 8848..." -ForegroundColor Green
while ($true) {
    $conn = Test-NetConnection -ComputerName 127.0.0.1 -Port 8848 -WarningAction SilentlyContinue
    if ($conn.TcpTestSucceeded) {
        Write-Host "Nacos is online and ready!" -ForegroundColor Green
        break
    }
    Write-Host "Waiting for Nacos..."
    Start-Sleep -Seconds 3
}

# 5. Start microservices in separate persistent windows
Write-Host "5. Launching Microservices in separate PowerShell windows..." -ForegroundColor Green

$services = @(
    @{ Name = "api-gateway"; Title = "[api-gateway:8080]" },
    @{ Name = "chat-server"; Title = "[chat-server:8081]" },
    @{ Name = "customer-service"; Title = "[customer-service:8082]" },
    @{ Name = "ai-rag-service"; Title = "[ai-rag-service:8083]" },
    @{ Name = "system-management"; Title = "[system-management:8084]" }
)

foreach ($service in $services) {
    $name = $service.Name
    $title = $service.Title
    Write-Host "Starting $name..." -ForegroundColor Yellow
    
    # Launch Maven spring-boot:run in a separate window, set the title, and keep the window open on error/finish (-NoExit)
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$Host.UI.RawUI.WindowTitle = '$title'; mvn spring-boot:run -pl $name" -WorkingDirectory "E:\SDD+Harness\LinkAgent\linkedagent-backend"
    
    Start-Sleep -Seconds 2 # staggered boot to reduce system CPU spike
}

Write-Host "=== All microservices launched successfully! ===" -ForegroundColor Green
