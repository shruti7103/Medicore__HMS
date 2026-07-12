# MediCore HMS - Start all backend services
. "$PSScriptRoot\load-env.ps1"
$Root = $PSScriptRoot
$DbPassword = Get-DbPasswordFromEnv -Root $Root

if (-not $DbPassword -or $DbPassword -eq 'YOUR_MYSQL_PASSWORD') {
    Write-Host 'ERROR: Open .env and set DB_PASSWORD=your_mysql_password' -ForegroundColor Red
    exit 1
}

$env:DB_PASSWORD = $DbPassword
Write-Host 'Using DB_PASSWORD from .env' -ForegroundColor Green

function Start-ServiceJar($name, $port, $jarPath) {
    $listening = netstat -ano | Select-String ":$port\s.*LISTENING"
    if ($listening) {
        Write-Host "$name already on port $port" -ForegroundColor Yellow
        return
    }
    if (-not (Test-Path $jarPath)) {
        Write-Host "MISSING: $jarPath" -ForegroundColor Red
        return
    }
    Write-Host "Starting $name on port $port..."
    $wd = Split-Path $jarPath
    $jarName = Split-Path $jarPath -Leaf
    # Pass DB_PASSWORD as both env var and JVM system property for reliability
    $jvmArgs = @(
        "-DDB_PASSWORD=$DbPassword",
        '-jar',
        $jarName
    )
    Start-Process -FilePath 'java' -ArgumentList $jvmArgs `
        -WorkingDirectory $wd -WindowStyle Minimized
}

$services = @(
    @{ Name = 'Eureka'; Port = 8761; Jar = "$Root\backend\eureka-server\target\eureka-server-1.0.0.jar" },
    @{ Name = 'Gateway'; Port = 8080; Jar = "$Root\backend\api-gateway\target\api-gateway-1.0.0.jar" },
    @{ Name = 'Auth'; Port = 8081; Jar = "$Root\backend\auth-service\target\auth-service-1.0.0.jar" },
    @{ Name = 'Patient'; Port = 8082; Jar = "$Root\backend\patient-service\target\patient-service-1.0.0.jar" },
    @{ Name = 'Doctor'; Port = 8083; Jar = "$Root\backend\doctor-service\target\doctor-service-1.0.0.jar" },
    @{ Name = 'Appointment'; Port = 8084; Jar = "$Root\backend\appointment-service\target\appointment-service-1.0.0.jar" },
    @{ Name = 'Billing'; Port = 8085; Jar = "$Root\backend\billing-service\target\billing-service-1.0.0.jar" },
    @{ Name = 'Pharmacy'; Port = 8086; Jar = "$Root\backend\pharmacy-service\target\pharmacy-service-1.0.0.jar" },
    @{ Name = 'Notification'; Port = 8087; Jar = "$Root\backend\notification-service\target\notification-service-1.0.0.jar" },
    @{ Name = 'Nurse'; Port = 8088; Jar = "$Root\backend\nurse-service\target\nurse-service-1.0.0.jar" },
    @{ Name = 'Analytics'; Port = 8089; Jar = "$Root\backend\analytics-service\target\analytics-service-1.0.0.jar" },
    @{ Name = 'SymptomCheck'; Port = 8090; Jar = "$Root\backend\symptom-check-service\target\symptom-check-service-1.0.0.jar" }
)

Start-ServiceJar $services[0].Name $services[0].Port $services[0].Jar
Write-Host "Waiting for Eureka (port 8761) to start..." -ForegroundColor Cyan
while (-not (netstat -ano | Select-String ":8761\s.*LISTENING")) {
    Start-Sleep -Seconds 2
}
Write-Host "Eureka is active. Starting other services..." -ForegroundColor Green
Start-Sleep -Seconds 5

foreach ($svc in $services[1..($services.Length - 1)]) {
    Start-ServiceJar $svc.Name $svc.Port $svc.Jar
    Start-Sleep -Seconds 3
}

Write-Host ''
Write-Host 'Backend started. Wait ~45 seconds.' -ForegroundColor Green
Write-Host '  Gateway:  http://localhost:8080'
Write-Host '  Eureka:   http://localhost:8761'
Write-Host '  Login:    admin@medicore.local / Admin@123'
Write-Host ''
Write-Host 'PowerShell commands (use .\ prefix):'
Write-Host '  .\setup-database.ps1'
Write-Host '  .\start-backend.ps1'
Write-Host '  .\run.ps1'
Write-Host ''
Write-Host 'Keeping backend runner alive. Press Ctrl+C to stop.'
while ($true) {
    Start-Sleep -Seconds 10
}
